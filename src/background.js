/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Request Control background script for processing request control rules,
 * adding request listeners and keeping record of resolved requests.
 *
 * Request listener (webRequest.onBeforeListener) is added for each rule.
 * When request matches a rule it will be marked for rule processing.
 *
 * If request is marked for any rule, requestControlListener that listens for all requests calls
 * resolveControlRules to process all marked rules, and a record of the resolved request is
 * added to the records.
 */

const requestListeners = [];
const markedRequests = new Map();
const records = new Map();

browser.storage.local.get("rules").then(init);
browser.storage.onChanged.addListener(init);
browser.tabs.onRemoved.addListener(removeRecords);
browser.webNavigation.onBeforeNavigate.addListener(resetBrowserAction);
browser.runtime.onMessage.addListener(getRecords);

function init(options) {
    let rules = options.rules;
    if (rules.newValue) {
        rules = rules.newValue;
    }
    removeRuleListeners();
    addRuleListeners(rules);
    browser.webRequest.handlerBehaviorChanged();
}

/**
 * Add rule marker request listener for each active rule.
 * Add requestControlListener for listening all requests for rule processing.
 * @param rules array of rules
 */
function addRuleListeners(rules) {
    if (!rules) {
        return;
    }
    for (let i = 0; i < rules.length; i++) {
        if (!rules[i].active) {
            continue;
        }
        let rule = RequestControl.createRule(i, rules[i]);
        let urls = RequestControl.resolveUrls(rules[i].pattern);
        let filter = {
            urls: urls,
            types: rules[i].types
        };
        let listener = function (details) {
            let request = markRequest(details);
            rule.markRequest(request);
        };
        browser.webRequest.onBeforeRequest.addListener(listener, filter);
        requestListeners.push(listener);
    }
    browser.webRequest.onBeforeRequest.addListener(requestControlMainListener,
        {urls: ["<all_urls>"]}, ["blocking"]);
}

function removeRuleListeners() {
    let listener;
    while (requestListeners.length) {
        listener = requestListeners.pop();
        browser.webRequest.onBeforeRequest.removeListener(listener);
    }
    browser.webRequest.onBeforeRequest.removeListener(requestControlMainListener);
}

/**
 * Listen all requests for rule processing.
 * If request has been marked, process marked rules.
 * @param details request details
 * @returns {Promise} a new promise that is resolved after processing rules, if not marked return null
 */
function requestControlMainListener(details) {
    if (markedRequests.has(details.requestId)) {
        return new Promise(function (resolve) {
            processMarkedRules(resolve, details.requestId);
        });
    }
    return null;
}

/**
 * Mark request for rule processing.
 * @param details request detail
 * @returns {details} marked request details
 */
function markRequest(details) {
    if (!markedRequests.has(details.requestId)) {
        markedRequests.set(details.requestId, details);
    }
    return markedRequests.get(details.requestId);
}

/**
 * Process rules marked for request. Add record of processed request.
 * Rule processing follows rule priorities described in the manual.
 * @param resolve when rules processing is finished.
 * @param requestId
 */
function processMarkedRules(resolve, requestId) {
    let request = markedRequests.get(requestId);
    markedRequests.delete(requestId);

    if (request[WHITELIST_ACTION]) {
        WhitelistRule.resolveRequest(resolve, request);
        addRecord(request, WHITELIST_ACTION, request[WHITELIST_ACTION]);
    }
    else if (request[BLOCK_ACTION]) {
        BlockRule.resolveRequest(resolve, request);
        addRecord(request, BLOCK_ACTION, request[BLOCK_ACTION]);
    }
    else { // process both filter and redirect rules
        let requestURL = new URL(request.url);
        let skipRedirectionFilter = false;
        let appliedRules = [];
        let action = null;

        if (request[FILTER_ACTION]) {
            for (let rule of request[FILTER_ACTION]) {
                requestURL = rule.apply(requestURL);
                if (rule.skipRedirectionFilter) {
                    skipRedirectionFilter = true;
                }
                if (requestURL.href !== request.url) {
                    appliedRules.push(rule);
                    action = FILTER_ACTION;
                }
            }
        }

        if (request[REDIRECT_ACTION]) {
            for (let rule of request[REDIRECT_ACTION]) {
                requestURL = rule.apply(requestURL);
                if (requestURL.href !== request.url) {
                    appliedRules.push(rule);
                    action = REDIRECT_ACTION;
                }
            }
        }

        if (appliedRules.length === 0) {
            WhitelistRule.resolveRequest(resolve);
            return;
        }

        request.redirectUrl = requestURL.href;

        // Filter sub frame redirection requests (e.g. Google search link tracking)
        if (request[FILTER_ACTION] && request.type === "sub_frame" && !skipRedirectionFilter) {
            BlockRule.resolveRequest(resolve);
            browser.tabs.update(request.tabId, {
                url: request.redirectUrl
            });
        } else {
            RedirectRule.resolveRequest(resolve, request.redirectUrl);
        }
        addRecord(request, action, appliedRules);
    }
}

/**
 * Get records for current tab.
 * @returns {Promise}
 */
function getRecords() {
    return browser.tabs.query({
        currentWindow: true,
        active: true
    }).then(tabs => {
        return records.get(tabs[0].id);
    });
}

/**
 * Remove records for tab.
 * @param tabId
 */
function removeRecords(tabId) {
    records.delete(tabId);
}

/**
 * Add new record of resolved request.
 * @param request
 * @param action
 * @param rules
 */
function addRecord(request, action, rules) {
    let record = {
        action: action,
        tabId: request.tabId,
        type: request.type,
        url: request.url,
        target: request.redirectUrl,
        timestamp: request.timeStamp,
        rules: rules.map(rule => rule.id)
    };
    let recordsForTab = records.get(request.tabId);
    if (!recordsForTab) {
        recordsForTab = [];
        records.set(request.tabId, recordsForTab);
    }
    recordsForTab.push(record);
    updateBrowserAction(record.tabId, REQUEST_CONTROL_ICONS[action], recordsForTab.length.toString());
}

/**
 * Update browserAction icon, title and badgeText.
 * @param tabId
 * @param badgeIcon
 * @param badgeText number of resolved request on current web navigation cycle.
 */
function updateBrowserAction(tabId, badgeIcon, badgeText) {
    browser.browserAction.setIcon({
        tabId: tabId,
        path: badgeIcon
    });
    browser.browserAction.setBadgeText({
        tabId: tabId,
        text: badgeText
    });
}

function resetBrowserAction(details) {
    if (details.frameId == 0) {
        removeRecords(details.tabId);
        updateBrowserAction(details.tabId, REQUEST_CONTROL_ICONS[NO_ACTION], "");
    }
}

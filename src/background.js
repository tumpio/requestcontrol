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

/**
 * Initialize on rules load.
 */
browser.storage.local.get("rules").then(init);

/**
 * Reload on rules change.
 */
browser.storage.onChanged.addListener(init);

/**
 * Init rule listeners.
 */
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
 * Array of added request listeners for each rule and request control listener.
 * @type {Array}
 */
const requestListeners = [];

/**
 * Add rule marker request listener for each active rule.
 * Add requestControlListener for listening all requests for rule processing.
 * @param rules array of rules
 */
function addRuleListeners(rules) {
    if (!rules) {
        return;
    }
    let filter, listener;
    for (let rule of rules) {
        if (!rule.active) {
            continue;
        }
        let urls = RequestControl.resolveUrls(rule.pattern);
        filter = {
            urls: urls,
            types: rule.types
        };
        listener = new RuleListener(rule);
        browser.webRequest.onBeforeRequest.addListener(listener, filter);
        requestListeners.push(listener);
    }
    browser.webRequest.onBeforeRequest.addListener(requestControlListener,
        {urls: ["<all_urls>"]}, ["blocking"]);
}

/**
 * Remove all set rule marker request listeners and the requestControlListener.
 */
function removeRuleListeners() {
    let listener;
    while (requestListeners.length) {
        listener = requestListeners.pop();
        browser.webRequest.onBeforeRequest.removeListener(listener);
    }
    browser.webRequest.onBeforeRequest.removeListener(requestControlListener);
}

/**
 * Listen all requests for rule processing.
 * If request has been marked, process marked rules.
 * @param details request details
 * @returns {Promise} a new promise that is resolved after processing rules, if not marked return null
 */
function requestControlListener(details) {
    if (markedRequests.has(details.requestId)) {
        return new Promise(function (resolve) {
            processMarkedRules(resolve, details.requestId);
        });
    }
    return null;
}

/**
 * Requests marked for rule processing.
 * @type {Map} requestId -> request details from onBeforeListener.
 */
const markedRequests = new Map();

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
 * Create a new rule listener.
 * @param rule
 * @returns {*} listener
 */
function RuleListener(rule) {
    switch (rule.action) {
        case "whitelist":
            return function (details) {
                details.tag = rule.tag;
                whitelistMarker(details);
            };
        case "block":
            return function (details) {
                details.tag = rule.tag;
                blockMarker(details);
            };
        case "redirect":
            let redirectRule = new RedirectRule(rule.redirectUrl);
            return function (details) {
                details.tag = rule.tag;
                redirectMarker(details, redirectRule);
            };
        case "filter":
            let filterRule = new FilterRule(rule.paramsFilter, rule.trimAllParams, rule.skipRedirectionFilter);
            return function (details) {
                details.tag = rule.tag;
                filterMarker(details, filterRule);
            };
    }
}

/**
 * Mark request for whitelist rule.
 * @param details
 */
function whitelistMarker(details) {
    let request = markRequest(details);
    request.whitelist = true;
}

/**
 * Mark request for block rule.
 * @param details
 */
function blockMarker(details) {
    let request = markRequest(details);
    request.block = true;
}

/**
 * Mark request for redirect rule and
 * add rule for processing.
 * @param details
 * @param rule
 */
function redirectMarker(details, rule) {
    let request = markRequest(details);
    request.redirect = true;

    if (!request.redirectRules) {
        request.redirectRules = [rule];
    } else {
        request.redirectRules.push(rule);
    }
}

/**
 * Mark request for filter rule and
 * add rule for processing.
 * @param details
 * @param rule
 */
function filterMarker(details, rule) {
    let request = markRequest(details);
    request.filter = true;

    if (!request.filterRules) {
        request.filterRules = [rule];
    } else {
        request.filterRules.push(rule);
    }
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

    if (request.whitelist) {
        resolve(null);
        request.action = "whitelist";
    }
    else if (request.block) {
        resolve({cancel: true});
        request.action = "block";
    }
    else {
        let requestURL = new URL(request.url);

        if (request.redirect) {
            for (let rule of request.redirectRules) {
                requestURL = rule.apply(requestURL);
            }
            request.action = "redirect";
        }
        if (request.filter) {
            for (let rule of request.filterRules) {
                requestURL = rule.apply(requestURL);
            }
            request.action = "filter";
        }

        if (requestURL.href !== request.url) {
            request.redirectUrl = requestURL.href;

            // Filter sub frame redirection requests (e.g. Google search link tracking)
            if (request.filter && request.type === "sub_frame" && !request.skipRedirectionFilter) {
                resolve({cancel: true});
                browser.tabs.update(request.tabId, {
                    url: request.redirectUrl
                });
            } else {
                resolve({redirectUrl: request.redirectUrl});
            }
        } else {
            resolve(null);
            request.action = null;
        }
    }

    if (request.action) {
        addRecord(request);
    }
}

/**
 * Records of resolved requests for tabs.
 * @type {Map} tabId -> array of records
 */
const records = new Map();

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
 */
function addRecord(request) {
    let record = {
        action: request.action,
        tabId: request.tabId,
        type: request.type,
        url: request.url,
        target: request.redirectUrl,
        timestamp: request.timeStamp,
        tag: request.tag
    };
    let recordsForTab = records.get(request.tabId);
    if (!recordsForTab) {
        recordsForTab = [];
        records.set(request.tabId, recordsForTab);
    }
    recordsForTab.push(record);
    updateBrowserAction(record.tabId, record.action, recordsForTab.length.toString());
}

/**
 * Update browserAction icon, title and badgeText.
 * @param tabId
 * @param action for icon
 * @param badgeText number of resolved request on current web navigation cycle.
 */
function updateBrowserAction(tabId, action, badgeText) {
    browser.browserAction.setIcon({
        tabId: tabId,
        path: {
            19: "icons/icon-" + action + "@19.png",
            38: "icons/icon-" + action + "@38.png"
        }
    });
    browser.browserAction.setBadgeText({
        tabId: tabId,
        text: badgeText
    });
}

/**
 * Remove records on tab removal.
 */
browser.tabs.onRemoved.addListener(removeRecords);

/**
 * Remove records and reset browser action before starting a new top frame web navigation.
 */
browser.webNavigation.onBeforeNavigate.addListener(function (details) {
    if (details.frameId == 0) {
        removeRecords(details.tabId);
        updateBrowserAction(details.tabId, "blank", "");
    }
});

/**
 *  Get records on message from browserAction. getRecords returns a promise
 *  that is returned as asynchronous response.
 */
browser.runtime.onMessage.addListener(getRecords);

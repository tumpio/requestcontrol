/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Background script for processing Request Control rules, adding request listeners and keeping
 * record of controlled requests.
 *
 * Request listener (webRequest.onBeforeListener) is added for each active rule. When request
 * matches a rule it will be marked for rule processing. The request is then resolved according
 * the marked rules.
 */

const requestListeners = [];
const markedRequests = new Map();
const records = new Map();

browser.storage.local.get().then(init);
browser.storage.onChanged.addListener(initOnChange);
browser.tabs.onRemoved.addListener(removeRecords);
browser.webNavigation.onCommitted.addListener(resetBrowserAction);
browser.runtime.onMessage.addListener(getRecords);

function init(options) {
    if (!options.disabled) {
        addRuleListeners(options.rules);
    }
    browser.webRequest.handlerBehaviorChanged();
}

function initOnChange() {
    removeRuleListeners();
    browser.storage.local.get().then(init);
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
    rules.sort(function (a, b) {
        return a.action - b.action;
    });
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
            RequestControl.markRule(request, rule);
        };
        browser.webRequest.onBeforeRequest.addListener(listener, filter);
        requestListeners.push(listener);
    }
    browser.webRequest.onBeforeRequest.addListener(requestControlListener,
        {urls: ["<all_urls>"]}, ["blocking"]);
}

function removeRuleListeners() {
    let listener;
    while (requestListeners.length) {
        listener = requestListeners.pop();
        browser.webRequest.onBeforeRequest.removeListener(listener);
    }
    browser.webRequest.onBeforeRequest.removeListener(requestControlListener);
}

function requestControlListener(details) {
    if (markedRequests.has(details.requestId)) {
        let request = removeMarkedRequest(details.requestId);
        return request.resolve(requestControlCallback, errorCallback);
    }
    return null;
}

function requestControlCallback(request, action, updateTab) {
    let tabRecordsCount = addRecord({
        action: request.action,
        tabId: request.tabId,
        type: request.type,
        url: request.url,
        target: request.redirectUrl,
        timestamp: request.timeStamp,
        rules: request.rules.map(rule => rule.id)
    });
    updateBrowserAction(request.tabId, REQUEST_CONTROL_ICONS[action], tabRecordsCount.toString());
    if (updateTab) {
        browser.tabs.update(request.tabId, {
            url: request.redirectUrl
        });
    }
}

function errorCallback(request, rule, error) {
    addRecord({
        action: rule.action,
        tabId: request.tabId,
        type: request.type,
        url: request.url,
        timestamp: request.timeStamp,
        rules: [rule.id],
        error: error,
        target: error.target
    });
    updateBrowserAction(request.tabId, REQUEST_CONTROL_ICONS[rule.action], String.fromCodePoint(10071));
}

function markRequest(details) {
    if (!markedRequests.has(details.requestId)) {
        markedRequests.set(details.requestId, details);
        return details;
    }
    return markedRequests.get(details.requestId);
}

function removeMarkedRequest(requestId) {
    let request = markedRequests.get(requestId);
    markedRequests.delete(requestId);
    return request;
}

function getRecords() {
    return browser.tabs.query({
        currentWindow: true,
        active: true
    }).then(tabs => {
        return records.get(tabs[0].id);
    });
}

function removeRecords(tabId) {
    records.delete(tabId);
}

function addRecord(record) {
    let recordsForTab = records.get(record.tabId);
    if (!recordsForTab) {
        recordsForTab = [];
        records.set(record.tabId, recordsForTab);
    }
    recordsForTab.push(record);
    return recordsForTab.length;
}

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
    if (details.frameId === 0 && records.has(details.tabId)) {
        let tabRecords = records.get(details.tabId);
        let lastRecord = tabRecords[tabRecords.length - 1];
        if (lastRecord.target === details.url) {
            // Keep record of the new main frame request
            records.set(details.tabId, [lastRecord]);
            updateBrowserAction(details.tabId, REQUEST_CONTROL_ICONS[lastRecord.action], "1");
        } else {
            removeRecords(details.tabId);
            updateBrowserAction(details.tabId, REQUEST_CONTROL_ICONS[NO_ACTION], "");
        }
    }
}

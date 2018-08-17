/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {createMatchPatterns, createRule, markRequest} from "./RequestControl/api.js";
import {DISABLED_STATE, NO_ACTION, REQUEST_CONTROL_ICONS} from "./RequestControl/base.js";

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

function init(options) {
    if (!options.disabled) {
        addRuleListeners(options.rules);
        updateBrowserAction(null, REQUEST_CONTROL_ICONS[NO_ACTION], "");
        browser.tabs.onRemoved.addListener(removeRecords);
        browser.webNavigation.onCommitted.addListener(resetBrowserAction);
        browser.runtime.onMessage.addListener(getRecords);
    } else {
        updateBrowserAction(null, REQUEST_CONTROL_ICONS[DISABLED_STATE], "");
        for (let [tabId,] of records) {
            updateBrowserAction(tabId, null, "");
        }
        records.clear();
        markedRequests.clear();
        browser.tabs.onRemoved.removeListener(removeRecords);
        browser.webNavigation.onCommitted.removeListener(resetBrowserAction);
        browser.runtime.onMessage.removeListener(getRecords);
    }
    browser.webRequest.handlerBehaviorChanged();
}

function initOnChange() {
    let listener;
    while (requestListeners.length) {
        listener = requestListeners.pop();
        browser.webRequest.onBeforeRequest.removeListener(listener);
    }
    browser.webRequest.onBeforeRequest.removeListener(requestControlListener);
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
    for (let data of rules) {
        if (!data.active) {
            continue;
        }
        let rule = createRule(data);
        let urls = createMatchPatterns(data.pattern);
        let filter = {
            urls: urls,
            types: data.types
        };
        let listener = function (details) {
            let request = markedRequests.get(details.requestId) || details;
            if (markRequest(request, rule)) {
                markedRequests.set(request.requestId, request);
            }
        };
        browser.webRequest.onBeforeRequest.addListener(listener, filter);
        requestListeners.push(listener);
    }
    browser.webRequest.onBeforeRequest.addListener(requestControlListener,
        {urls: ["<all_urls>"]}, ["blocking"]);
}

function requestControlListener(details) {
    console.log((typeof details.originUrl) + " -> " + details.url);
    if (markedRequests.has(details.requestId)) {
        let request = markedRequests.get(details.requestId);
        markedRequests.delete(request.requestId);
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
        rules: request.rules.map(rule => rule.uuid)
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
        rules: [rule.uuid],
        error: error,
        target: error.target
    });
    updateBrowserAction(request.tabId, REQUEST_CONTROL_ICONS[rule.action], String.fromCodePoint(10071));
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

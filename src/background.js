/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {createMatchPatterns, createRule, markRequest} from "./RequestControl/api.js";
import {getNotifier} from "./notifier.js";

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
let notifier;

Promise.all([
    browser.runtime.getBrowserInfo(),
    browser.storage.local.get()
]).then(([browserInfo, options]) => {
    notifier = getNotifier(browserInfo);
    init(options);
    browser.storage.onChanged.addListener(initOnChange);
});

function init(options) {
    if (options.disabled) {
        notifier.disabledState(records);
        records.clear();
        markedRequests.clear();
        browser.tabs.onRemoved.removeListener(removeRecords);
        browser.webNavigation.onCommitted.removeListener(resetRecords);
        browser.runtime.onMessage.removeListener(getRecords);
    } else {
        addRuleListeners(options.rules);
        notifier.enabledState();
        browser.tabs.onRemoved.addListener(removeRecords);
        browser.webNavigation.onCommitted.addListener(resetRecords);
        browser.runtime.onMessage.addListener(getRecords);
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
    notifier.notify(request.tabId, action, tabRecordsCount);
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
    notifier.error(request.tabId, rule.action, error);
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

function resetRecords(details) {
    if (details.frameId === 0 && records.has(details.tabId)) {
        let tabRecords = records.get(details.tabId);
        let lastRecord = tabRecords[tabRecords.length - 1];
        if (lastRecord.target === details.url) {
            // Keep record of the new main frame request
            records.set(details.tabId, [lastRecord]);
            notifier.notify(details.tabId, lastRecord.action, 1);
        } else {
            removeRecords(details.tabId);
            notifier.clear(details.tabId);
        }
    }
}

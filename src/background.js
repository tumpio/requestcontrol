/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
    createMatchPatterns,
    createRule,
    ALL_URLS
} from "./RequestControl/api.js";
import { getNotifier } from "./notifier.js";
import { RequestController } from "./RequestControl/control.js";
import * as records from "./records.js";

const requestListeners = [];
const controller = new RequestController();
let notifier;

browser.storage.local.get().then(async options => {
    notifier = await getNotifier();
    init(options);
    browser.storage.onChanged.addListener(initOnChange);
});

function init(options) {
    if (options.disabled) {
        browser.tabs.onRemoved.removeListener(records.removeTabRecords);
        browser.runtime.onMessage.removeListener(records.getTabRecords);
        browser.webNavigation.onCommitted.removeListener(onNavigation);
        notifier.disabledState(records.all());
        records.clear();
        controller.clear();
    } else {
        browser.tabs.onRemoved.addListener(records.removeTabRecords);
        browser.runtime.onMessage.addListener(records.getTabRecords);
        browser.webNavigation.onCommitted.addListener(onNavigation);
        notifier.enabledState();
        addRuleListeners(options.rules);
    }
    browser.webRequest.handlerBehaviorChanged();
}

function initOnChange() {
    while (requestListeners.length) {
        browser.webRequest.onBeforeRequest.removeListener(requestListeners.pop());
    }
    browser.webRequest.onBeforeRequest.removeListener(requestControlListener);
    browser.storage.local.get().then(init);
}

function addRuleListeners(rules) {
    if (!rules) {
        return;
    }
    for (let data of rules) {
        if (!data.active) {
            continue;
        }
        try {
            let rule = createRule(data);
            let urls = createMatchPatterns(data.pattern);
            let filter = {
                urls: urls,
                types: data.types
            };
            let listener = details => {
                controller.markRequest(details, rule);
            };
            browser.webRequest.onBeforeRequest.addListener(listener, filter);
            requestListeners.push(listener);
        } catch {
            notifier.error(null, browser.i18n.getMessage("error_invalid_rule"));
        }
    }
    browser.webRequest.onBeforeRequest.addListener(
        requestControlListener,
        { urls: [ALL_URLS] },
        ["blocking"]
    );
}

function requestControlListener(request) {
    return controller.resolve(request, (request, updateTab = false) => {
        if (updateTab) {
            browser.tabs.update(request.tabId, {
                url: request.redirectUrl
            }).then(recordAndNotify(request));
        } else {
            recordAndNotify(request);
        }
    });
}

function recordAndNotify(request) {
    let count = records.add(request.tabId, {
        type: request.type,
        url: request.url,
        target: request.redirectUrl,
        timestamp: request.timeStamp,
        rule: request.rule
    });
    notifier.notify(request.tabId, request.rule, count);
}

function onNavigation(details) {
    if (details.frameId !== 0 || !records.has(details.tabId)) {
        return;
    }
    let isServerRedirect = details.transitionQualifiers.includes("server_redirect");
    let keep = records.getLastRedirectRecords(details.tabId, details.url, isServerRedirect);

    if (keep.length) {
        records.setTabRecords(details.tabId, keep);
        notifier.notify(details.tabId, keep[keep.length - 1].rule, keep.length);
    } else {
        records.removeTabRecords(details.tabId);
        notifier.clear(details.tabId);
    }
}

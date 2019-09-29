/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
    createMatchPatterns,
    createRule,
    ALL_URLS
} from "./main/api.js";
import { getNotifier } from "./notifier.js";
import { RequestController } from "./main/control.js";
import * as records from "./records.js";

const listeners = [];
const controller = new RequestController(notify, updateTab);
let notifier;

browser.storage.local.get().then(async options => {
    notifier = await getNotifier();
    init(options);
    browser.storage.onChanged.addListener(onChanged);
});

function init(options) {
    if (options.disabled) {
        browser.tabs.onRemoved.removeListener(records.removeTabRecords);
        browser.runtime.onMessage.removeListener(records.getTabRecords);
        browser.webNavigation.onCommitted.removeListener(onNavigation);
        notifier.disabledState(records.all());
        records.clear();
        controller.requests.clear();
    } else {
        browser.tabs.onRemoved.addListener(records.removeTabRecords);
        browser.runtime.onMessage.addListener(records.getTabRecords);
        browser.webNavigation.onCommitted.addListener(onNavigation);
        notifier.enabledState();
        addListeners(options.rules);
    }
    browser.webRequest.handlerBehaviorChanged();
}

function onChanged() {
    while (listeners.length) {
        browser.webRequest.onBeforeRequest.removeListener(listeners.pop());
    }
    browser.webRequest.onBeforeRequest.removeListener(controlListener);
    browser.storage.local.get().then(init);
}

function addListeners(rules) {
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
            let listener = request => {
                controller.mark(request, rule);
            };
            browser.webRequest.onBeforeRequest.addListener(listener, filter);
            listeners.push(listener);
        } catch {
            notifier.error(null, browser.i18n.getMessage("error_invalid_rule"));
        }
    }
    browser.webRequest.onBeforeRequest.addListener(
        controlListener,
        { urls: [ALL_URLS] },
        ["blocking"]
    );
}

function controlListener(request) {
    return controller.resolve(request);
}

function updateTab(tabId, url) {
    return browser.tabs.update(tabId, {
        url: url
    });
}

function notify(rule, request, target = null) {
    let count = records.add(request.tabId, {
        type: request.type,
        url: request.url,
        target: target,
        timestamp: request.timeStamp,
        rule: rule
    });
    notifier.notify(request.tabId, rule, count);
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

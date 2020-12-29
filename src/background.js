/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createMatchPatterns, createRule, ALL_URLS } from "./main/api.js";
import * as notifier from "./util/notifier.js";
import { RequestController } from "./main/control.js";
import * as records from "./util/records.js";

const listeners = [];
const controller = new RequestController(notify, updateTab);
const storageKeys = ["rules", "disabled"];

browser.storage.local.get(storageKeys).then(init);
browser.storage.onChanged.addListener(onOptionsChanged);

function init(options) {
    if (options.disabled) {
        browser.tabs.onRemoved.removeListener(records.removeTabRecords);
        browser.runtime.onMessage.removeListener(records.getTabRecords);
        browser.webNavigation.onCommitted.removeListener(onNavigation);
        notifier.disabledState();
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

function onOptionsChanged(changes) {
    if (storageKeys.every((key) => !(key in changes))) {
        return;
    }
    while (listeners.length > 0) {
        browser.webRequest.onBeforeRequest.removeListener(listeners.pop());
    }
    browser.webRequest.onBeforeRequest.removeListener(controlListener);
    browser.storage.local.get(storageKeys).then(init);
}

function addListeners(rules) {
    if (!rules) {
        return;
    }
    for (const data of rules) {
        if (!data.active) {
            continue;
        }
        try {
            const rule = createRule(data);
            const urls = createMatchPatterns(data.pattern);
            const filter = {
                urls,
                types: data.types,
            };
            const listener = (request) => {
                controller.mark(request, rule);
            };
            browser.webRequest.onBeforeRequest.addListener(listener, filter);
            listeners.push(listener);
        } catch {
            notifier.error();
        }
    }
    browser.webRequest.onBeforeRequest.addListener(controlListener, { urls: [ALL_URLS] }, ["blocking"]);
}

function controlListener(request) {
    return controller.resolve(request);
}

function updateTab(tabId, url) {
    return browser.tabs.update(tabId, {
        url,
    });
}

function notify(rule, request, target = null) {
    const count = records.add(request.tabId, {
        action: rule.constructor.action,
        type: request.type,
        url: request.url,
        target,
        timestamp: request.timeStamp,
        rule,
    });
    notifier.notify(request.tabId, rule.constructor.icon, count);
}

function onNavigation(details) {
    if (details.frameId !== 0 || !records.has(details.tabId)) {
        return;
    }
    const isServerRedirect = details.transitionQualifiers.includes("server_redirect");
    const keep = records.getLastRedirectRecords(details.tabId, details.url, isServerRedirect);

    if (keep.length > 0) {
        records.setTabRecords(details.tabId, keep);
        notifier.notify(details.tabId, keep[keep.length - 1].rule.constructor.icon, keep.length);
    } else {
        records.removeTabRecords(details.tabId);
        notifier.clear(details.tabId);
    }
}

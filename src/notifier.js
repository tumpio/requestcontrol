/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const DISABLED_ICON = "/icons/icon-disabled.svg";
const DEFAULT_ICON = "/icons/icon.svg";

class TitleNotifier {
    static notify(tabId, rule, recordsCount) {
        updateTitle(tabId, recordsCount.toString());
    }

    static error(tabId, error) {
        updateTitle(tabId, error);
    }

    static clear(tabId) {
        updateTitle(tabId, "");
    }

    static disabledState(records) {
        updateTitle(null, "Disabled");
        for (let [tabId,] of records) {
            updateTitle(tabId, "");
        }
    }

    static enabledState() {
        updateTitle(null, "");
    }
}

class BadgeNotifier extends TitleNotifier {

    constructor() {
        super();
        browser.browserAction.setBadgeBackgroundColor({ color: "#E6E6E6" });
    }

    static notify(tabId, rule, recordsCount) {
        super.notify(tabId, rule, recordsCount);
        updateBadge(tabId, rule.constructor.icon, recordsCount.toString());
    }

    static error(tabId, error) {
        super.error(tabId, error);
        updateBadge(tabId, DEFAULT_ICON, "!");
    }

    static clear(tabId) {
        super.clear(tabId);
        updateBadge(tabId, DEFAULT_ICON, "");
    }

    static disabledState(records) {
        super.disabledState(records);
        updateBadge(null, DISABLED_ICON, "");
        for (let [tabId,] of records) {
            updateBadge(tabId, null, "");
        }
    }

    static enabledState() {
        super.enabledState();
        updateBadge(null, DEFAULT_ICON, "");
    }
}

export function getNotifier() {
    return browser.runtime.getBrowserInfo()
        .then(info => {
            if (info.name === "Fennec") {
                return TitleNotifier;
            } else {
                return BadgeNotifier;
            }
        });
}

function updateBadge(tabId, icon, text) {
    browser.browserAction.setBadgeText({
        tabId: tabId,
        text: text
    });
    browser.browserAction.setIcon({
        tabId: tabId,
        path: icon
    });
}

function updateTitle(tabId, state) {
    let title;
    if (state) {
        title = browser.i18n.getMessage("main_title_with_state", state);
    } else {
        title = browser.i18n.getMessage("extensionName");
    }
    browser.browserAction.setTitle({
        tabId: tabId,
        title: title
    });
}

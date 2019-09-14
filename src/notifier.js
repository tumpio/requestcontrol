/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
    BLOCK_ACTION,
    DISABLED_STATE,
    FILTER_ACTION,
    NO_ACTION,
    REDIRECT_ACTION,
    WHITELIST_ACTION
} from "./RequestControl/base.js";

export const REQUEST_CONTROL_ICONS = {
    [NO_ACTION]: "/icons/icon.svg",
    [DISABLED_STATE]: "/icons/icon-disabled.svg",
    [WHITELIST_ACTION]: "/icons/icon-whitelist.svg",
    [BLOCK_ACTION]: "/icons/icon-block.svg",
    [FILTER_ACTION]: "/icons/icon-filter.svg",
    [REDIRECT_ACTION]: "/icons/icon-redirect.svg",
    [FILTER_ACTION | REDIRECT_ACTION]: "/icons/icon-redirect.svg"
};

class TitleNotifier {
    static notify(tabId, action, recordsCount) {
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

    static notify(tabId, action, recordsCount) {
        super.notify(tabId, action, recordsCount);
        updateBadge(tabId, REQUEST_CONTROL_ICONS[action], recordsCount.toString());
    }

    static error(tabId, error) {
        super.error(tabId, error);
        updateBadge(tabId, REQUEST_CONTROL_ICONS[NO_ACTION], "!");
    }

    static clear(tabId) {
        super.clear(tabId);
        updateBadge(tabId, REQUEST_CONTROL_ICONS[NO_ACTION], "");
    }

    static disabledState(records) {
        super.disabledState(records);
        updateBadge(null, REQUEST_CONTROL_ICONS[DISABLED_STATE], "");
        for (let [tabId,] of records) {
            updateBadge(tabId, null, "");
        }
    }

    static enabledState() {
        super.enabledState();
        updateBadge(null, REQUEST_CONTROL_ICONS[NO_ACTION], "");
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

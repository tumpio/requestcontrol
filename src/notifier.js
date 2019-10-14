/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const DISABLED_ICON = "/icons/icon-disabled.svg";
const DEFAULT_ICON = "/icons/icon.svg";
const DEFAULT_BADGE_COLOR = "#f9f9fa";

class TitleNotifier {

    static notify(tabId, rule, recordsCount) {
        updateTitle(tabId, recordsCount.toString());
    }

    static error(tabId, error) {
        updateTitle(tabId, error);
    }

    static clear(tabId) {
        updateTitle(tabId);
    }

    static disabledState(records) {
        updateTitle(null, "Disabled");
        for (let [tabId,] of records) {
            updateTitle(tabId);
        }
    }

    static enabledState() {
        updateTitle();
    }
}

class BadgeNotifier extends TitleNotifier {

    static notify(tabId, rule, recordsCount) {
        super.notify(tabId, rule, recordsCount);
        updateBadge(tabId, rule.constructor.icon, recordsCount.toString());
    }

    static error(tabId, error) {
        super.error(tabId, error);
        updateBadge(tabId, DEFAULT_ICON, "!", "#d70022");
    }

    static clear(tabId) {
        super.clear(tabId);
        updateBadge(tabId);
    }

    static disabledState(records) {
        super.disabledState(records);
        updateBadge(null, DISABLED_ICON);
        for (let [tabId,] of records) {
            updateBadge(tabId);
        }
    }

    static enabledState() {
        super.enabledState();
        updateBadge();
    }
}

export function getNotifier() {
    return browser.runtime.getBrowserInfo()
        .then(info => {
            if (info.name === "Fennec") {
                return TitleNotifier;
            }
            return BadgeNotifier;
        });
}

function updateBadge(
    tabId = null,
    icon = DEFAULT_ICON,
    text = "",
    color = DEFAULT_BADGE_COLOR
) {
    browser.browserAction.setBadgeText({
        tabId: tabId,
        text: text
    });
    browser.browserAction.setIcon({
        tabId: tabId,
        path: icon
    });
    browser.browserAction.setBadgeBackgroundColor({ color: color });
}

function updateTitle(tabId = null, state = "") {
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

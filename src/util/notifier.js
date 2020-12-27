/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { OPTION_SHOW_COUNTER, OPTION_CHANGE_ICON } from "../options/constants.js";

const DISABLED_ICON = "/icons/icon-disabled.svg";
const DEFAULT_ICON = "/icons/icon.svg";

class Notifier {
    static notify(tabId, icon, text) {
        setIconWithBadgeText(tabId, icon, text);
    }
}

class NotifierNoBadgeText {
    static notify(tabId, icon) {
        setIcon(tabId, icon);
    }
}

class NotifierNoIcon {
    static notify(tabId, _icon, text) {
        setBadgeText(tabId, text);
    }
}

class EmptyNotifier {
    static notify() {}
}

let notifier = Notifier;

updateNotifier();

browser.storage.onChanged.addListener((changes) => {
    if (OPTION_SHOW_COUNTER in changes) {
        if (!changes[OPTION_SHOW_COUNTER].newValue) {
            clearBadgeText();
        }
        updateNotifier();
    }
    if (OPTION_CHANGE_ICON in changes) {
        if (!changes[OPTION_CHANGE_ICON].newValue) {
            clearIcon();
        }
        updateNotifier();
    }
});

export function notify(tabId, icon, count) {
    notifier.notify(tabId, icon, count.toString());
}

export function error() {
    setIconWithBadgeText(null, DEFAULT_ICON, "!", { badge: "red", badgeText: "white" });
}

export function clear(tabId) {
    setIconWithBadgeText(tabId);
}

export function disabledState() {
    setIconWithBadgeText(null, DISABLED_ICON);
    clearIcon();
    clearBadgeText();
}

export function enabledState() {
    setIconWithBadgeText();
}

function setIconWithBadgeText(tabId, icon, text, colors) {
    setIcon(tabId, icon);
    setBadgeText(tabId, text, colors);
}

function setIcon(tabId = null, icon = DEFAULT_ICON) {
    browser.browserAction.setIcon({
        tabId: tabId,
        path: icon,
    });
}

function setBadgeText(tabId = null, text = null, colors = { badge: "#eef", badgeText: "#0c0c0d" }) {
    browser.browserAction.setBadgeText({
        tabId: tabId,
        text: text,
    });
    browser.browserAction.setBadgeBackgroundColor({ color: colors.badge });
    browser.browserAction.setBadgeTextColor({ color: colors.badgeText });
}

async function updateNotifier() {
    const options = await browser.storage.local.get({
        [OPTION_SHOW_COUNTER]: true,
        [OPTION_CHANGE_ICON]: true,
    });
    if (Object.values(options).every((option) => !option)) {
        notifier = EmptyNotifier;
    } else if (!options[OPTION_SHOW_COUNTER]) {
        notifier = NotifierNoBadgeText;
    } else if (!options[OPTION_CHANGE_ICON]) {
        notifier = NotifierNoIcon;
    } else {
        notifier = Notifier;
    }
}

async function clearIcon() {
    const tabs = await browser.tabs.query({});
    tabs.forEach((tab) => setIcon(tab.id, null));
}

async function clearBadgeText() {
    const tabs = await browser.tabs.query({});
    tabs.forEach((tab) => setBadgeText(tab.id));
}

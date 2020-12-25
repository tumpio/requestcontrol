/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const DISABLED_ICON = "/icons/icon-disabled.svg";
const DEFAULT_ICON = "/icons/icon.svg";

export function notify(tabId, icon, count) {
    updateBadge(tabId, icon, count.toString());
}

export function error(tabId) {
    updateBadge(tabId, DEFAULT_ICON, "!", { badge: "red", badgeText: "white" });
}

export function clear(tabId) {
    updateBadge(tabId);
}

export function disabledState(tabIds) {
    updateBadge(null, DISABLED_ICON);
    for (let tabId of tabIds) {
        updateBadge(tabId);
    }
}

export function enabledState() {
    updateBadge();
}

function updateBadge(tabId = null, icon = DEFAULT_ICON, text = "", colors = { badge: "#eef", badgeText: "#0c0c0d" }) {
    browser.browserAction.setBadgeText({
        tabId: tabId,
        text: text,
    });
    browser.browserAction.setIcon({
        tabId: tabId,
        path: icon,
    });
    browser.browserAction.setBadgeBackgroundColor({ color: colors.badge });
    browser.browserAction.setBadgeTextColor({ color: colors.badgeText });
}

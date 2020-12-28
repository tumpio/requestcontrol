/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

document.addEventListener("DOMContentLoaded", setTabFromHash);

window.addEventListener("hashchange", setTabFromHash);

function setTabFromHash() {
    const { hash } = window.location;
    const tabHash = "#tab-";
    if (hash.startsWith(tabHash)) {
        changeTab(hash.substring(tabHash.length));
    }
}

function changeTab(tab) {
    const tabInfo = tab.split("#");
    const tabSelector = document.querySelector(`.tab-selector[href='#tab-${tabInfo[0]}']`);
    if (!tabSelector || tabSelector.classList.contains("active")) {
        return;
    }
    document.querySelectorAll(".tab-selector.active").forEach((selector) => selector.classList.remove("active"));
    tabSelector.classList.add("active");

    document.querySelectorAll(".tab-pane.active").forEach((tab) => tab.classList.remove("active"));
    document.getElementById(`tab-${tabInfo[0]}`).classList.add("active");

    document.title = browser.i18n.getMessage(tabSelector.dataset.tabTitle);

    if (tabInfo[1]) {
        history.replaceState(tabInfo[1], tabInfo[1], `#${tabInfo[1]}`);
        window.location.hash = tabInfo[1];
    }
}

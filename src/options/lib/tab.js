/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

document.addEventListener("DOMContentLoaded", setTabFromHash);

window.addEventListener("hashchange", setTabFromHash);

function setTabFromHash() {
    const hash = window.location.hash;
    const tabHash = "#tab-";
    if (hash.startsWith(tabHash)) {
        changeTab(hash.substring(tabHash.length));
    }
}

function changeTab(tab) {
    const tabInfo = tab.split("#");
    const tabSelector = document.querySelector(".tab-selector[data-tab=" + tabInfo[0] + "]");
    if (!tabSelector || tabSelector.classList.contains("active")) {
        return;
    }
    document.getElementById("tabs").querySelector(".active").classList.remove("active");
    tabSelector.classList.add("active");
    document.querySelector(".tab-pane.active").classList.remove("active");
    document.getElementById(tabSelector.dataset.tab + "Tab").classList.add("active");

    document.title = browser.i18n.getMessage(tabSelector.dataset.tabTitle);

    if (tabInfo[1]) {
        history.replaceState(tabInfo[1], tabInfo[1], "#" + tabInfo[1]);
        window.location.hash = tabInfo[1];
    }
}

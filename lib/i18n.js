/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

document.addEventListener("DOMContentLoaded", function () {
    let textNodes = document.querySelectorAll("[data-i18n]");
    let titleNodes = document.querySelectorAll("[data-i18n-title]");
    let placeholderNodes = document.querySelectorAll("[data-i18n-placeholder]");
    let linkNodes = document.querySelectorAll("[data-i18n-href]");

    for (let node of textNodes) {
        node.textContent = browser.i18n.getMessage(node.dataset.i18n);
    }
    for (let node of titleNodes) {
        node.title = browser.i18n.getMessage(node.dataset.i18nTitle);
    }
    for (let node of placeholderNodes) {
        node.placeholder = browser.i18n.getMessage(node.dataset.i18nPlaceholder);
    }
    for (let node of linkNodes) {
        let href = node.dataset.i18nHref.split("#");
        node.href = browser.i18n.getMessage(href[0]);
        if (href[1]) {
            node.href += "#" + href[1];
        }
    }
});
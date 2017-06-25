/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function translateDocument(document) {
    let textNodes = document.querySelectorAll("[data-i18n]");
    let titleNodes = document.querySelectorAll("[data-i18n-title]");
    let placeholderNodes = document.querySelectorAll("[data-i18n-placeholder]");

    for (let node of textNodes) {
        node.textContent = browser.i18n.getMessage(node.dataset.i18n);
    }
    for (let node of titleNodes) {
        node.title = browser.i18n.getMessage(node.dataset.i18nTitle);
    }
    for (let node of placeholderNodes) {
        node.placeholder = browser.i18n.getMessage(node.dataset.i18nPlaceholder);
    }
}

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


/**
 * i18n WebExt-API HTML document translator
 * Translates nodes marked with dataset (data-i18n, data-i18n-title, data-i18n-placeholder)
 * attributes on DOMContentLoaded.
 * @param documentNode
 */
function translateDocument(documentNode) {
    let textNodes = documentNode.querySelectorAll("[data-i18n]");
    let titleNodes = documentNode.querySelectorAll("[data-i18n-title]");
    let placeholderNodes = documentNode.querySelectorAll("[data-i18n-placeholder]");

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

document.addEventListener("DOMContentLoaded", function () {
    translateDocument(document);
});

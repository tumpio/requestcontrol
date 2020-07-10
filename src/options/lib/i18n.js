/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * i18n WebExt-API HTML document translator
 * Translates nodes marked with dataset (data-i18n, data-i18n-title, data-i18n-placeholder)
 * attributes on DOMContentLoaded.
 * @param documentNode
 */
export function translateDocument(documentNode) {
    documentNode.querySelectorAll("[data-i18n]").forEach((node) => {
        node.textContent = browser.i18n.getMessage(node.dataset.i18n);
    });
    documentNode.querySelectorAll("[data-i18n-title]").forEach((node) => {
        node.title = browser.i18n.getMessage(node.dataset.i18nTitle);
    });
    documentNode.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
        node.placeholder = browser.i18n.getMessage(node.dataset.i18nPlaceholder);
    });
}

export function translateTemplates() {
    for (let template of document.getElementsByTagName("template")) {
        translateDocument(template.content);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    translateDocument(document);
});

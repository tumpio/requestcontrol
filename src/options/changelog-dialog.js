/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import ModalDialog from "./modal-dialog.js";

class ChangelogDialog extends ModalDialog {
    async connectedCallback() {
        super.connectedCallback();
        this.shadowRoot.getElementById("title").textContent = browser.i18n.getMessage("changelog");
        const content = await fetchChangelog();
        this.shadowRoot.getElementById("content").append(...content);
    }
}

customElements.define("changelog-dialog", ChangelogDialog);

export function showChangelog() {
    const dialog = document.createElement("changelog-dialog");
    document.body.append(dialog);
}

async function fetchChangelog() {
    const response = await fetch("/CHANGELOG.md");
    const content = await response.text();
    const elements = [];

    let ul = document.createElement("ul");
    let start = false;

    for (const line of content.split("\n")) {
        if (!start) {
            if (line.startsWith("##")) {
                start = true;
            }
            continue;
        }
        if (line.startsWith("-")) {
            const li = document.createElement("li");
            const text = line.split(/(#\d+|@\w+)/);
            li.textContent = text[0].replace(/^- /, "");
            for (let i = 1; i < text.length; i++) {
                if (text[i].startsWith("#")) {
                    const link = document.createElement("a");
                    link.textContent = text[i];
                    link.href = `https://github.com/tumpio/requestcontrol/issues/${text[i].substring(1)}`;
                    link.target = "_blank";
                    li.append(link);
                } else if (text[i].startsWith("@")) {
                    const link = document.createElement("a");
                    link.textContent = text[i];
                    link.href = `https://github.com/${text[i].substring(1)}`;
                    link.target = "_blank";
                    li.append(link);
                } else {
                    li.append(text[i]);
                }
            }
            if (/fix/i.test(line)) {
                li.classList.add("fix");
            } else if (/add/i.test(line)) {
                li.classList.add("add");
            } else if (/change/i.test(line)) {
                li.classList.add("change");
            } else if (/update/i.test(line)) {
                li.classList.add("update");
            } else if (/locale/i.test(line)) {
                li.classList.add("locale");
            }
            ul.appendChild(li);
        } else {
            const h = document.createElement("h6");
            h.textContent = line.substring(2);
            elements.push(h);
            ul = document.createElement("ul");
            elements.push(ul);
        }
    }
    return elements;
}

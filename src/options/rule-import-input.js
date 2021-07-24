/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

class RuleImportInput extends HTMLElement {
    constructor() {
        super();
        this.rules = [];
        this._data = {};
        const template = document.getElementById("rule-import-input");
        this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));

        this.shadowRoot.getElementById("select").addEventListener("change", (e) => {
            if (e.target.checked) {
                this.setAttribute("selected", "selected");
            } else {
                this.removeAttribute("selected");
            }
            this.dispatchEvent(
                new CustomEvent("rule-import-selected", {
                    bubbles: true,
                    composed: true,
                })
            );
        });

        this.shadowRoot.getElementById("show-imported").addEventListener("click", () => {
            this.dispatchEvent(
                new CustomEvent("rule-import-show-imported", {
                    bubbles: true,
                    composed: true,
                })
            );
        });

        this.shadowRoot.getElementById("remove-imported").addEventListener("click", () => {
            this.dispatchEvent(
                new CustomEvent("rule-import-remove-imported", {
                    bubbles: true,
                    composed: true,
                })
            );
        });
    }

    static get observedAttributes() {
        return ["src", "deletable"];
    }

    attributeChangedCallback(name, _oldValue, newValue) {
        switch (name) {
            case "src":
                this.onSourceChanged(newValue);
                break;
            case "deletable":
                this.onDeletableChanged(newValue);
                break;
            default:
                break;
        }
    }

    onSourceChanged(src) {
        const text = this.shadowRoot.getElementById("name");
        const url = this.shadowRoot.getElementById("url");
        if (text.childElementCount === 0) {
            text.textContent = src;
        }
        url.href = src;
        this.fetchRules(src);
    }

    onDeletableChanged(deletable) {
        const deleteButton = this.shadowRoot.getElementById("delete");
        deleteButton.hidden = !deletable;
        deleteButton.addEventListener("click", () => {
            this.dispatchEvent(
                new CustomEvent("rule-import-deleted", {
                    bubbles: true,
                    composed: true,
                })
            );
        });
    }

    get data() {
        return this._data;
    }

    set data(value = {}) {
        const badge = this.shadowRoot.getElementById("imported");
        const remove = this.shadowRoot.getElementById("remove-imported");
        badge.hidden = !value.imported;
        remove.hidden = !value.imported;
        this._data = value;
    }

    async fetchRules(src) {
        const loading = this.shadowRoot.getElementById("loading");
        const error = this.shadowRoot.getElementById("error");
        const select = this.shadowRoot.getElementById("select");
        loading.hidden = false;
        error.hidden = true;
        select.disabled = true;
        this.disabled = true;

        try {
            const response = await fetch(src);

            if (!response.ok) {
                throw `${response.status} - ${response.statusText}`;
            }

            const data = await response.json();
            this.digest = await digest(JSON.stringify(data));
            this.etag = response.headers.get("etag");
            this.rules = Array.isArray(data) ? data : [data];
            this.shadowRoot.getElementById("count").textContent = browser.i18n.getMessage(
                "count_rules",
                this.rules.length
            );
            select.disabled = false;
            this.disabled = false;
        } catch (e) {
            error.title = e;
            error.hidden = false;
            select.disabled = true;
        }

        loading.hidden = true;
    }
}

customElements.define("rule-import-input", RuleImportInput);

async function digest(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const digest = await crypto.subtle.digest("SHA-1", data);
    const bytes = Array.from(new Uint8Array(digest));
    return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

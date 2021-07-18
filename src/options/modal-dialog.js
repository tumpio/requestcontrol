/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export default class ModalDialog extends HTMLElement {
    constructor() {
        super();
        const template = document.getElementById("modal-dialog");
        this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));

        this._escapeKeyListener = (e) => {
            if (e.key === "Escape") {
                this.remove();
            }
        };
        this.shadowRoot.getElementById("close").addEventListener(
            "click",
            () => {
                this.remove();
            },
            { once: true }
        );

        this.shadowRoot.getElementById("body").addEventListener("click", (e) => e.stopPropagation());
        this.addEventListener(
            "click",
            () => {
                this.remove();
            },
            { once: true }
        );
    }

    connectedCallback() {
        window.addEventListener("keydown", this._escapeKeyListener);
    }

    disconnectedCallback() {
        window.removeEventListener("keydown", this._escapeKeyListener);
    }
}

customElements.define("modal-dialog", ModalDialog);

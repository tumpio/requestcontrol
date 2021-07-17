/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

class AlertPopup extends HTMLElement {
    constructor() {
        super();
        this.message = "";
        const template = document.getElementById("alert-popup");
        this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));

        this.shadowRoot.getElementById("close").addEventListener(
            "click",
            () => {
                this.remove();
            },
            { once: true }
        );
    }

    connectedCallback() {
        this.shadowRoot.getElementById("message").textContent = this.message;
    }
}

customElements.define("alert-popup", AlertPopup);

export function showAlertPopup(message) {
    const popup = document.createElement("alert-popup");
    popup.message = message;
    document.body.append(popup);
}

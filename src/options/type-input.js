/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

class TypeInput extends HTMLInputElement {
    constructor() {
        super();

        const label = document.createElement("label");
        const value = this.getAttribute("value");
        const index = this.getAttribute("index");
        const text = browser.i18n.getMessage(value);

        this.type = "checkbox";
        this.autocomplete = "off";
        this.dataset.index = index;
        this.classList.add("type");
        label.classList.add("btn");

        if (index === 0) {
            label.classList.add("active");
            this.checked = true;
        } else if (index > 4) {
            label.classList.add("d-none");
            this.classList.add("extra-type");
        }
        this.replaceWith(label);
        label.append(this, text);
    }
}

customElements.define("type-input", TypeInput, { extends: "input" });

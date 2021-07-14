/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

class LoadingDots extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        const link = document.createElement("link");
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("href", "loading-dots.css");
        shadow.appendChild(link);

        const dot = document.createElement("span");
        dot.textContent = ".";
        shadow.appendChild(dot.cloneNode(true));
        shadow.appendChild(dot.cloneNode(true));
        shadow.appendChild(dot.cloneNode(true));
    }
}

customElements.define("loading-dots", LoadingDots);

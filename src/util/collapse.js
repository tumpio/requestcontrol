/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".collapse-button").forEach((button) => {
        button.addEventListener("click", function (e) {
            this.classList.toggle("collapsed");
            document.querySelector(this.dataset.collapseTarget).classList.toggle("collapsed");
            e.preventDefault();
            e.stopPropagation();
        });
    });
});

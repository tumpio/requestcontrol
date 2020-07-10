/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".alert .close").forEach((close) => {
        close.addEventListener("click", function () {
            this.parentNode.classList.remove("show");
        });
    });
    document.querySelectorAll("[data-toggle='modal']").forEach((btn) => {
        btn.addEventListener("click", function () {
            document.querySelector(this.dataset.target).classList.add("show");
        });
    });
    document.querySelectorAll(".modal .close").forEach((close) => {
        close.addEventListener("click", closeOpenModal);
    });
});

window.addEventListener(
    "keydown",
    function (event) {
        if (event.key === "Escape") {
            closeOpenModal();
        }
    },
    true
);

function closeOpenModal() {
    const modal = document.querySelector(".modal.show");
    if (modal) {
        modal.classList.remove("show");
    }
}

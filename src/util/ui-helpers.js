/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export function onToggleButtonChange(e) {
    setButtonChecked(e.target, e.target.checked);
}

export function setButtonChecked(button, checked) {
    button.checked = checked === true;
    button.parentNode.classList.toggle("active", checked === true);
}

export function setButtonDisabled(button, disabled) {
    button.disabled = disabled === true;
    button.parentNode.classList.toggle("disabled", disabled === true);
}

export function toggleHidden(hidden) {
    let hiddenClass = "d-none";
    if (typeof hidden === "boolean") {
        for (let i = 1; i < arguments.length; i++) {
            arguments[i].classList.toggle(hiddenClass, hidden);
        }
    } else if (hidden) {
        hidden.classList.toggle(hiddenClass);
    }
}

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 *
 * Helper functions for Bootstrap components.
 */

function setButtonChecked(button, checked) {
    button.checked = checked;
    button.parentNode.classList.toggle("active", checked);
}

function toggleHidden(hidden) {
    let hiddenClass = "hidden";
    if (typeof hidden === "boolean") {
        for (let i = 1; i < arguments.length; i++) {
            arguments[i].classList.toggle(hiddenClass, hidden);
        }
    } else if (hidden) {
        hidden.classList.toggle(hiddenClass);
    }
}

function toggleFade(element) {
    element.classList.add("fade");
    setTimeout(function () {
        element.classList.remove("fade");
    }, 2000);
}

function addInputValidation(input, callback) {
    function validateInput(e) {
        let pass = e.target.checkValidity();
        input.parentNode.classList.toggle("has-error", !pass);
        callback(pass);
    }

    input.addEventListener("input", validateInput);
    input.addEventListener("change", validateInput);
    input.addEventListener("blur", validateInput);
}

function getSubPage(url) {
    let request = new Request(url, {
        method: "GET",
        headers: {
            "Content-Type": "text/xml"
        },
        mode: "same-origin",
        cache: "force-cache"
    });
    return fetch(request).then(response => {
        return response.text()
    }).then(text => {
        return document.createRange().createContextualFragment(text);
    });
}

function changeTab(tab) {
    let tabInfo = tab.split("#");
    let tabSelector = document.querySelector(".tab-selector[data-tab=" + tabInfo[0] + "]");
    if (!tabSelector || tabSelector.classList.contains("active")) {
        return;
    }
    document.getElementById("tabs").querySelector(".active").classList.remove("active");
    tabSelector.parentNode.classList.add("active");
    document.querySelector(".tab-pane.active").classList.remove("active");
    document.getElementById(tabSelector.dataset.tab + "Tab").classList.add("active");

    document.title = browser.i18n.getMessage(tabSelector.dataset.tabTitle);
    document.getElementById("pageTitle").textContent = document.title;

    if (tabInfo[1]) {
        window.location.hash = tabInfo[1]
    }
}

function setTabFromHash() {
    let hash = window.location.hash;
    if (hash.startsWith("#tab-")) {
        changeTab(hash.substring(5));
    }
}

window.addEventListener("hashchange", setTabFromHash);

document.addEventListener("DOMContentLoaded", function () {
    setTabFromHash();
    for (let close of document.querySelectorAll(".close")) {
        close.addEventListener("click", function () {
            this.parentNode.classList.remove("show")
        });
    }

});

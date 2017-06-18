/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function showDetails(details) {
    document.getElementById("icon").src = "../icons/icon-" + details.action + "@38.png";
    document.getElementById("title").textContent = details.title;
    document.getElementById("type").textContent = details.type;
    document.getElementById("timestamp").textContent = new Date(details.timestamp).toLocaleTimeString();
    document.getElementById("url").textContent = details.url;
    document.getElementById("target").textContent = details.target;

    document.body.className = details.action;
}

function copyText(e) {
    let range = document.createRange();
    let text = document.getElementById(e.target.dataset.copyTarget);
    range.selectNodeContents(text);
    let selelection = window.getSelection();
    selelection.removeAllRanges();
    selelection.addRange(range);
    document.execCommand("Copy");
    e.target.classList.add("copied");
}

function copied(e) {
    e.target.classList.remove("copied");
}

function openOptionsPage() {
    browser.runtime.openOptionsPage();
}

document.addEventListener("DOMContentLoaded", function () {
    browser.runtime.sendMessage(null).then(showDetails);

    document.getElementById("showRules").addEventListener("click", openOptionsPage);

    let copyButtons = document.getElementsByClassName("copyButton");
    for (let copyButton of copyButtons) {
        copyButton.addEventListener("click", copyText);
        copyButton.addEventListener("mouseleave", copied);
    }
});
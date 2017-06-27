/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function setRecords(records) {
    let panelList = document.getElementById("records");

    function onItemClick(e) {
        let item = e.currentTarget;
        let i = item.dataset.record;
        let details = document.getElementById("details");
        item.appendChild(details);
        showDetails(records[i]);
    }

    for (let i = records.length - 1; i >= 0; i--) {
        let item = newListItem(records[i]);
        panelList.appendChild(item);
        item.dataset.record = i;
        item.addEventListener("click", onItemClick);
    }

    if (panelList.firstChild) {
        onItemClick({currentTarget: panelList.firstChild});
    }
}

function newListItem(details) {
    let model = document.getElementById("entryModel").cloneNode(true);
    model.querySelector(".type").textContent = browser.i18n.getMessage(details.type);
    model.querySelector(".timestamp").textContent = timestamp(details.timestamp);
    model.querySelector(".icon > img").src = "/icons/icon-" + details.action + "@19.png";
    model.querySelector(".text").textContent = browser.i18n.getMessage("title_" + details.action);
    return model;
}

function timestamp(ms) {
    let d = new Date(ms);
    return padDigit(d.getHours(), 2) +
        ":" + padDigit(d.getMinutes(), 2) +
        ":" + padDigit(d.getSeconds(), 2) +
        "." + padDigit(d.getMilliseconds(), 3);
}

function padDigit(digit, padSize) {
    return ("0".repeat(padSize) + digit.toString()).slice(-padSize);
}

function showDetails(details) {
    document.getElementById("url").textContent = details.url;
    document.getElementById("target").textContent = details.target;
    document.body.dataset.action = details.action;
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
    window.close();
}

document.addEventListener("DOMContentLoaded", function () {
    browser.runtime.sendMessage(null).then(setRecords);

    document.getElementById("showRules").addEventListener("click", openOptionsPage);

    let copyButtons = document.getElementsByClassName("copyButton");
    for (let copyButton of copyButtons) {
        copyButton.addEventListener("click", copyText);
        copyButton.addEventListener("mouseleave", copied);
    }
});

browser.tabs.onUpdated.addListener(function (e) {
    console.log(e);
});

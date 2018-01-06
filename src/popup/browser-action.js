/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Browser Action for displaying applied rules for current tab.
 */

const myOptionsManager = new OptionsManager();
const RECORD_TITLES = {};
RECORD_TITLES[WHITELIST_ACTION] = browser.i18n.getMessage("title_whitelist");
RECORD_TITLES[BLOCK_ACTION] = browser.i18n.getMessage("title_block");
RECORD_TITLES[FILTER_ACTION] = browser.i18n.getMessage("title_filter");
RECORD_TITLES[REDIRECT_ACTION] = browser.i18n.getMessage("title_redirect");
RECORD_TITLES[NO_ACTION] = "";
RECORD_TITLES[FILTER_ACTION | REDIRECT_ACTION] = RECORD_TITLES[FILTER_ACTION];

function setRecords(records) {
    if (!records) {
        return;
    }

    let recordsList = document.getElementById("records");

    for (let i = records.length - 1; i >= 0; i--) {
        let item = newListItem(records[i]);
        recordsList.appendChild(item);
        item.dataset.record = i.toString();
        item.querySelector(".entry-header").addEventListener("click", function () {
            let details = document.getElementById("details");
            item.appendChild(details);
            showDetails(records[i]);
        });
    }

    if (recordsList.firstChild) {
        let details = document.getElementById("details");
        recordsList.firstChild.appendChild(details);
        showDetails(records[records.length - 1]);
    }
    document.getElementById("records").classList.remove("hidden");
    document.getElementById("details").classList.remove("hidden");
}

function getTags(rules) {
    let tags = [];
    for (let rule of rules) {
        if (myOptionsManager.options.rules[rule].tag) {
            tags.push(myOptionsManager.options.rules[rule].tag);
        }
    }
    return tags;
}

function newListItem(details) {
    let model = document.getElementById("entryModel").cloneNode(true);
    model.removeAttribute("id");
    model.querySelector(".type").textContent = browser.i18n.getMessage(details.type);
    model.querySelector(".timestamp").textContent = timestamp(details.timestamp);
    model.querySelector(".icon > img").src = REQUEST_CONTROL_ICONS[details.action][19];

    if (details.error) {
        model.querySelector(".errorIcon").classList.remove("hidden");
        model.querySelector(".text").textContent = browser.i18n.getMessage(details.error.name);
    } else {
        model.querySelector(".text").textContent = RECORD_TITLES[details.action];
    }
    let tags = getTags(details.rules);
    let tagsNode = model.querySelector(".tags");
    if (tags.length === 0) {
        tagsNode.parentNode.removeChild(tagsNode);
    } else {
        tagsNode.textContent = tags.join(", ");
    }
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
    let str = digit.toString();
    let pad = padSize - str.length;
    if (pad > 0) {
        return "0".repeat(pad) + str;
    } else {
        return str;
    }
}

function showDetails(details) {
    document.getElementById("url").textContent = details.url;
    if (details.target) {
        document.getElementById("target").textContent = details.target;
        document.getElementById("targetBlock").classList.remove("hidden");
    } else {
        document.getElementById("targetBlock").classList.add("hidden");
    }
    document.getElementById("editLink").href = browser.runtime.getURL("src/options/options.html")
        + "?edit=" + details.rules.join("&edit=");
}

function copyText(e) {
    let range = document.createRange();
    let text = document.getElementById(e.currentTarget.dataset.copyTarget);
    range.selectNodeContents(text);
    let selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand("Copy");
    e.currentTarget.classList.add("copied");
}

function copied(e) {
    e.currentTarget.classList.remove("copied");
}

function openOptionsPage() {
    browser.runtime.openOptionsPage();
    window.close();
}

function toggleActive() {
    myOptionsManager.saveOption("disabled", !myOptionsManager.options.disabled);
    document.getElementById("toggleActive").classList.toggle("disabled",
        myOptionsManager.options.disabled);
}

document.addEventListener("DOMContentLoaded", function () {
    Promise.all([browser.runtime.sendMessage(null),
        myOptionsManager.loadOptions()]).then(values => {
        if (myOptionsManager.options.rules) {
            setRecords(values[0]);
        }
        if (myOptionsManager.options.disabled) {
            document.getElementById("toggleActive").classList.add("disabled");
        }
    });

    document.getElementById("showRules").addEventListener("click", openOptionsPage);
    document.getElementById("toggleActive").addEventListener("click", toggleActive);

    let copyButtons = document.getElementsByClassName("copyButton");
    for (let copyButton of copyButtons) {
        copyButton.addEventListener("click", copyText);
        copyButton.addEventListener("mouseleave", copied);
    }
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { OptionsManager } from "../options/lib/OptionsManager.js";

const myOptionsManager = new OptionsManager();

document.addEventListener("DOMContentLoaded", function () {
    myOptionsManager.loadOptions().then(function () {
        if (myOptionsManager.options.disabled) {
            setEnabled(false);
            return Promise.reject("");
        } else {
            return browser.runtime.sendMessage(null);
        }
    }).then(records => {
        setEnabled(true);
        if (myOptionsManager.options.rules) {
            setRecords(records);
        }
        let copyButtons = document.getElementsByClassName("copyButton");
        for (let copyButton of copyButtons) {
            copyButton.addEventListener("click", copyText);
            copyButton.addEventListener("mouseleave", copied);
        }
    });

    document.getElementById("showRules").addEventListener("click", openOptionsPage);
    document.getElementById("toggleActive").addEventListener("click", toggleActive);
    document.getElementById("editLink").addEventListener("click", editRule);
});

function setRecords(records) {
    if (!records) {
        return;
    }

    let list = document.getElementById("records");

    for (let record of records) {
        list.prepend(newListItem(record));
    }

    list.querySelector(".entry:first-child .entry-header").click();
    document.getElementById("records").classList.remove("hidden");
}

function getRule(uuid) {
    for (let rule of myOptionsManager.options.rules) {
        if (rule.uuid === uuid) {
            return rule;
        }
    }
    return null;
}

function newListItem(record) {
    let rule = getRule(record.rule.uuid);
    let item = document.getElementById("entryTemplate").content.cloneNode(true);
    item.querySelector(".type").textContent = browser.i18n.getMessage(record.type);
    item.querySelector(".timestamp").textContent = timestamp(record.timestamp);
    item.querySelector(".icon").src = `/icons/icon-${rule.action}.svg`;
    item.querySelector(".action").textContent = browser.i18n.getMessage(`title_${rule.action}`);
    item.querySelector(".url").textContent = record.url;

    let tagsNode = item.querySelector(".tags");
    if (rule.tag) {
        tagsNode.textContent = decodeURIComponent(rule.tag);
    } else {
        tagsNode.parentNode.removeChild(tagsNode);
    }

    item.querySelector(".entry-header").addEventListener("click", function () {
        let details = document.getElementById("details");
        this.parentNode.appendChild(details);
        showDetails(record);
    });
    return item;
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
    document.getElementById("details").classList.remove("hidden");
    document.getElementById("url").textContent = details.url;
    if (details.target) {
        document.getElementById("target").textContent = details.target;
        document.getElementById("targetBlock").classList.remove("hidden");
    } else {
        document.getElementById("targetBlock").classList.add("hidden");
    }
    document.getElementById("editLink").href =
        browser.runtime.getURL("src/options/options.html") + `?edit=${details.rule.uuid}`;
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
    setEnabled(!myOptionsManager.options.disabled);
}

function setEnabled(enabled) {
    let button = document.getElementById("toggleActive");
    let textId = enabled ? "activate_false" : "activate_true";
    let titleId = enabled ? "disable_rules" : "enable_rules";
    button.classList.toggle("disabled", !enabled);
    button.textContent = browser.i18n.getMessage(textId);
    button.title = browser.i18n.getMessage(titleId);
}

function editRule(e) {
    e.preventDefault();
    browser.tabs.create({
        url: this.href
    });
    window.close();
}

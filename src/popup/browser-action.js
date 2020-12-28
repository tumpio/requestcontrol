/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

document.addEventListener("DOMContentLoaded", async () => {
    const { disabled } = await browser.storage.local.get("disabled");

    updateDisabled(disabled === true);

    for (const copyButton of document.getElementsByClassName("copyButton")) {
        copyButton.addEventListener("click", copyText);
        copyButton.addEventListener("mouseleave", copied);
    }

    document.getElementById("showRules").addEventListener("click", openOptionsPage);
    document.getElementById("toggleActive").addEventListener("click", toggleActive);
    document.getElementById("editLink").addEventListener("click", editRule);

    if (disabled !== true) {
        getRecords();
    }
});

async function getRecords() {
    const records = await browser.runtime.sendMessage(null);

    if (!records) {
        return;
    }

    const list = document.getElementById("records");

    records.forEach((record) => list.prepend(newListItem(record)));

    list.querySelector(".entry:first-child .entry-header").click();
    document.getElementById("records").classList.remove("hidden");
}

function newListItem(record) {
    const item = document.getElementById("entryTemplate").content.cloneNode(true);

    item.querySelector(".type").textContent = browser.i18n.getMessage(record.type);
    item.querySelector(".timestamp").textContent = timestamp(record.timestamp);
    item.querySelector(".icon").src = `/icons/icon-${record.action}.svg`;
    item.querySelector(".action").textContent = browser.i18n.getMessage(`title_${record.action}`);
    item.querySelector(".url").textContent = record.url;

    const tagsNode = item.querySelector(".tags");

    if (record.rule.tag) {
        tagsNode.textContent = decodeURIComponent(record.rule.tag);
    } else {
        tagsNode.remove();
    }

    item.querySelector(".entry-header").addEventListener("click", function () {
        const details = document.getElementById("details");
        this.parentNode.appendChild(details);
        showDetails(record);
    });
    return item;
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
    const optionsUrl = browser.runtime.getURL("src/options/options.html");
    document.getElementById("editLink").href = `${optionsUrl}?edit=${details.rule.uuid}`;
}

function openOptionsPage() {
    browser.runtime.openOptionsPage();
    window.close();
}

async function toggleActive() {
    const disabled = !this.classList.contains("disabled");
    await browser.storage.local.set({ disabled });
    updateDisabled(disabled);
}

function updateDisabled(disabled) {
    const button = document.getElementById("toggleActive");
    const textId = disabled ? "activate_true" : "activate_false";
    const titleId = disabled ? "enable_rules" : "disable_rules";
    button.classList.toggle("disabled", disabled);
    button.textContent = browser.i18n.getMessage(textId);
    button.title = browser.i18n.getMessage(titleId);
}

function editRule(e) {
    e.preventDefault();
    browser.tabs.create({
        url: this.href,
    });
    window.close();
}

function timestamp(ms) {
    const d = new Date(ms);
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    const ss = d.getSeconds().toString().padStart(2, "0");
    const s = d.getMilliseconds().toString().padStart(3, "0");
    return `${hh}:${mm}:${ss}.${s}`;
}

function copyText(e) {
    const range = document.createRange();
    const text = document.getElementById(e.currentTarget.dataset.copyTarget);
    range.selectNodeContents(text);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand("Copy");
    e.currentTarget.classList.add("copied");
}

function copied(e) {
    e.currentTarget.classList.remove("copied");
}

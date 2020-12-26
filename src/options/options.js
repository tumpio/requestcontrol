/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { testRules } from "./rule-tester.js";
import { uuid } from "../util/uuid.js";
import { Toc } from "../util/toc.js";
import { exportObject, importFile } from "../util/import-export.js";

document.addEventListener("DOMContentLoaded", async function () {
    const { rules } = await browser.storage.local.get("rules");

    if (rules) {
        createRuleInputs(rules);
    } else {
        toggleEmpty();
    }

    const query = new URLSearchParams(location.search);
    if (query.has("edit")) {
        document.querySelectorAll("rule-list").forEach((list) => list.edit(query.get("edit")));
    }

    fetchLocalisedManual();
    setLoadDefaultsButton();

    document.getElementById("addNewRule").addEventListener("click", function () {
        document.getElementById("new").newRule();
        toggleEmpty();
    });

    document.getElementById("addDefault").addEventListener("click", loadDefaultRules);

    document.getElementById("exportRules").addEventListener("click", async function () {
        const fileName = browser.i18n.getMessage("export-file-name");
        const { rules } = await browser.storage.local.get("rules");
        exportObject(fileName, rules);
    });

    document.getElementById("importRules").addEventListener("change", function (e) {
        importFile(e.target.files[0]).then(importRules).catch(displayErrorMessage);
    });

    document.getElementById("exportSelectedRules").addEventListener("click", async function () {
        const fileName = browser.i18n.getMessage("export-file-name");
        const selected = getSelectedRules();
        exportObject(fileName, selected);
    });

    document.getElementById("removeSelectedRules").addEventListener("click", async function () {
        const selected = getSelectedRules().map((rule) => rule.uuid);
        const { rules } = await browser.storage.local.get("rules");

        if (rules) {
            await browser.storage.local.set({ rules: rules.filter((rule) => !selected.includes(rule.uuid)) });
        }

        document.querySelectorAll("rule-list").forEach((list) => list.removeSelected());
        updateToolbar();
        toggleEmpty();
    });

    document.getElementById("testSelectedRules").addEventListener("click", function () {
        document.getElementById("ruleTesterModal").classList.add("show");
        const testUrl = document.getElementById("test-url");

        if (testUrl.value) {
            const tester = onRuleTest.bind(testUrl);
            tester();
        }
    });

    document.getElementById("test-url").addEventListener("input", onRuleTest);

    browser.management.getSelf((info) => {
        document.getElementById("version").textContent = browser.i18n.getMessage("version", info.version);
    });

    document.getElementById("changelog").addEventListener("click", fetchChangelog, { once: true });

    document.getElementById("selectedRules").addEventListener("click", function () {
        document.querySelector(".mobile-toolbar").classList.toggle("show");
    });

    document.querySelector(".mobile-toolbar").addEventListener("click", function () {
        this.classList.remove("show");
    });

    document
        .querySelectorAll("rule-list")
        .forEach((list) => list.addEventListener("rule-edit-completed", onRuleEditCompleted));
});

document.addEventListener("rule-created", async function (e) {
    const rule = e.detail.rule;

    let { rules } = await browser.storage.local.get("rules");

    if (!rules) {
        rules = [];
    }
    rules.push(rule);

    await browser.storage.local.set({ rules });

    document.getElementById(rule.action).addCreated(rule);
});

document.addEventListener("rule-changed", async function (e) {
    const input = e.detail.input;
    const rule = e.detail.rule;

    let { rules } = await browser.storage.local.get("rules");

    if (!rules) {
        rules = [];
    }

    const index = rules.findIndex((item) => item.uuid === rule.uuid);

    if (index !== -1) {
        rules[index] = rule;
    } else {
        rules.push(rule);
    }

    await browser.storage.local.set({ rules });

    input.toggleSaved();
});

document.addEventListener("rule-deleted", async function (e) {
    const deleted = e.detail.uuid;
    const { rules } = await browser.storage.local.get("rules");
    if (rules) {
        await browser.storage.local.set({ rules: rules.filter((rule) => rule.uuid !== deleted) });
    }
    updateToolbar();
    toggleEmpty();
});

document.addEventListener("rule-selected", updateToolbar);

function onRuleEditCompleted(e) {
    const action = e.detail.action;
    const input = e.detail.input;
    if (action !== this.id) {
        document.getElementById(action).addFrom(input);
    }
}

function createRuleInputs(rules) {
    rules.forEach((rule) => document.getElementById(rule.action).add(rule));
    updateLists();
    updateToolbar();
}

function getSelectedRules() {
    return Array.from(document.querySelectorAll("rule-list")).flatMap((list) => list.selected);
}

function displayErrorMessage(error) {
    const message = document.getElementById("errorMessage");
    message.textContent = error;
    message.parentNode.classList.toggle("show", true);
}

async function loadDefaultRules() {
    const response = await fetch("/rules/default-privacy.json", {
        headers: {
            "Content-Type": "application/json",
        },
        mode: "same-origin",
    });
    const rules = await response.json();
    importRules(rules);
}

async function importRules(imported) {
    let { rules } = await browser.storage.local.get("rules");

    if (!rules) {
        rules = [];
    }

    const [newRules, mergedRules] = mergeRules(rules, imported);

    try {
        document.querySelectorAll("rule-list").forEach((list) => list.removeAll());
        createRuleInputs(rules);
        await browser.storage.local.set({ rules });
        window.location.hash = "#tab-rules";
        document.body.scrollIntoView(false);

        document.querySelectorAll("rule-list").forEach((list) => {
            list.mark(newRules, "new");
            list.mark(mergedRules, "merged");
        });
    } catch (ex) {
        displayErrorMessage(ex);
    }
}

function mergeRules(rules, imported) {
    const newRules = [];
    const mergedRules = [];
    const importedRules = Array.isArray(imported) ? imported : [imported];
    for (let rule of importedRules) {
        if (!rule.hasOwnProperty("uuid")) {
            rule.uuid = uuid();
            rules.push(rule);
            newRules.push(rule);
            continue;
        }
        let merged = false;
        for (let i = 0; i < rules.length; i++) {
            if (rule.uuid === rules[i].uuid) {
                rules[i] = rule;
                merged = true;
                mergedRules.push(rule);
                break;
            }
        }
        if (!merged) {
            rules.push(rule);
            newRules.push(rule);
        }
    }
    return [newRules, mergedRules];
}

async function onRuleTest() {
    const result = document.getElementById("testResult");
    const selected = getSelectedRules();
    result.textContent = testRules(this.value, selected);
}

function updateLists() {
    document.querySelectorAll("rule-list").forEach((list) => {
        list.updateHeader();
        list.toggle();
    });
    toggleEmpty();
}

function toggleEmpty() {
    const lists = document.querySelectorAll("rule-list");
    document.querySelector(".no-rules-block").classList.toggle(
        "d-none",
        Array.from(lists).some((list) => list.size !== 0)
    );
}

function setLoadDefaultsButton() {
    const p = document.querySelector(".create-or-default");
    const textNode = p.firstChild;
    const marker = "/";

    const startMark = textNode.textContent.indexOf(marker);
    const markNode = textNode.splitText(startMark);
    const endMark = markNode.textContent.indexOf(marker, 1);
    markNode.splitText(endMark + 1);

    let link = document.createElement("button");
    link.textContent = markNode.textContent.substring(1, markNode.textContent.length - 1);
    link.className = "btn text";
    link.addEventListener("click", loadDefaultRules);

    p.replaceChild(link, markNode);
}

function updateToolbar() {
    const count = getSelectedRules().length;
    document.querySelectorAll(".selected-count").forEach((totalText) => {
        totalText.textContent = count.toString();
    });
    const isSelected = count > 0;
    document.querySelectorAll(".btn-selected-action").forEach((button) => {
        button.disabled = !isSelected;
    });
    const selectedButton = document.getElementById("selectedRules");
    selectedButton.disabled = !isSelected;
    selectedButton.textContent = getSelectedRulesText(count);
}

function getSelectedRulesText(count) {
    let text;
    if (count === 0) {
        text = browser.i18n.getMessage("zero_selected_rules");
    } else if (count === 1) {
        text = browser.i18n.getMessage("one_selected_rule");
    } else {
        text = browser.i18n.getMessage("multiple_selected_rules", count);
    }
    return text;
}

async function fetchLocalisedManual() {
    const url = browser.i18n.getMessage("extensionManual");
    const response = await fetch(url, {
        headers: {
            "Content-Type": "text/html",
        },
        mode: "same-origin",
    });
    const text = await response.text();
    const manual = document.getElementById("manual");
    const contents = document.getElementById("contents");
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");

    manual.append(...doc.body.children);

    // generate table of contents
    const toc = new Toc(manual).render();
    const backTop = document.createElement("li");
    const backTopLink = document.createElement("a");
    backTopLink.textContent = browser.i18n.getMessage("back_to_top");
    backTopLink.href = "#tabs";
    backTop.append(backTopLink);
    toc.append(backTop);
    contents.append(toc);

    // add bootstrap table classes
    manual.querySelectorAll("table").forEach((table) => {
        table.className = "table table-striped";
    });
}

async function fetchChangelog() {
    const response = await fetch("/CHANGELOG.md", {
        headers: {
            "Content-Type": "text/plain",
        },
        mode: "same-origin",
    });
    const content = await response.text();
    const modal = document.getElementById("changelogModal");
    const body = modal.querySelector(".modal-body");

    let ul = document.createElement("ul");
    let start = false;

    for (let line of content.split("\n")) {
        if (!start) {
            if (line.startsWith("##")) {
                start = true;
            }
            continue;
        }
        if (line.startsWith("-")) {
            const li = document.createElement("li");
            const text = line.split(/(#\d+|@\w+)/);
            li.textContent = text[0].replace(/^- /, "");
            for (let i = 1; i < text.length; i++) {
                if (text[i].startsWith("#")) {
                    const link = document.createElement("a");
                    link.textContent = text[i];
                    link.href = "https://github.com/tumpio/requestcontrol/issues/" + text[i].substring(1);
                    link.target = "_blank";
                    li.append(link);
                } else if (text[i].startsWith("@")) {
                    const link = document.createElement("a");
                    link.textContent = text[i];
                    link.href = "https://github.com/" + text[i].substring(1);
                    link.target = "_blank";
                    li.append(link);
                } else {
                    li.append(text[i]);
                }
            }
            if (line.match(/fix/i)) {
                li.classList.add("fix");
            } else if (line.match(/add/i)) {
                li.classList.add("add");
            } else if (line.match(/change/i)) {
                li.classList.add("change");
            } else if (line.match(/update/i)) {
                li.classList.add("update");
            } else if (line.match(/locale/i)) {
                li.classList.add("locale");
            }
            ul.appendChild(li);
        } else {
            const h = document.createElement("h6");
            h.textContent = line.substring(2);
            body.appendChild(h);
            ul = document.createElement("ul");
            body.appendChild(ul);
        }
    }
}

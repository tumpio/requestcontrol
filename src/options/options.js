/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { newRuleInput } from "./rule-input.js";
import { testRules } from "./rule-tester.js";
import { uuid } from "./lib/uuid.js";
import { Toc } from "./lib/toc.js";
import { exportObject, importFile } from "./lib/import-export.js";
import { translateTemplates } from "./lib/i18n.js";

document.addEventListener("DOMContentLoaded", async function () {
    await fetchTypes();

    translateTemplates();

    const { rules } = await browser.storage.local.get("rules");

    if (rules) {
        createRuleInputs(rules);
    } else {
        loadDefaultRules();
    }

    const query = new URLSearchParams(location.search);
    if (query.has("edit")) {
        query.getAll("edit").forEach((uuid) => {
            const rule = document.getElementById("rule-" + uuid);
            rule.input.toggleEdit();
            rule.scrollIntoView();
        });
    }

    fetchLocalisedManual();

    document.getElementById("addNewRule").addEventListener("click", function () {
        const ruleInput = newRuleInput();
        document.getElementById("newRules").appendChild(ruleInput.model);
        toggleRuleBlocks();
        ruleInput.toggleEdit();
        ruleInput.$(".host").focus();
        ruleInput.model.scrollIntoView();
    });

    document.getElementById("reset").addEventListener("click", loadDefaultRules);

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
        const selected = getSelectedUuids();
        const { rules } = await browser.storage.local.get("rules");

        if (rules) {
            await browser.storage.local.set({ rules: rules.filter((rule) => !selected.includes(rule.uuid)) });
        }

        document.querySelectorAll(".rule.selected").forEach((ruleInput) => ruleInput.remove());
        document.querySelectorAll(".select-all-rules").forEach((selectAll) => {
            selectAll.checked = false;
            selectAll.indeterminate = false;
        });
        document
            .querySelectorAll(".selected-rules-count")
            .forEach((selectedText) => selectedText.classList.add("d-none"));
        toggleRuleBlocks();
        updateTotalSelected();
    });

    document.getElementById("testSelectedRules").addEventListener("click", function () {
        document.getElementById("ruleTesterModal").classList.add("show");
        const testUrl = document.getElementById("test-url");

        if (testUrl.value) {
            const tester = onRuleTest.bind(testUrl);
            tester();
        }
    });

    document.querySelectorAll(".header-rules").forEach((header) => {
        const checkbox = header.querySelector(".select-all-rules");
        checkbox.addEventListener("change", function () {
            const rules = header.nextElementSibling.querySelectorAll(".rule");
            const count = checkbox.checked ? rules.length : 0;
            rules.forEach((rule) => {
                rule.input.selected = checkbox.checked;
            });
            updateSelectedText(header, count, count);
            updateTotalSelected();
        });
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
});

document.addEventListener("rule-created", async function (e) {
    const input = e.detail.input;
    const rule = e.detail.rule;

    if (!input.isValid()) {
        input.model.classList.add("error");
        return;
    }

    input.model.classList.remove("error");

    const { rules } = await browser.storage.local.get("rules");

    rules.push(rule);

    await browser.storage.local.set({ rules });

    insertByOrder(e.target, rule.action);
    input.toggleEdit();
});

document.addEventListener("rule-changed", async function (e) {
    const input = e.detail.input;
    const rule = e.detail.rule;

    if (e.target.parentNode.id === "newRules") {
        return;
    }

    if (!input.isValid()) {
        input.model.classList.add("error");
        return;
    }

    input.model.classList.remove("error");

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

document.addEventListener("rule-action-changed", function (e) {
    const input = e.detail.input;
    const newInput = newRuleInput(input.rule);
    input.model.replaceWith(newInput.model);
    newInput.selected = input.selected;
    newInput.toggleEdit();
    newInput.notifyChanged();
});

document.addEventListener("rule-edit-completed", function (e) {
    insertByOrder(e.target, e.detail.action);
    toggleRuleBlocks();
    updateAllHeaders();
});

document.addEventListener("rule-deleted", async function (e) {
    const model = e.target;
    const { rules } = await browser.storage.local.get("rules");
    if (rules) {
        await browser.storage.local.set({ rules: rules.filter((rule) => rule.uuid !== e.detail.uuid) });
    }
    const header = model.parentNode.previousElementSibling;
    model.remove();
    toggleRuleBlocks();
    updateTotalSelected();
    updateRuleListHeader(header);
});

document.addEventListener("rule-selected", function (e) {
    updateRuleListHeader(e.target.parentNode.previousElementSibling);
});

function removeRuleInputs() {
    document.querySelectorAll(".rule-list").forEach((list) => {
        while (list.lastChild) {
            list.lastChild.remove();
        }
    });
}

function createRuleInputs(rules) {
    rules.forEach((rule) => {
        const input = newRuleInput(rule);
        insertByOrder(input.model, rule.action);
    });
    toggleRuleBlocks();
}

function insertByOrder(model, action) {
    if (!action) {
        return;
    }

    const list = document.getElementById(action);
    const title = model.querySelector(".title").textContent;

    if (
        list.childElementCount === 0 ||
        list.querySelector(".rule:last-child .title").textContent.localeCompare(title) < 0
    ) {
        list.append(model);
        return;
    }

    for (let next of list.querySelectorAll(".rule")) {
        const nextTitle = next.querySelector(".title").textContent;
        if (nextTitle.localeCompare(title) >= 0) {
            next.before(model);
            break;
        }
    }
}

function getSelectedRules() {
    return Array.from(document.querySelectorAll(".rule.selected"), (selected) => selected.input.rule);
}

function getSelectedUuids() {
    return Array.from(document.querySelectorAll(".rule.selected"), (selected) => selected.dataset.uuid);
}

function displayErrorMessage(error) {
    const message = document.getElementById("errorMessage");
    message.textContent = error;
    message.parentNode.classList.toggle("show", true);
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

async function importRules(imported) {
    let { rules } = await browser.storage.local.get("rules");

    if (!rules) {
        rules = [];
    }

    const [newRules, mergedRules] = mergeRules(rules, imported);

    try {
        removeRuleInputs();
        createRuleInputs(rules);
        await browser.storage.local.set({ rules });
        window.location.hash = "#tab-rules";
        document.body.scrollIntoView(false);

        newRules.forEach((rule) => {
            const model = document.getElementById("rule-" + rule.uuid);
            model.classList.add("new");
        });

        mergedRules.forEach((rule) => {
            const model = document.getElementById("rule-" + rule.uuid);
            model.classList.add("merged");
        });
    } catch (ex) {
        displayErrorMessage(ex);
    }
}

async function loadDefaultRules() {
    await browser.storage.local.remove("rules");
    const response = await fetch("./default-rules.json", {
        headers: {
            "Content-Type": "application/json",
        },
        mode: "same-origin",
    });
    const rules = await response.json();
    importRules(rules);
}

async function onRuleTest() {
    const result = document.getElementById("testResult");
    const selected = getSelectedRules();
    result.textContent = testRules(this.value, selected);
}

function toggleRuleBlocks() {
    document.querySelectorAll(".rules-block").forEach((block) => {
        const rulesList = block.querySelector(".rule-list");
        block.classList.toggle("d-none", rulesList.childElementCount <= 0);
    });
}

function updateAllHeaders() {
    document.querySelectorAll(".header-rules").forEach(updateRuleListHeader);
}

function updateRuleListHeader(header) {
    const checkbox = header.querySelector(".select-all-rules");
    const list = header.nextElementSibling;

    if (!list.querySelector(".select:checked")) {
        checkbox.checked = false;
        checkbox.indeterminate = false;
    } else if (!list.querySelector(".select:not(:checked)")) {
        checkbox.checked = true;
        checkbox.indeterminate = false;
    } else {
        checkbox.checked = false;
        checkbox.indeterminate = true;
    }
    const count = list.querySelectorAll(".select:checked").length;
    const total = list.querySelectorAll(".select").length;
    updateSelectedText(header, count, total);
    updateTotalSelected();
}

function updateTotalSelected() {
    const count = document.querySelectorAll(".select:checked").length;
    document.querySelectorAll(".total-selected-count").forEach((totalText) => {
        totalText.textContent = count.toString();
    });
    const isSelected = count > 0;
    document.querySelectorAll(".btn-selected-rules-action").forEach((button) => {
        button.disabled = !isSelected;
    });
}

function updateSelectedText(header, selected, total) {
    const selectedText = header.querySelector(".selected-rules-count");
    if (selected > 0) {
        selectedText.classList.remove("d-none");
        selectedText.textContent = browser.i18n.getMessage("selected_rules_count", [selected, total]);
    } else {
        selectedText.classList.add("d-none");
    }
}

async function fetchTypes() {
    const response = await fetch("./types.json", {
        headers: {
            "Content-Type": "application/json",
        },
        mode: "same-origin",
    });
    const types = await response.json();
    const template = document.getElementById("ruleInput");
    const typesContainer = template.content.querySelector(".btn-group-types");
    const sorted = [];

    Object.entries(types).forEach(([type, index]) => {
        sorted[index] = type;
    });

    const moreButton = typesContainer.lastElementChild;
    typesContainer.append(...sorted.map((type, index) => newTypeModel(index, type)), moreButton);
}

function newTypeModel(index, value) {
    const model = document.getElementById("typeButton").content.cloneNode(true);
    const label = model.querySelector("label");
    const input = model.querySelector("input");
    const span = model.querySelector("span");

    input.setAttribute("data-index", index);
    input.setAttribute("value", value);
    span.setAttribute("data-i18n", value);

    if (index === 0) {
        label.classList.add("active");
        input.checked = true;
    } else if (index > 4) {
        label.classList.add("d-none");
        input.classList.add("extra-type");
    }
    return label;
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

    manual.insertAdjacentHTML("afterbegin", text);

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
    const response = await fetch("/CHANGELOG", {
        headers: {
            "Content-Type": "text/plain",
        },
        mode: "same-origin",
    });
    const content = await response.text();
    const modal = document.getElementById("changelogModal");
    const body = modal.querySelector(".modal-body");

    let ul = document.createElement("ul");

    for (let line of content.split("\n")) {
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
            h.textContent = line;
            body.appendChild(h);
            ul = document.createElement("ul");
            body.appendChild(ul);
        }
    }
}

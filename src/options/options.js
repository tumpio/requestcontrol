/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { exportObject, importFile } from "../util/import-export.js";
import { Toc } from "../util/toc.js";
import { uuid } from "../util/uuid.js";
import { showAlertPopup } from "./alert-popup.js";
import { showChangelog } from "./changelog-dialog.js";
import { OPTION_CHANGE_ICON, OPTION_SHOW_COUNTER } from "./constants.js";
import { showRuleTestDialog } from "./rule-tester.js";

document.addEventListener("DOMContentLoaded", async () => {
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
    setCreateOrImportLink();

    document.getElementById("addNewRule").addEventListener("click", () => {
        document.getElementById("new").newRule();
        toggleEmpty();
    });

    document.getElementById("exportRules").addEventListener("click", async () => {
        const fileName = browser.i18n.getMessage("export-file-name");
        const { rules } = await browser.storage.local.get("rules");
        exportObject(fileName, rules);
    });

    document.getElementById("importRules").addEventListener("change", (e) => {
        importFile(e.target.files[0]).then(importRules).catch(showAlertPopup);
    });

    const optionShowCounter = document.getElementById("optionShowCounter");
    const optionChangeIcon = document.getElementById("optionChangeIcon");

    browser.storage.local
        .get({
            [OPTION_SHOW_COUNTER]: true,
            [OPTION_CHANGE_ICON]: true,
        })
        .then((options) => {
            optionShowCounter.checked = options[OPTION_SHOW_COUNTER];
            optionChangeIcon.checked = options[OPTION_CHANGE_ICON];
        });

    optionShowCounter.addEventListener("change", function () {
        browser.storage.local.set({ [OPTION_SHOW_COUNTER]: this.checked });
    });

    optionChangeIcon.addEventListener("change", function () {
        browser.storage.local.set({ [OPTION_CHANGE_ICON]: this.checked });
    });

    document.getElementById("exportSelectedRules").addEventListener("click", async () => {
        const fileName = browser.i18n.getMessage("export-file-name");
        const selected = getSelectedRules();
        exportObject(fileName, selected);
    });

    document.getElementById("removeSelectedRules").addEventListener("click", async () => {
        const selected = new Set(getSelectedRules().map((rule) => rule.uuid));
        const { rules } = await browser.storage.local.get("rules");

        if (rules) {
            await browser.storage.local.set({ rules: rules.filter((rule) => !selected.has(rule.uuid)) });
        }

        document.querySelectorAll("rule-list").forEach((list) => list.removeSelected());
        updateToolbar();
        toggleEmpty();
    });

    document
        .getElementById("testSelectedRules")
        .addEventListener("click", () => showRuleTestDialog(getSelectedRules()));

    browser.management.getSelf((info) => {
        document.getElementById("version").textContent = browser.i18n.getMessage("version", info.version);
    });

    document.getElementById("changelog").addEventListener("click", showChangelog);

    document.getElementById("selectedRules").addEventListener("click", () => {
        document.querySelector(".mobile-toolbar").classList.toggle("show");
    });

    document.querySelector(".mobile-toolbar").addEventListener("click", function () {
        this.classList.remove("show");
    });

    document
        .querySelectorAll("rule-list")
        .forEach((list) => list.addEventListener("rule-edit-completed", onRuleEditCompleted));

    setupImportsTab();
});

document.addEventListener("rule-created", async (e) => {
    const { rule } = e.detail;

    let { rules } = await browser.storage.local.get("rules");

    if (!rules) {
        rules = [];
    }
    rules.push(rule);

    await browser.storage.local.set({ rules });

    document.getElementById(rule.action).addCreated(rule);
});

document.addEventListener("rule-changed", async (e) => {
    const { input, rule } = e.detail;

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

document.addEventListener("rule-deleted", async (e) => {
    const deleted = e.detail.uuid;
    const { rules } = await browser.storage.local.get("rules");
    if (rules) {
        await browser.storage.local.set({ rules: rules.filter((rule) => rule.uuid !== deleted) });
    }
    updateToolbar();
    toggleEmpty();
});

document.addEventListener("rule-selected", updateToolbar);

document.addEventListener("rule-import-selected", toggleImportSelectedButton);

document.addEventListener("rule-import-deleted", onImportSourceDeleted);

document.addEventListener("rule-import-remove-imported", onRemoveImportedRules);

document.addEventListener("rule-import-show-imported", (e) => {
    const { uuids } = e.target.data.imported;
    uuids.forEach((uuid) => {
        const input = document.querySelector(`[data-uuid="${uuid}"`);
        if (input) {
            input.select();
        }
    });
    window.location.hash = "#tab-rules";
    document.body.scrollIntoView(false);
    updateToolbar();
});

document.addEventListener("rule-import-update-imported", async (e) => {
    const input = e.target;
    let { imports } = await browser.storage.local.get("imports");
    const src = input.getAttribute("src");
    const rulesToImport = input.rules.filter((rule) => rule.uuid);
    const uuids = rulesToImport.map((rule) => rule.uuid);

    if (!imports) {
        imports = {};
    }

    if (!(src in imports)) {
        imports[src] = input.data;
    }

    const data = imports[src];

    if (data.imported && data.imported.uuids) {
        const { rules } = await browser.storage.local.get("rules");

        if (rules) {
            const removed = new Set(data.imported.uuids.filter((uuid) => !uuids.includes(uuid)));
            await browser.storage.local.set({ rules: rules.filter((rule) => !removed.has(rule.uuid)) });
        }
    }

    importRules(rulesToImport);

    imports[src].imported = {
        uuids,
        etag: input.etag,
        digest: input.digest,
        timestamp: Date.now(),
    };

    await browser.storage.local.set({ imports });
    input.data = imports[src];
});

async function setupImportsTab() {
    const { imports } = await browser.storage.local.get("imports");

    if (imports) {
        Object.entries(imports).forEach(([src, data]) => {
            if (data.deletable) {
                createImportInput(src, data);
            } else {
                const input = document.querySelector(`rule-import-input[src="${src}"`);
                if (input) {
                    input.data = data;
                }
            }
        });
    }

    document.getElementById("import-source-form").addEventListener("submit", onImportSourceAdded);
    document.getElementById("new-import-source").addEventListener("input", checkImportSourceValidity);
    document.getElementById("importSelected").addEventListener("click", importSelected);
}

async function checkImportSourceValidity() {
    const { imports } = await browser.storage.local.get("imports");
    const input = document.getElementById("new-import-source");
    const duplicate = document.querySelector(`rule-import-input[src="${input.value}"]`);

    if (duplicate || (imports && input.value in imports)) {
        input.setCustomValidity(browser.i18n.getMessage("duplicate_entry"));
    } else {
        input.setCustomValidity("");
    }
}

async function onImportSourceAdded(e) {
    e.preventDefault();
    const src = this.src.value;
    let { imports } = await browser.storage.local.get("imports");

    if (!imports) {
        imports = {};
    }

    imports[src] = { deletable: true };
    await browser.storage.local.set({ imports });

    createImportInput(src, imports[src]);
    this.reset();
    checkImportSourceValidity();
}

async function onImportSourceDeleted(e) {
    const input = e.target;
    const src = input.getAttribute("src");
    const { imports } = await browser.storage.local.get("imports");

    if (!imports || !(src in imports)) {
        return;
    }

    delete imports[src];

    await browser.storage.local.set({ imports });

    input.remove();
    checkImportSourceValidity();
    toggleImportSelectedButton();
}

async function onRemoveImportedRules(e) {
    const input = e.target;
    const { rules } = await browser.storage.local.get("rules");

    if (rules) {
        const { uuids } = input.data.imported;
        const newRules = rules.filter(({ uuid }) => !uuids.includes(uuid));
        await browser.storage.local.set({ rules: newRules });
        document.querySelectorAll("rule-list").forEach((list) => list.removeAll());
        createRuleInputs(newRules);
    }
    const src = input.getAttribute("src");
    const { imports } = await browser.storage.local.get("imports");

    if (imports && src in imports) {
        const { data } = input;
        delete data.imported;
        imports[src] = data;
        browser.storage.local.set({ imports });
    }
    input.data = {};
}

function createImportInput(src, data) {
    const input = document.createElement("rule-import-input");
    const inputs = document.getElementById("my-import-sources");
    input.setAttribute("src", src);
    input.setAttribute("deletable", true);
    input.data = data;
    inputs.append(input);
}

async function importSelected() {
    const selected = document.querySelectorAll("rule-import-input[selected]:not([disabled])");
    let { imports } = await browser.storage.local.get("imports");

    if (!imports) {
        imports = {};
    }

    let rulesToImport = [];

    selected.forEach((input) => {
        const src = input.getAttribute("src");
        const rules = input.rules.filter((rule) => rule.uuid);
        const uuids = rules.map((rule) => rule.uuid);

        if (!(src in imports)) {
            imports[src] = {};
        }

        imports[src].imported = {
            uuids,
            etag: input.etag,
            digest: input.digest,
            timestamp: Date.now(),
        };
        rulesToImport = rulesToImport.concat(rules);
    });

    importRules(rulesToImport);

    await browser.storage.local.set({ imports });

    selected.forEach((input) => {
        const src = input.getAttribute("src");
        input.data = imports[src];
    });
}

function toggleImportSelectedButton() {
    const selected = document.querySelectorAll("rule-import-input[selected]");
    const importButton = document.getElementById("importSelected");
    importButton.disabled = selected.length === 0;
}

function onRuleEditCompleted(e) {
    const { action, input } = e.detail;
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
        showAlertPopup(ex);
    }
}

function mergeRules(rules, imported) {
    const newRules = [];
    const mergedRules = [];
    const importedRules = Array.isArray(imported) ? imported : [imported];
    for (const rule of importedRules) {
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

function updateLists() {
    document.querySelectorAll("rule-list").forEach((list) => {
        list.updateHeader();
        list.toggle();
    });
    toggleEmpty();
}

function toggleEmpty() {
    const lists = document.querySelectorAll("rule-list");
    const isEmpty = Array.from(lists).every((list) => list.isEmpty);
    document.querySelector(".no-rules-block").classList.toggle("d-none", !isEmpty);
    document.getElementById("exportRules").disabled = isEmpty;
}

function setCreateOrImportLink() {
    const p = document.querySelector(".create-or-import");
    const link = document.querySelector(".create-or-import-link");
    const textNode = p.firstChild;
    const marker = "/";

    const startMark = textNode.textContent.indexOf(marker);
    const markNode = textNode.splitText(startMark);
    const endMark = markNode.textContent.indexOf(marker, 1);
    markNode.splitText(endMark + 1);

    link.textContent = markNode.textContent.substring(1, markNode.textContent.length - 1);
    markNode.replaceWith(link);
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

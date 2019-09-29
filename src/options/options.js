/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import { RuleInputFactory } from "./RuleInput.js";
import { testRules } from "./RuleTester.js";
import { uuid } from "./lib/uuid.js";
import { Toc } from "./lib/toc.js";
import { OptionsManager } from "./lib/OptionsManager.js";
import { getSubPage, toggleDisabled } from "./lib/UiHelpers.js";
import { exportObject, importFile } from "./lib/ImportExport.js";
import { WhitelistRule, LoggedWhitelistRule } from "../main/rules/whitelist.js";
import { BlockRule } from "../main/rules/block.js";
import { RedirectRule } from "../main/rules/redirect.js";
import { FilterRule } from "../main/rules/filter.js";

/**
 * Options page for Request Control rule management, settings and manual page.
 */

const myOptionsManager = new OptionsManager();
const myRuleInputFactory = new RuleInputFactory();
myRuleInputFactory.setOptionsManager(myOptionsManager);

function removeRuleInputs() {
    let ruleLists = document.querySelectorAll(".rule-list");
    for (let list of ruleLists) {
        while (list.firstChild) {
            list.removeChild(list.firstChild);
        }
    }
}

function createRuleInputs(rules, className) {
    for (let rule of rules) {
        let input = myRuleInputFactory.newInput(rule);
        input.model.id = "rule-" + rule.uuid;
        insertByOrder(input.model);
        if (className) {
            input.model.classList.add(className);
        }
    }
    toggleRuleBlocks();
}

function insertByOrder(model) {
    let action = model.getRule().action;
    if (!action) {
        return;
    }
    let list = document.getElementById(action);
    let title = model.querySelector(".title").textContent;
    if (list.childElementCount === 0 || list.querySelector(".rule:last-child .title").textContent.localeCompare(title) < 0) {
        list.appendChild(model);
        return;
    }
    for (let next of list.querySelectorAll(".rule")) {
        let nextTitle = next.querySelector(".title").textContent;
        if (nextTitle.localeCompare(title) >= 0) {
            list.insertBefore(model, next);
            break;
        }
    }
}

function getSelectedRuleInputs() {
    let selected = document.querySelectorAll(".rule.selected");
    let inputs = [];
    for (let model of selected) {
        inputs.push(model);
    }
    return inputs;
}

function addLocalisedManual(manual) {
    getSubPage(manual).then(page => {
        let manual = document.getElementById("manual");
        let contents = document.getElementById("contents");

        manual.appendChild(page);

        // generate table of contents
        let toc = new Toc(manual).render();
        let backTop = document.createElement("li");
        let backTopLink = document.createElement("a");
        backTopLink.textContent = browser.i18n.getMessage("back_to_top");
        backTopLink.href = "#tabs";
        backTop.appendChild(backTopLink);
        toc.appendChild(backTop);
        contents.appendChild(toc);

        // add bootstrap table classes
        for (let table of manual.querySelectorAll("table")) {
            table.className = "table table-striped";
        }
    });
}

function displayErrorMessage(error) {
    let message = document.getElementById("errorMessage");
    message.textContent = error;
    message.parentNode.classList.toggle("show", true);
}

function mergeRules(rules, rulesImport) {
    let newRules = [];
    let mergedRules = [];
    for (let rule of rulesImport) {
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

function importRules(rulesImport) {
    let rules = [];

    if (Array.isArray(myOptionsManager.options.rules)) {
        rules = rules.concat(myOptionsManager.options.rules);
    }

    let [newRules, merged] = mergeRules(rules, Array.isArray(rulesImport) ? rulesImport : [rulesImport]);

    try {
        createRuleInputs(newRules, "new");
        myOptionsManager.saveOption("rules", rules);
        window.location.hash = "#tab-rules";
        document.body.scrollIntoView(false);
        for (let rule of merged) {
            let model = document.getElementById("rule-" + rule.uuid);
            model.setRule(rule);
        }
    } catch (ex) {
        displayErrorMessage(ex);
    }
}

function loadDefaultRules() {
    let request = new Request("./default-rules.json", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
        mode: "same-origin"
    });
    removeRuleInputs();
    Promise.all([myOptionsManager.reset(), fetch(request).then(response => {
        return response.json();
    })]).then(([, rules]) => {
        importRules(rules);
    });
}

function onRuleTest() {
    let result = document.getElementById("testResult");
    result.textContent = "";
    let rules = [];
    for (let input of getSelectedRuleInputs()) {
        let rule = input.getRule();
        rules.push(rule);
    }
    let request;
    try {
        request = testRules(this.value, rules);
    } catch (e) {
        result.textContent = browser.i18n.getMessage("invalid_test_url");
        return;
    }
    if (!request.rule) {
        result.textContent = browser.i18n.getMessage("no_match");
        return;
    }
    let resolve = request.rule.constructor.resolve(request, function (request) {
        switch (request.rule.constructor) {
            case WhitelistRule:
            case LoggedWhitelistRule:
                result.textContent = browser.i18n.getMessage("whitelisted");
                break;
            case BlockRule:
                result.textContent = browser.i18n.getMessage("blocked");
                break;
            case RedirectRule:
            case FilterRule:
                try {
                    new URL(request.redirectUrl);
                    result.textContent = request.redirectUrl;
                } catch (e) {
                    result.textContent = browser.i18n.getMessage("invalid_target_url") + request.redirectUrl;
                }
                break;
            default:
                break;
        }
    });

    if (!resolve) {
        if (!(request.rule instanceof WhitelistRule)) {
            result.textContent = browser.i18n.getMessage("matched_no_change");
        } else {
            result.textContent = browser.i18n.getMessage("whitelisted");
        }
    }
}

function toggleRuleBlocks() {
    let blocks = document.querySelectorAll(".rules-block");
    for (let block of blocks) {
        let rulesList = block.querySelector(".rule-list");
        block.classList.toggle("d-none", rulesList.childElementCount <= 0);
    }
}

function updateAllHeaders() {
    for (let header of document.querySelectorAll(".header-rules")) {
        updateRuleListHeader(header);
    }
}

function updateRuleListHeader(header) {
    let checkbox = header.querySelector(".select-all-rules");
    let list = header.nextElementSibling;

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
    let count = list.querySelectorAll(".select:checked").length;
    let total = list.querySelectorAll(".select").length;
    updateSelectedText(header, count, total);
    updateTotalSelected();
}

function updateTotalSelected() {
    let total = document.querySelectorAll(".select:checked");
    for (let totalText of document.querySelectorAll(".total-selected-count")) {
        totalText.textContent = total.length.toString();
    }
    toggleDisabled(document.querySelectorAll(".rule.selected").length === 0,
        ...document.querySelectorAll(".btn-select-action"));
}

function updateSelectedText(header, selected, total) {
    let selectedText = header.querySelector(".selected-rules-count");
    if (selected > 0) {
        selectedText.classList.remove("d-none");
        selectedText.textContent = browser.i18n.getMessage(
            "selected_rules_count", [selected, total]
        );
    } else {
        selectedText.classList.add("d-none");
    }
}

function fetchChangelog() {
    fetch(new Request("/CHANGELOG", {
        method: "GET",
        headers: {
            "Content-Type": "text/plain"
        },
        mode: "same-origin",
        cache: "force-cache"
    })).then(response => {
        return response.text();
    }).then(content => {
        let modal = document.getElementById("changelogModal");
        let body = modal.querySelector(".modal-body");
        let ul = document.createElement("ul");
        for (let line of content.split("\n")) {
            if (line.startsWith("-")) {
                let li = document.createElement("li");
                let text = line.split(/(#\d+|@\w+)/);
                li.textContent = text[0].replace(/^- /, "");
                for (let i = 1; i < text.length; i++) {
                    if (text[i].startsWith("#")) {
                        let link = document.createElement("a");
                        link.textContent = text[i];
                        link.href = "https://github.com/tumpio/requestcontrol/issues/" + text[i].substring(1);
                        link.target = "_blank";
                        li.appendChild(link);
                    } else if (text[i].startsWith("@")) {
                        let link = document.createElement("a");
                        link.textContent = text[i];
                        link.href = "https://github.com/" + text[i].substring(1);
                        link.target = "_blank";
                        li.appendChild(link);
                    } else {
                        li.appendChild(document.createTextNode(text[i]));
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
                let h = document.createElement("h6");
                h.textContent = line;
                body.appendChild(h);
                ul = document.createElement("ul");
                body.appendChild(ul);
            }
        }
    });
    this.removeEventListener("click", fetchChangelog);
}

document.addEventListener("DOMContentLoaded", function () {
    Promise.all([myOptionsManager.loadOptions(), myRuleInputFactory.load()]).then(() => {
        if (!myOptionsManager.options.rules) {
            loadDefaultRules();
        } else {
            createRuleInputs(myOptionsManager.options.rules);
            let query = new URLSearchParams(location.search);
            if (query.has("edit")) {
                let rules = query.getAll("edit");
                for (let rule of rules) {
                    let ruleInput = document.getElementById("rule-" + rule);
                    ruleInput.select(true);
                    ruleInput.edit();
                    ruleInput.scrollIntoView();
                }
            }
        }
    });
    addLocalisedManual(browser.i18n.getMessage("extensionManual"));

    document.getElementById("addNewRule").addEventListener("click", function () {
        let ruleInput = myRuleInputFactory.newInput();
        document.getElementById("newRules").appendChild(ruleInput.model);
        toggleRuleBlocks();
        ruleInput.toggleEdit();
        ruleInput.$(".host").focus();
        ruleInput.model.scrollIntoView();
    });

    document.getElementById("reset").addEventListener("click", loadDefaultRules);

    document.getElementById("exportRules").addEventListener("click", function () {
        let fileName = browser.i18n.getMessage("export-file-name");
        exportObject(this, fileName, myOptionsManager.options.rules);
    });

    document.getElementById("importRules").addEventListener("change", function (e) {
        importFile(e.target.files[0]).then(importRules).catch(displayErrorMessage);
    });

    document.getElementById("exportSelectedRules").addEventListener("click", function () {
        let fileName = browser.i18n.getMessage("export-file-name");
        let rules = [];
        for (let input of getSelectedRuleInputs()) {
            rules.push(input.getRule());
        }
        exportObject(this, fileName, rules);
    });

    document.getElementById("removeSelectedRules").addEventListener("click", function () {
        for (let input of getSelectedRuleInputs()) {
            input.remove();
        }

        for (let selectAll of document.querySelectorAll(".select-all-rules")) {
            selectAll.checked = false;
            selectAll.indeterminate = false;
        }

        for (let selectedText of document.querySelectorAll(".selected-rules-count")) {
            selectedText.classList.add("d-none");
        }
        toggleRuleBlocks();
        updateTotalSelected();
    });

    document.getElementById("testSelectedRules").addEventListener("click", function () {
        let modal = document.getElementById("ruleTesterModal");
        modal.classList.add("show");
        let testUrl = document.getElementById("test-url");
        if (testUrl.value) {
            let tester = onRuleTest.bind(testUrl);
            tester();
        }
    });

    for (let header of document.querySelectorAll(".header-rules")) {
        let checkbox = header.querySelector(".select-all-rules");

        checkbox.addEventListener("change", function () {
            let rules = header.nextElementSibling.querySelectorAll(".rule");
            for (let rule of rules) {
                rule.select(checkbox.checked);
            }
            let count = checkbox.checked ? rules.length : 0;
            updateSelectedText(header, count, count);
            updateTotalSelected();
        });
    }

    document.addEventListener("rule-edit-completed", function (e) {
        insertByOrder(e.target);
        toggleRuleBlocks();
        updateAllHeaders();
    });

    document.addEventListener("rule-removed", function (e) {
        e.target.parentNode.removeChild(e.target);
        toggleRuleBlocks();
    });

    document.addEventListener("rule-select", function (e) {
        let header = e.detail.parent.previousElementSibling;
        updateRuleListHeader(header);
    });

    document.getElementById("test-url").addEventListener("input", onRuleTest);

    browser.management.getSelf(info => {
        document.getElementById("version").textContent =
            browser.i18n.getMessage("version", info.version);
    });

    document.getElementById("changelog").addEventListener("click", fetchChangelog);
    document.getElementById("selectedRules").addEventListener("click", function () {
        document.querySelector(".mobile-toolbar").classList.toggle("show");
    });
    document.querySelector(".mobile-toolbar").addEventListener("click", function () {
        this.classList.remove("show");
    });
});

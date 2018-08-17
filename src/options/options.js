/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {RuleInputFactory} from "/src/options/RuleInput.js";
import {testRules} from "/src/options/RuleTester.js";
import {
    BLOCK_ACTION,
    FILTER_ACTION,
    InvalidUrlException,
    REDIRECT_ACTION,
    WHITELIST_ACTION
} from "/src/RequestControl/base.js";
import {uuid} from "/lib/uuid.js";
import {Toc} from "/lib/toc.js";
import {OptionsManager} from "/lib/OptionsManager.js";
import {getSubPage, toggleDisabled} from "/lib/bootstrapHelpers.js";
import {exportObject, importFile} from "/lib/ImportExport.js";

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
        document.getElementById(rule.action).appendChild(input.model);
        if (className) {
            input.model.classList.add(className);
        }
    }
    toggleRuleHeaders(true);
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
        backTopLink.href = "#pageTitle";
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
                break;
            }
        }
        if (!merged) {
            rules.push(rule);
            newRules.push(rule);
        }
    }
    return newRules;
}

function importRules(rulesImport) {
    let rules = [];

    if (Array.isArray(myOptionsManager.options.rules)) {
        rules = rules.concat(myOptionsManager.options.rules);
    }

    let newRules = [];
    if (Array.isArray(rulesImport)) {
        newRules = mergeRules(rules, rulesImport);
    } else {
        newRules = mergeRules(rules, [rulesImport]);
    }

    try {
        createRuleInputs(newRules, "new");
        myOptionsManager.saveOption("rules", rules);
        window.location.hash = "#tab-rules";
        document.body.scrollIntoView(false);
    } catch (ex) {
        displayErrorMessage(ex);
    }
}

function loadDefaultRules() {
    let request = new Request("/default-rules.json", {
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

function exportReplacer(key, value) {
    // strip parameter trim pattern from exported rules
    if (key === "pattern" && typeof value === "string") {
        return undefined;
    }
    return value;
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
    if (!request.resolve) {
        result.textContent = browser.i18n.getMessage("no_match");
        return;
    }
    let resolveError = null;
    let resolve = request.resolve(function (request, action) {
        switch (action) {
            case WHITELIST_ACTION:
                result.textContent = browser.i18n.getMessage("whitelisted");
                break;
            case BLOCK_ACTION:
                result.textContent = browser.i18n.getMessage("blocked");
                break;
            case REDIRECT_ACTION:
            case FILTER_ACTION:
            case FILTER_ACTION | REDIRECT_ACTION:
                result.textContent = request.redirectUrl;
                break;
            default:
                break;
        }
    }, function (request, rule, error) {
        resolveError = error;
    });

    if (resolveError) {
        if (resolveError instanceof InvalidUrlException) {
            result.textContent = browser.i18n.getMessage("invalid_target_url") + resolveError.target;
        }
    } else if (!resolve && request.action & ~WHITELIST_ACTION) {
        result.textContent = browser.i18n.getMessage("matched_no_change");
    }
}

function toggleRuleHeaders() {
    let headers = document.querySelectorAll(".header-rules");
    for (let header of headers) {
        let rulesList = header.nextElementSibling;
        header.classList.toggle("d-none", rulesList.childElementCount <= 0);
    }
}

function updateTotalSelected() {
    let total = document.querySelectorAll(".select:checked");
    for (let totalText of document.querySelectorAll(".total-selected-count")) {
        totalText.textContent = total.length.toString();
    }
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
                }
            }
        }
    });
    addLocalisedManual(browser.i18n.getMessage("extensionManual"));

    document.getElementById("addNewRule").addEventListener("click", function () {
        let ruleInput = myRuleInputFactory.newInput();
        document.getElementById("newRules").appendChild(ruleInput.model);
        ruleInput.toggleEdit();
        ruleInput.$(".host").focus();
        ruleInput.model.scrollIntoView();
        toggleRuleHeaders();
    });

    document.getElementById("reset").addEventListener("click", loadDefaultRules);

    document.getElementById("exportRules").addEventListener("click", function () {
        let fileName = browser.i18n.getMessage("export-file-name");
        exportObject(fileName, myOptionsManager.options.rules, exportReplacer);
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
        exportObject(fileName, rules, exportReplacer);
    });

    document.getElementById("removeSelectedRules").addEventListener("click", function () {
        for (let input of getSelectedRuleInputs()) {
            input.remove();
        }
        toggleDisabled(true, ...document.querySelectorAll(".btn-select-action"));
        toggleRuleHeaders();
        updateTotalSelected();

        for (let selectAll of document.querySelectorAll(".select-all-rules")) {
            selectAll.checked = false;
            selectAll.indeterminate = false;
        }

        for (let selectedText of document.querySelectorAll(".selected-rules-count")) {
            selectedText.classList.add("d-none");
        }
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
        header.addEventListener("click", function (event) {
            let checkbox = this.querySelector(".select-all-rules");
            let rules = this.nextElementSibling.querySelectorAll(".rule");
            if (event.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
            }
            for (let rule of rules) {
                rule.select(checkbox.checked);
            }
            let count = checkbox.checked ? rules.length : 0;
            updateSelectedText(this, count, count);
            toggleDisabled(!checkbox.checked && !checkbox.indeterminate,
                ...document.querySelectorAll(".btn-select-action"));
            updateTotalSelected();
        });
    }

    document.addEventListener("rule-select", function (e) {
        let list = e.detail.parent;
        let header = list.previousElementSibling;
        let selectAll = header.querySelector(".select-all-rules");
        if (!list.querySelector(".select:checked")) {
            selectAll.checked = false;
            selectAll.indeterminate = false;
        } else if (!list.querySelector(".select:not(:checked)")) {
            selectAll.checked = true;
            selectAll.indeterminate = false;
        } else {
            selectAll.checked = false;
            selectAll.indeterminate = true;
        }
        let count = list.querySelectorAll(".select:checked").length;
        let total = list.querySelectorAll(".select").length;
        updateSelectedText(header, count, total);
        updateTotalSelected();
    });

    document.getElementById("test-url").addEventListener("input", onRuleTest);

    browser.management.getSelf(info => {
        document.getElementById("version").textContent =
            browser.i18n.getMessage("version", info.version);
    });

    document.getElementById("changelog").addEventListener("click", function () {
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
        this.removeEventListener("click", arguments.callee);
    });
});

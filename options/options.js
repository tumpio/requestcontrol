/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


/**
 * Options page for Request Control rule management, settings and help page.
 */

const myOptionsManager = new OptionsManager(RequestControl.optionsSchema);
const myRuleInputFactory = new RuleInputFactory();

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
        document.getElementById(rule.action).appendChild(input.model);
        if (className) {
            input.model.classList.add(className);
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

function importRules(rulesImport) {
    let rules = [];
    if (Array.isArray(myOptionsManager.options.rules)) {
        rules = rules.concat(myOptionsManager.options.rules);
    }
    if (Array.isArray(rulesImport)) {
        rules = rules.concat(rulesImport);
    } else {
        rules.push(rulesImport);
    }
    try {
        createRuleInputs(rulesImport, "new");
        myOptionsManager.saveOption("rules", rules);
        window.location.hash = "#tab-rules";
        document.body.scrollIntoView(false);
    } catch (ex) {
        displayErrorMessage(ex);
    }
}

function loadDefaultRules() {
    let request = new Request("/options/default-rules.json", {
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

document.addEventListener("DOMContentLoaded", function () {
    Promise.all([myOptionsManager.loadOptions(), myRuleInputFactory.load()]).then(() => {
        if (!myOptionsManager.options.rules) {
            loadDefaultRules();
        } else {
            createRuleInputs(myOptionsManager.options.rules)
        }
    });
    addLocalisedManual(browser.i18n.getMessage("extensionManual"));

    document.getElementById("addNewRule").addEventListener("click", function () {
        let ruleInput = myRuleInputFactory.newInput();
        document.getElementById("newRules").appendChild(ruleInput.model);
        ruleInput.toggleEdit();
        ruleInput.$(".host").focus();
        ruleInput.model.scrollIntoView();
    });

    document.getElementById("reset").addEventListener("click", loadDefaultRules);

    document.getElementById("exportRules").addEventListener("click", function () {
        let fileName = browser.i18n.getMessage("export-file-name");
        exportObject(fileName, myOptionsManager.options.rules);
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
        exportObject(fileName, rules);
    });

    document.getElementById("removeSelectedRules").addEventListener("click", function () {
        for (let input of getSelectedRuleInputs()) {
            input.remove();
        }
        toggleHidden(document.querySelector(".selected-action-buttons"));
    });
});

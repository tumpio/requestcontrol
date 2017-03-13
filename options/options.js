/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const myOptionsManager = new OptionsManager();
const tldStarPattern = /^(.+)\.\*$/;

function RequestRule() {
    return {
        pattern: {
            scheme: "*",
            matchSubDomains: false,
            host: "",
            path: ""
        },
        types: [],
        action: "",
        active: true
    };
}

function newRuleInput(target, rule) {
    let inputModel = document.getElementById("ruleInputModel").cloneNode(true);
    let ruleInputs = inputModel.querySelector(".panel-collapse");
    let icon = inputModel.querySelector(".icon");
    let title = inputModel.querySelector(".title");
    let description = inputModel.querySelector(".description");
    let scheme = inputModel.querySelector(".scheme");
    let matchSubDomains = inputModel.querySelector(".matchSubDomains");
    let host = inputModel.querySelector(".host");
    let path = inputModel.querySelector(".path");
    let types = inputModel.querySelector(".btn-group-types");
    let moreTypesBtn = inputModel.querySelector(".more-types");
    let anyType = inputModel.querySelector(".any-type");
    let action = inputModel.querySelector(".action");
    let redirectUrl = inputModel.querySelector(".redirectUrl");
    let editBtn = inputModel.querySelector(".btn-edit");
    let saveBtn = inputModel.querySelector(".btn-save");
    let activateBtn = inputModel.querySelector(".btn-activate");
    let removeBtn = inputModel.querySelector(".btn-remove");
    let tldsBtn = inputModel.querySelector(".btn-tlds");
    let tldsBadge = inputModel.querySelector(".btn-tlds > .badge");
    let tldsInput = inputModel.querySelector(".input-tlds");
    let tldsTagsInput = tagsInput(tldsInput);
    let tldsBlock = inputModel.querySelector(".tlds-block");
    let successText = inputModel.querySelector(".text-saved");
    inputModel.removeAttribute("id");

    function checkTLDStarPattern() {
        let isTldsPattern = tldStarPattern.test(host.value);
        toggleHidden(!isTldsPattern, tldsBtn.parentNode);
        toggleHidden(!isTldsPattern, tldsBlock);
        if (isTldsPattern && tldsTagsInput.getValue().length == 0) {
            toggleSaveable(false);
        }
    }

    function toggleActive() {
        inputModel.classList.toggle("disabled", !rule.active);
        activateBtn.textContent = rule.active ? 'Disable' : 'Enable';
    }

    function toggleSaveable(saveable) {
        if (!saveable) {
            saveBtn.setAttribute("disabled", "disabled");
        } else {
            saveBtn.removeAttribute("disabled");
        }
    }

    addInputValidation(host, toggleSaveable);
    addInputValidation(path, toggleSaveable);
    addInputValidation(redirectUrl, toggleSaveable);
    host.addEventListener("input", checkTLDStarPattern);

    types.addEventListener("change", function (e) {
        setButtonChecked(e.target, e.target.checked);
        setButtonChecked(anyType, !(e.target.checked || inputModel.querySelector(".type:checked")));
    }, false);

    moreTypesBtn.addEventListener("change", function (e) {
        e.stopPropagation();
        var extraTypes = inputModel.querySelectorAll(".extra-type:not(:checked)");
        moreTypesBtn.parentNode.querySelector(".text").textContent = moreTypesBtn.checked ? "◂ Less" : "More ▸";
        for (let type of extraTypes) {
            toggleHidden(!moreTypesBtn.checked, type.parentNode);
        }
    }, false);

    anyType.addEventListener("change", function (e) {
        setButtonChecked(anyType, e.target.checked);
        if (e.target.checked) {
            for (let type of inputModel.querySelectorAll(".type:checked")) {
                setButtonChecked(type, false);
            }
        }
    });

    tldsBtn.addEventListener("click", function () {
        toggleHidden(tldsBlock);
    });

    tldsInput.addEventListener("change", function () {
        let numberOfTlds = tldsTagsInput.getValue().length;
        tldsBadge.textContent = numberOfTlds;
        tldsBtn.classList.toggle("btn-danger", numberOfTlds == 0);
        if (numberOfTlds == 0) {
            saveBtn.setAttribute("disabled", "disabled");
        } else {
            saveBtn.removeAttribute("disabled");
        }
    });

    action.addEventListener("change", function () {
        icon.src = "../icons/icon-" + action.value + "@19.png";
        title.textContent = getRuleTitle(action.value) + encodeURIComponent(rule.pattern.host);
        description.textContent = getRuleDescription(action.value);
        toggleHidden(action.value != "redirect", redirectUrl, redirectUrl.parentNode);
        saveBtn.removeAttribute("disabled");
        for (let input of inputModel.querySelectorAll("input[pattern]:not(.hidden)")) {
            input.dispatchEvent(new Event("blur"));
        }
    });

    editBtn.addEventListener("click", function () {
        toggleHidden(ruleInputs);
    });

    saveBtn.addEventListener("click", function () {
        rule.pattern.scheme = scheme.value;
        rule.pattern.matchSubDomains = matchSubDomains.checked;
        rule.pattern.host = host.value;
        rule.pattern.path = path.value;
        rule.types = Array.from(inputModel.querySelectorAll(".type:checked"), type => type.value);
        rule.action = action.value;

        if (rule.types.length == 0 || anyType.checked) {
            delete rule.types;
        }
        if (action.value == "redirect") {
            rule.redirectUrl = redirectUrl.value;
        }
        if (tldStarPattern.test(host.value)) {
            rule.pattern.topLevelDomains = tldsTagsInput.getValue();
        }

        myOptionsManager.saveOptions("rules").then(function () {
            icon.src = "../icons/icon-" + rule.action + "@19.png";
            title.textContent = getRuleTitle(rule.action) + encodeURIComponent(rule.pattern.host);
            description.textContent = getRuleDescription(rule.action);
            toggleHidden(true, tldsBlock);
            toggleFade(successText);
        });
    });

    activateBtn.addEventListener("click", function () {
        rule.active = !rule.active;
        myOptionsManager.saveOptions("rules").then(toggleActive);
    });

    removeBtn.addEventListener("click", function () {
        target.removeChild(inputModel);
        let i = myOptionsManager.options.rules.indexOf(rule);
        if (i != -1) {
            myOptionsManager.options.rules.splice(i, 1);
            myOptionsManager.saveOptions("rules");
        }
    });

    if (rule) {
        icon.src = "../icons/icon-" + rule.action + "@19.png";
        title.textContent = getRuleTitle(rule.action) + encodeURIComponent(rule.pattern.host);
        description.textContent = getRuleDescription(rule.action);
        scheme.value = rule.pattern.scheme;
        matchSubDomains.checked = rule.pattern.matchSubDomains;
        host.value = rule.pattern.host;
        path.value = rule.pattern.path;
        action.value = rule.action;
        if (action.value == "redirect") {
            toggleHidden(false, redirectUrl, redirectUrl.parentNode);
            redirectUrl.value = rule.redirectUrl || "";
        }
        if (rule.pattern.topLevelDomains) {
            tldsBadge.textContent = rule.pattern.topLevelDomains.length;
            tldsTagsInput.setValue(rule.pattern.topLevelDomains.join());
        }
        toggleHidden(!tldStarPattern.test(host.value), tldsBtn.parentNode);
        toggleActive();

        if (!rule.types || rule.types.length == 0) {
            setButtonChecked(anyType, true);
        } else {
            for (let value of rule.types) {
                let type = inputModel.querySelector("[value=" + value + "]");
                setButtonChecked(type, true);
                toggleHidden(false, type.parentNode);
            }
        }
    } else {
        title.textContent = "New rule";
        rule = new RequestRule();
        myOptionsManager.options.rules.push(rule);
        toggleHidden(ruleInputs);
    }
    target.appendChild(inputModel);
    return inputModel;
}

function setButtonChecked(button, checked) {
    button.checked = checked;
    button.parentNode.classList.toggle("active", checked);
}

function toggleHidden(hidden) {
    let hiddenClass = "hidden";
    if (typeof hidden == "boolean") {
        for (let i = 1; i < arguments.length; i++) {
            arguments[i].classList.toggle(hiddenClass, hidden);
        }
    } else if (hidden) {
        hidden.classList.toggle(hiddenClass);
    }
}

function toggleFade(element) {
    element.classList.add("fade");
    setTimeout(function () {
        element.classList.remove("fade");
    }, 2000);
}

function addInputValidation(input, callback) {
    function validateInput(e) {
        let input = e.target;
        let pattern;
        if (input.pattern) {
            pattern = new RegExp(e.target.pattern);
            let pass = pattern.test(input.value);
            input.parentNode.classList.toggle("has-error", !pass);
            callback(pass);
        }
    }

    input.addEventListener("input", validateInput);
    input.addEventListener("blur", validateInput);
}

function getRuleTitle(action) {
    switch (action) {
        case "filter":
            return "Filter rule for ";
        case "block":
            return "Block rule for ";
        case "redirect":
            return "Redirect rule for ";
    }
}

function getRuleDescription(action) {
    switch (action) {
        case "filter":
            return "Filters redirection tracking requests and omits tracking URL parameters.";
        case "block":
            return "Cancels requests before they are made.";
        case "redirect":
            return "Redirects requests to self defined redirect URL";
    }
}

function newParamInput(target, value) {
    let inputModel = document.getElementById("paramInputModel").cloneNode(true);
    let input = inputModel.querySelector("input");
    let removeBtn = inputModel.querySelector(".btn-remove");
    inputModel.removeAttribute("id");
    removeBtn.addEventListener("click", function () {
        target.removeChild(inputModel);
    });
    if (value) {
        input.value = value;
    }
    target.appendChild(inputModel);
    return inputModel;
}

function createOptions(target, options, addInputFunc) {
    while (target.firstChild) {
        target.removeChild(target.firstChild);
    }
    for (let value of options) {
        addInputFunc(target, value);
    }
}

function getInputValues(target) {
    let values = [];
    for (let input of target.querySelectorAll("input")) {
        if (input.value)
            values.push(input.value);
    }
    return values;
}

function init() {
    let inputFormRules = document.getElementById("rules");
    let inputFormParams = document.getElementById("queryParams");

    createOptions(inputFormRules, myOptionsManager.options.rules, newRuleInput);
    createOptions(inputFormParams, myOptionsManager.options.queryParams, newParamInput);

    document.getElementById("addNewRule").addEventListener("click", function () {
        newRuleInput(inputFormRules).querySelector(".host").focus();
    });
    document.getElementById("addNewParam").addEventListener("click", function () {
        newParamInput(inputFormParams).querySelector(".param").focus();
    });
    document.getElementById("saveParams").addEventListener("click", function () {
        myOptionsManager.saveOptions("queryParams", getInputValues(inputFormParams)).then(function () {
            toggleFade(document.getElementById("saveParamsSuccess"));
            createOptions(inputFormParams, myOptionsManager.options.queryParams,
                newParamInput);
        });
    });
    document.getElementById("restoreRules").addEventListener("click", function () {
        myOptionsManager.restoreDefault("rules").then(function () {
            createOptions(inputFormRules, myOptionsManager.options.rules, newRuleInput);
        });
    });
    document.getElementById("restoreParams").addEventListener("click", function () {
        myOptionsManager.restoreDefault("queryParams").then(function () {
            createOptions(inputFormParams, myOptionsManager.options.queryParams,
                newParamInput);
        });
    });
    document.getElementById("showHelp").addEventListener("click", function () {
        toggleHidden(document.getElementById("help"));
    });
}

document.addEventListener("DOMContentLoaded", function () {
    myOptionsManager.loadOptions(init);
});

const myOptionsManager = new OptionsManager();
const tldStarPattern = /^(.+)\.\*$/;

function newRuleInput(target, rule) {
    let inputModel = document.getElementById("ruleInputModel").cloneNode(true);
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
        toggleHidden(tldsBtn.parentNode, !isTldsPattern);
        toggleHidden(tldsBlock, !isTldsPattern);
        if (isTldsPattern && tldsTagsInput.getValue().length == 0) {
            toggleSaveable(false);
        }
    }

    function toggleActive() {
        inputModel.classList.toggle("disabled", !rule.active);
        activateBtn.classList.toggle("btn-warning", rule.active);
        activateBtn.classList.toggle("btn-success", !rule.active);
        activateBtn.innerHTML = rule.active ? "Disable" : "Enable";
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
        moreTypesBtn.parentNode.querySelector(".text").innerHTML = moreTypesBtn.checked ? "◂ Less" : "More ▸";
        for (let type of extraTypes) {
            toggleHidden(type.parentNode, !moreTypesBtn.checked);
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
        tldsBadge.innerHTML = numberOfTlds;
        tldsBtn.classList.toggle("btn-danger", numberOfTlds == 0);
        if (numberOfTlds == 0) {
            saveBtn.setAttribute("disabled", "disabled");
        } else {
            saveBtn.removeAttribute("disabled");
        }
    });

    action.addEventListener("change", function () {
        rule.action = action.value;
        description.innerHTML = getRuleDescription(rule);
        toggleHidden(redirectUrl, action.value != "redirect");
        saveBtn.removeAttribute("disabled");
        for (let input of inputModel.querySelectorAll("input[pattern]:not(.hidden)")) {
            input.dispatchEvent(new Event("blur"));
        }
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
            title.innerHTML = "Rule for <mark>" + rule.pattern.host + "</mark>";
            toggleHidden(tldsBlock, true);
            successText.classList.add("show");
            setTimeout(function () {
                successText.classList.remove("show");
            }, 2000);
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
        title.innerHTML = "Rule for <mark>" + rule.pattern.host + "</mark>";
        description.innerHTML = getRuleDescription(rule);
        scheme.value = rule.pattern.scheme;
        matchSubDomains.checked = rule.pattern.matchSubDomains;
        host.value = rule.pattern.host;
        path.value = rule.pattern.path;
        action.value = rule.action;
        if (action.value != "redirect") {
            toggleHidden(redirectUrl, true);
            redirectUrl.value = rule.redirectUrl || "";
        }
        if (rule.pattern.topLevelDomains) {
            tldsBadge.innerHTML = rule.pattern.topLevelDomains.length;
            tldsTagsInput.setValue(rule.pattern.topLevelDomains.join());
        }
        toggleHidden(tldsBtn.parentNode, !tldStarPattern.test(host.value));
        toggleActive();

        if (!rule.types || rule.types.length == 0) {
            setButtonChecked(anyType, true);
        } else {
            for (let value of rule.types) {
                let type = inputModel.querySelector("[value=" + value + "]");
                setButtonChecked(type, true);
                toggleHidden(type.parentNode, false);
            }
        }
    } else {
        title.innerHTML = "New rule";
    }
    target.appendChild(inputModel);
    return inputModel;
}

function setButtonChecked(button, checked) {
    button.checked = checked;
    button.parentNode.classList.toggle("active", checked);
}

function toggleHidden(element, hidden) {
    let hiddenClass = "hidden";
    if (typeof hidden == "boolean") {
        element.classList.toggle(hiddenClass, hidden);
    } else {
        element.classList.toggle(hiddenClass, hidden);
    }
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

function getRuleDescription(rule) {
    switch (rule.action) {
        case "filter":
            return "Rule to <i>filter</i> requests. Skips redirection tracking requests.";
        case "block":
            return "Rule to <i>block</i> requests. Requests are cancelled.";
        case "redirect":
            return "Rule to <i>redirect</i> requests. Requests are redirected to " + rule.redirectUrl || "";
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
    document.addEventListener("DOMContentLoaded", function () {
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
            myOptionsManager.saveOptions("queryParam", getInputValues(inputFormParams)).then(function () {
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
            document.getElementById("help").classList.toggle("collapsed");
        });
    });
}

myOptionsManager.loadOptions(init);

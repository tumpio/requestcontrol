var myOptionsManager = new OptionsManager();
const validationPattern = /(https?|\*):\/\/((\*\.)?([\w-]+\.)*([\w]+|\*)|\*)\/.*/;
const tldStarPattern = /^(\*:\/\/[^\/]+).\*\//;

function newRuleInput(target, value) {
    let inputModel = document.getElementById("ruleInputModel").cloneNode(true);
    let input = inputModel.querySelector("input");
    let removeBtn = inputModel.querySelector(".btn-remove");
    let tldsBtn = inputModel.querySelector(".btn-tlds");
    let tldsBadge = inputModel.querySelector(".btn-tlds > .badge");
    let tldsInput = inputModel.querySelector(".input-tlds");
    inputModel.removeAttribute("id");
    tldsBtn.addEventListener("click", function () {
        tldsInput.classList.toggle('hidden');
    });
    removeBtn.addEventListener("click", function () {
        target.removeChild(inputModel);
    });
    if (value) {
        input.value = value.pattern;
        if (value.TLDs && value.TLDs.length > 0) {
            tldsBadge.innerHTML = value.TLDs.length;
            tldsInput.value = value.TLDs.join();
        }
        else {
            tldsBtn.classList.add("hidden");
        }
    }
    target.appendChild(inputModel);
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

function getRules(target) {
    let controls = target.querySelectorAll(".rule");
    let rules = [];
    let pattern, tlds;
    let valid = true;
    for (let control of controls) {
        pattern = control.querySelector(".pattern").value;
        tlds = control.querySelector(".tlds").value;
        tlds = tlds ? tlds.split(/\s*,\s*/) : [];
        if (!validationPattern.test(pattern) || (tldStarPattern.test(pattern) && tlds.length == 0)) {
            valid = false;
            control.classList.add("has-error");
        } else {
            control.classList.remove("has-error");
            rules.push({
                pattern: pattern,
                TLDs: tlds
            });
        }
    }
    return valid ? rules : [];
}

function init() {
    document.addEventListener("DOMContentLoaded", function () {
        let inputFormRules = document.getElementById("rules");
        let inputFormParams = document.getElementById("queryParams");

        createOptions(inputFormRules, myOptionsManager.options.rules, newRuleInput);
        createOptions(inputFormParams, myOptionsManager.options.queryParams, newParamInput);

        document.getElementById("addNewRule").addEventListener("click", function () {
            newRuleInput(inputFormRules);
        });
        document.getElementById("addNewParam").addEventListener("click", function () {
            newParamInput(inputFormParams);
        });
        document.getElementById("saveRules").addEventListener("click", function () {
            let rules = getRules(inputFormRules);
            if (rules.length > 0) {
                myOptionsManager.saveOptions({
                    rules: rules
                }).then(function () {
                    createOptions(inputFormRules, rules, newRuleInput);
                });
            }
        });
        document.getElementById("saveParams").addEventListener("click", function () {
            let queryParams = getInputValues(inputFormParams);
            myOptionsManager.saveOptions({
                queryParams: queryParams
            }).then(function () {
                createOptions(inputFormParams, queryParams, newParamInput);
            });
        });
        document.getElementById("restoreRules").addEventListener("click", function () {
            myOptionsManager.saveOptions({
                rules: myOptionsManager.defaultOptions.rules
            }).then(function () {
                createOptions(inputFormRules, myOptionsManager.defaultOptions.rules, newRuleInput);
            });
        });
        document.getElementById("restoreParams").addEventListener("click", function (e) {
            myOptionsManager.saveOptions({
                queryParams: myOptionsManager.defaultOptions.queryParams
            }).then(function () {
                createOptions(inputFormParams, myOptionsManager.defaultOptions.queryParams, newParamInput);
            });
        });
    });
}

myOptionsManager.loadOptions(init);

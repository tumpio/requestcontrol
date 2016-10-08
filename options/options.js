var myOptionsManager = new OptionsManager();
const hostValidation = /^(\*|[^*\s]+(\.\*)?)$/;
const pathValidation = /^[!#-;=?-[\]_a-z~]*$/;
const tldStarPattern = /^(.+)\.\*$/;

function newRuleInput(target, rule) {
    let inputModel = document.getElementById("ruleInputModel").cloneNode(true);
    let scheme = inputModel.querySelector(".scheme");
    let matchSubDomains = inputModel.querySelector(".matchSubDomains");
    let host = inputModel.querySelector(".host");
    let path = inputModel.querySelector(".path");
    let removeBtn = inputModel.querySelector(".btn-remove");
    let tldsBtn = inputModel.querySelector(".btn-tlds");
    let tldsBadge = inputModel.querySelector(".btn-tlds > .badge");
    let tlds = inputModel.querySelector(".tlds");
    inputModel.removeAttribute("id");
    host.addEventListener("input", function () {
        host.parentNode.classList.toggle("has-error", !hostValidation.test(host.value));
        tldsBtn.parentNode.classList.toggle("hidden", !tldStarPattern.test(host.value));
    });
    host.addEventListener("blur", function () {
        host.parentNode.classList.toggle("has-error", !hostValidation.test(host.value));
        tldsBtn.parentNode.classList.toggle("hidden", !tldStarPattern.test(host.value));
    });
    path.addEventListener("input", function () {
        path.parentNode.classList.toggle("has-error", !pathValidation.test(path.value));
    });
    path.addEventListener("blur", function () {
        path.parentNode.classList.toggle("has-error", !pathValidation.test(path.value));
    });
    tldsBtn.addEventListener("click", function () {
        tlds.classList.toggle('hidden');
    });
    removeBtn.addEventListener("click", function () {
        target.removeChild(inputModel);
    });
    if (rule) {
        scheme.value = rule.pattern.scheme;
        matchSubDomains.checked = rule.pattern.matchSubDomains;
        host.value = rule.pattern.host;
        path.value = rule.pattern.path;
        if (rule.pattern.topLevelDomains) {
            tldsBadge.innerHTML = rule.pattern.topLevelDomains.length;
            tlds.value = rule.pattern.topLevelDomains.join();
        }
        tldsBtn.parentNode.classList.toggle("hidden", !tldStarPattern.test(host.value));
    }
    target.appendChild(inputModel);
    return inputModel;
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

function getRules(target) {
    let controls = target.querySelectorAll(".rule");
    let rules = [];
    let scheme, matchSubDomains, host, tlds, path;
    for (let control of controls) {
        scheme = control.querySelector(".scheme").value;
        matchSubDomains = control.querySelector(".matchSubDomains").checked;
        host = control.querySelector(".host").value;
        path = control.querySelector(".path").value;
        tlds = control.querySelector(".tlds").value;
        tlds = tlds ? tlds.split(/\s*,\s*/) :  [];
        rules.push({
            pattern: {
                scheme: scheme,
                matchSubDomains: matchSubDomains,
                host: host,
                topLevelDomains: tlds,
                path: path
            }
        });
    }
    return rules;
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
        document.getElementById("saveRules").addEventListener("click", function () {
            if (!inputFormRules.querySelector(".has-error")) {
                let rules = getRules(inputFormRules);
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
                createOptions(inputFormRules, myOptionsManager.defaultOptions.rules,
                    newRuleInput);
            });
        });
        document.getElementById("restoreParams").addEventListener("click", function (e) {
            myOptionsManager.saveOptions({
                queryParams: myOptionsManager.defaultOptions.queryParams
            }).then(function () {
                createOptions(inputFormParams, myOptionsManager.defaultOptions.queryParams,
                    newParamInput);
            });
        });
    });
}

myOptionsManager.loadOptions(init);

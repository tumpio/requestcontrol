/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const tldStarPattern = /^(.+\.\*,.+|.+\.\*)$/;

function RequestRule() {
    return {
        pattern: {
            scheme: "*",
            host: "",
            path: ""
        },
        types: ["main_frame"],
        action: "",
        active: true
    };
}

function RuleInputFactory() {
}

RuleInputFactory.prototype.model = null;

RuleInputFactory.prototype.load = function () {
    return getSubPage("RuleInputModel.html").then(page => {
        RuleInputFactory.model = page.querySelector("#ruleInputModel");
        translateDocument(RuleInputFactory.model);
    });
};

RuleInputFactory.prototype.newInput = function (rule = new RequestRule()) {
    switch (rule.action) {
        case "filter":
            return new FilterRuleInput(rule);
        case "block":
            return new BlockRuleInput(rule);
        case "redirect":
            return new RedirectRuleInput(rule);
        case "whitelist":
            return new WhitelistRuleInput(rule);
        default:
            return new RuleInput(rule);
    }
};

function RuleInput(rule) {
    let self = this;
    self.rule = rule;
    self.model = RuleInputFactory.model.cloneNode(true);
    self.model.qs = self.model.querySelector;
    self.model.qsa = self.model.querySelectorAll;
    self.hostsTagsInput = new TagsInput(self.model.qs(".host"));
    self.pathsTagsInput = new TagsInput(self.model.qs(".path"));
    self.tldsTagsInput = new TagsInput(self.model.qs(".input-tlds"));
    self.title = "rule_title_new";
    self.description = "";
    self.optionsPath = "rules";
    self.model.removeAttribute("id");

    addInputValidation(this.model.qs(".host"), this.setAllowSave.bind(self));
    addInputValidation(this.model.qs(".path"), this.setAllowSave.bind(self));

    self.model.qs(".host").addEventListener("change", self.validateTLDPattern.bind(self));
    self.model.qs(".btn-edit").addEventListener("click", self.toggleEdit.bind(self));
    self.model.qs(".btn-activate").addEventListener("click", self.toggleActive.bind(self));
    self.model.qs(".btn-remove").addEventListener("click", self.remove.bind(self));
    self.model.qs(".btn-save").addEventListener("click", self.save.bind(self));
    self.model.qs(".action").addEventListener("change", self.change.bind(self));

    self.model.qs(".rule-header").addEventListener("dblclick", function (e) {
        if (!["BUTTON", "INPUT"].includes(e.target.tagName)) {
            self.toggleEdit();
        }
    });

    self.model.qs(".any-url").addEventListener("change", function (e) {
        setButtonChecked(self.model.qs(".any-url"), e.target.checked);
        toggleHidden(e.target.checked, self.model.qs(".host").parentNode, self.model.qs(".path").parentNode, self.model.qs(".pattern"));
        self.validate();
    });

    self.model.qs(".btn-group-types").addEventListener("change", function (e) {
        setButtonChecked(e.target, e.target.checked);
    }, false);

    self.model.qs(".more-types").addEventListener("change", function (e) {
        e.stopPropagation();
        let extraTypes = self.model.qsa(".extra-type:not(:checked)");
        self.model.qs(".more-types").parentNode.querySelector(".text").textContent =
            browser.i18n.getMessage("show_more_" + !self.model.qs(".more-types").checked);
        for (let type of extraTypes) {
            toggleHidden(!self.model.qs(".more-types").checked, type.parentNode);
        }
    }, false);

    self.model.qs(".any-type").addEventListener("change", function (e) {
        setButtonChecked(self.model.qs(".any-type"), e.target.checked);
        toggleHidden(e.target.checked, self.model.qs(".btn-group-types"));
        if (e.target.checked) {
            for (let type of self.model.qsa(".type:checked")) {
                setButtonChecked(type, false);
            }
        }
    });

    self.model.qs(".btn-tlds").addEventListener("click", function () {
        toggleHidden(self.model.qs(".tlds-block"));
    });

    self.model.qs(".input-tlds").addEventListener("change", function () {
        let numberOfTlds = self.tldsTagsInput.getValue().length;
        let error = numberOfTlds === 0;
        self.model.qs(".btn-tlds > .badge").textContent = numberOfTlds;
        self.model.qs(".btn-tlds").classList.toggle("btn-danger", error);
        self.model.qs(".btn-tlds").parentNode.classList.toggle("has-error", error);
        self.setAllowSave(!error);
    });

    self.model.qs(".select").addEventListener("change", function () {
        self.model.classList.toggle("selected", this.checked);
        toggleHidden(document.querySelectorAll(".rule.selected").length === 0,
            document.querySelector(".selected-action-buttons"));
    });

    self.model.getRuleInput = function () {
        return self;
    };
}

RuleInput.prototype.getRule = function () {
    this.updateRule();
    return this.rule;
};

RuleInput.prototype.change = function () {
    this.updateRule();
    let newInput = RuleInputFactory.prototype.newInput(this.rule);
    this.model.parentNode.insertBefore(newInput.model, this.model);
    this.softRemove();
    newInput.toggleEdit();
    newInput.validate();
};

RuleInput.prototype.remove = function () {
    this.softRemove();
    if (this.indexOfRule() !== -1) {
        myOptionsManager.saveOption(this.optionsPath);
    } else {
        myOptionsManager.saveAllOptions();
    }
};

RuleInput.prototype.softRemove = function () {
    this.model.parentNode.removeChild(this.model);
    let i = this.indexOfRule();
    if (i !== -1) {
        myOptionsManager.options[this.optionsPath].splice(i, 1);
    }
};

RuleInput.prototype.save = function () {
    this.updateRule();
    if (this.indexOfRule() === -1) {
        myOptionsManager.options[this.optionsPath].push(this.rule);
        return myOptionsManager.saveAllOptions().then(this.updateModel.bind(this)).then(this.showSavedText.bind(this));
    }
    return myOptionsManager.saveOption(this.optionsPath).then(this.updateModel.bind(this)).then(this.showSavedText.bind(this));
};

RuleInput.prototype.showSavedText = function () {
    toggleFade(this.model.qs(".text-saved"));
};

RuleInput.prototype.setAllowSave = function (bool) {
    if (!bool || this.model.qs(".has-error:not(.hidden)")) {
        this.model.qs(".btn-save").setAttribute("disabled", "disabled");
    } else {
        this.model.qs(".btn-save").removeAttribute("disabled");
    }
};

RuleInput.prototype.toggleActive = function () {
    this.rule.active = !this.rule.active;
    this.setActiveState();
    if (this.indexOfRule() !== -1) {
        myOptionsManager.saveOption(this.optionsPath);
    }
};

RuleInput.prototype.toggleEdit = function () {
    toggleHidden(this.model.qs(".panel-collapse"));
    this.model.classList.toggle("editing");
};

RuleInput.prototype.setActiveState = function () {
    this.model.classList.toggle("disabled", !this.rule.active);
    this.model.qs(".btn-activate").textContent = browser.i18n.getMessage("activate_" + !this.rule.active);
};

RuleInput.prototype.validate = function () {
    this.setAllowSave(true);
    if (this.model.qs(".pattern:not(.hidden)")) {
        for (let input of this.model.qsa("input[pattern]:not(.hidden)")) {
            input.dispatchEvent(new Event("blur"));
        }
        for (let input of this.model.qsa("input[required]:not(.hidden)")) {
            input.dispatchEvent(new Event("blur"));
        }
        this.validateTLDPattern();
    }
};

RuleInput.prototype.validateTLDPattern = function () {
    let isTldsPattern = tldStarPattern.test(this.model.qs(".host").value);
    toggleHidden(!isTldsPattern, this.model.qs(".btn-tlds").parentNode);
    toggleHidden(!isTldsPattern, this.model.qs(".tlds-block"));
    if (isTldsPattern && this.tldsTagsInput.getValue().length === 0) {
        this.setAllowSave(false);
        this.model.qs(".btn-tlds").classList.add("btn-danger");
        this.model.qs(".btn-tlds").parentNode.classList.add("has-error");
    }
};

RuleInput.prototype.indexOfRule = function () {
    return myOptionsManager.options[this.optionsPath].indexOf(this.rule);
};

RuleInput.prototype.getTitle = function () {
    let hosts = "";
    if (this.rule.pattern.allUrls) {
        hosts = browser.i18n.getMessage("any_url");
    } else if (Array.isArray(this.rule.pattern.host)) {
        hosts = this.rule.pattern.host.slice(0, 3).join(", ").replace(/\*\.|\.\*/g, "");
        if (this.rule.pattern.host.length > 3) {
            hosts = browser.i18n.getMessage("rule_title_hosts", [hosts, (this.rule.pattern.host.length - 3)]);
        }
    } else {
        hosts = this.rule.pattern.host.replace(/\*\.|\.\*/g, "");
    }
    return browser.i18n.getMessage(this.title, hosts);
};

RuleInput.prototype.getDescription = function () {
    return browser.i18n.getMessage(this.description);
};

RuleInput.prototype.updateModel = function () {
    this.model.setAttribute("data-type", this.rule.action);
    this.model.qs(".icon").src = "../icons/icon-" + this.rule.action + "@19.png";
    this.model.qs(".title").textContent = this.getTitle();
    this.model.qs(".description").textContent = this.getDescription();
    this.model.qs(".match-patterns").textContent = RequestControl.resolveUrls(this.rule.pattern).length;
    this.model.qs(".scheme").value = this.rule.pattern.scheme;
    this.hostsTagsInput.setValue(this.rule.pattern.host);
    this.pathsTagsInput.setValue(this.rule.pattern.path);
    this.model.qs(".action").value = this.rule.action;
    if (this.rule.pattern.topLevelDomains) {
        this.model.qs(".btn-tlds > .badge").textContent = this.rule.pattern.topLevelDomains.length;
        this.tldsTagsInput.setValue(this.rule.pattern.topLevelDomains);
    }
    toggleHidden(!tldStarPattern.test(this.model.qs(".host").value), this.model.qs(".btn-tlds").parentNode);
    this.setActiveState();

    setButtonChecked(this.model.qs(".type[value=main_frame]"), false);

    if (!this.rule.types || this.rule.types.length === 0) {
        setButtonChecked(this.model.qs(".any-type"), true);
        toggleHidden(true, this.model.qs(".btn-group-types"));
    } else {
        for (let value of this.rule.types) {
            let type = this.model.qs("[value=" + value + "]");
            setButtonChecked(type, true);
            toggleHidden(false, type.parentNode);
        }
    }

    if (this.rule.pattern.allUrls) {
        setButtonChecked(this.model.qs(".any-url"), true);
        toggleHidden(true, this.model.qs(".host").parentNode, this.model.qs(".path").parentNode, this.model.qs(".pattern"));
    }
};

RuleInput.prototype.updateRule = function () {
    if (this.model.qs(".any-url").checked) {
        this.rule.pattern.allUrls = true;
    } else {
        this.rule.pattern.scheme = this.model.qs(".scheme").value;
        this.rule.pattern.host = this.hostsTagsInput.getValue();
        this.rule.pattern.path = this.pathsTagsInput.getValue();
        if (tldStarPattern.test(this.model.qs(".host").value)) {
            this.rule.pattern.topLevelDomains = this.tldsTagsInput.getValue();
        }
        delete this.rule.pattern.allUrls;
    }

    this.rule.types = Array.from(this.model.qsa(".type:checked"), type => type.value);
    if (this.rule.types.length === 0 || this.model.qs(".any-type").checked) {
        delete this.rule.types;
    }

    this.rule.action = this.model.qs(".action").value;
};

function BlockRuleInput(rule) {
    RuleInput.call(this, rule);
    this.title = "rule_title_block";
    this.description = "rule_description_block";
    this.optionsPath = "rules";
    this.updateModel();
}

function WhitelistRuleInput(rule) {
    RuleInput.call(this, rule);
    this.title = "rule_title_whitelist";
    this.description = "rule_description_whitelist";
    this.optionsPath = "rules";
    this.updateModel();
}

function FilterRuleInput(rule) {
    RuleInput.call(this, rule);
    this.title = "rule_title_filter";
    this.description = ["rule_description_filter_url", "rule_description_filter_parameters"];
    this.optionsPath = "rules";
    this.paramsTagsInput = new TagsInput(this.model.qs(".input-params"));

    this.toggleTrimAll = function (e) {
        setButtonChecked(e.target, e.target.checked);
        toggleHidden(e.target.checked, this.model.qs(".btn-group-params"));
    };
    this.model.qs(".trim-all-params").addEventListener("change", this.toggleTrimAll.bind(this));
    this.updateModel();
}

function RedirectRuleInput(rule) {
    RuleInput.call(this, rule);
    this.title = "rule_title_redirect";
    this.description = "rule_description_redirect";
    this.optionsPath = "rules";
    this.updateModel();

    addInputValidation(this.model.qs(".redirectUrl"), this.setAllowSave.bind(this));
}

RedirectRuleInput.prototype = Object.create(RuleInput.prototype);
RedirectRuleInput.prototype.constructor = RedirectRuleInput;
WhitelistRuleInput.prototype = Object.create(RuleInput.prototype);
WhitelistRuleInput.prototype.constructor = WhitelistRuleInput;
BlockRuleInput.prototype = Object.create(RuleInput.prototype);
BlockRuleInput.prototype.constructor = BlockRuleInput;
FilterRuleInput.prototype = Object.create(RuleInput.prototype);
FilterRuleInput.prototype.constructor = FilterRuleInput;

FilterRuleInput.prototype.updateModel = function () {
    RuleInput.prototype.updateModel.call(this);
    this.model.qs(".redirectionFilter-toggle").checked = !this.rule.skipRedirectionFilter;
    if (this.rule.paramsFilter && Array.isArray(this.rule.paramsFilter)) {
        this.paramsTagsInput.setValue(this.rule.paramsFilter);
    }
    if (this.rule.pattern.allUrls) {
        setButtonChecked(this.model.qs(".any-url"), true);
        toggleHidden(true, this.model.qs(".host").parentNode, this.model.qs(".path").parentNode, this.model.qs(".pattern"));
    }
    if (this.rule.trimAllParams) {
        setButtonChecked(this.model.qs(".trim-all-params"), true);
        toggleHidden(true, this.model.qs(".btn-group-params"));
    }
};

FilterRuleInput.prototype.updateRule = function () {
    RuleInput.prototype.updateRule.call(this);
    this.rule.paramsFilter = this.paramsTagsInput.getValue();

    // construct regexp pattern of filter params
    if (this.rule.paramsFilter.length > 0) {
        let paramsFilterPattern = "";
        for (let param of this.rule.paramsFilter) {
            let testRegexp = param.match(/^\/(.*)\/$/);
            if (testRegexp) {
                paramsFilterPattern += "|" + testRegexp[1];
            } else {
                paramsFilterPattern += "|" + param.replace(/\*/g, ".*");
            }
        }
        paramsFilterPattern = paramsFilterPattern.substring(1);
        this.rule.paramsFilterPattern = paramsFilterPattern;
    } else {
        delete this.rule.paramsFilterPattern;
    }

    if (this.model.qs(".redirectionFilter-toggle").checked) {
        delete this.rule.skipRedirectionFilter;
    } else {
        this.rule.skipRedirectionFilter = true;
    }

    if (this.model.qs(".trim-all-params").checked) {
        this.rule.trimAllParams = true;
    } else {
        delete this.rule.trimAllParams;
    }
};

FilterRuleInput.prototype.getDescription = function () {
    let description = [];
    if (!this.rule.skipRedirectionFilter) {
        description.push(browser.i18n.getMessage(this.description[0]));
    }
    if (this.rule.trimAllParams ||
        (this.rule.paramsFilter && this.rule.paramsFilter.length > 0)) {
        description.push(browser.i18n.getMessage(this.description[1]));
    }
    if (description.length === 2) {
        return browser.i18n.getMessage("and", description);
    } else {
        return description.join();
    }
};

RedirectRuleInput.prototype.updateModel = function () {
    RuleInput.prototype.updateModel.call(this);
    toggleHidden(false, this.model.qs(".redirectUrl"), this.model.qs(".redirectUrl").parentNode, this.model.qs(".redirectUrlForm"));
    this.model.qs(".redirectUrl").value = this.rule.redirectUrl || "";
};

RedirectRuleInput.prototype.updateRule = function () {
    RuleInput.prototype.updateRule.call(this);
    this.rule.redirectUrl = this.model.qs(".redirectUrl").value;
};

RedirectRuleInput.prototype.getDescription = function () {
    return browser.i18n.getMessage(this.description, this.rule.redirectUrl);
};

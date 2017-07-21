/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


/**
 * Request Control Rule Input for rule creation.
 * Prototyped inheritance is used for rule types separation.
 * The same input model in RuleInputModel.html is used for all rule types.
 */

const hostsTLDWildcardPattern = /^(.+\.\*,.+|.+\.\*)$/;

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

RuleInputFactory.prototype.models = null;

RuleInputFactory.prototype.load = function () {
    return getSubPage("RuleInputModel.html").then(page => {
        RuleInputFactory.models = page;
        translateDocument(RuleInputFactory.models);
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
    self.model = RuleInputFactory.models.querySelector("#ruleInputModel").cloneNode(true);
    self.model.qs = self.model.querySelector;
    self.model.qsa = self.model.querySelectorAll;
    self.hostsTagsInput = new TagsInput(self.model.qs(".host"));
    self.pathsTagsInput = new TagsInput(self.model.qs(".path"));
    self.tldsTagsInput = new TagsInput(self.model.qs(".input-tlds"));
    self.title = "rule_title_new";
    self.description = "";
    self.optionsPath = "rules";
    self.model.removeAttribute("id");

    //addInputValidation(this.model.qs(".host"), this.setAllowSave.bind(self));
    //addInputValidation(this.model.qs(".path"), this.setAllowSave.bind(self));

    self.model.qs(".host").addEventListener("change", self.validateTLDPattern.bind(self));
    self.model.qs(".btn-edit").addEventListener("click", self.toggleEdit.bind(self));
    self.model.qs(".btn-activate").addEventListener("click", self.toggleActive.bind(self));
    self.model.qs(".action").addEventListener("change", self.change.bind(self));

    self.model.qs(".rule-header").addEventListener("dblclick", function (e) {
        if (e.target.tagName !== "BUTTON" && e.target.tagName !== "INPUT"
            && !e.target.hasAttribute("contenteditable")) {
            self.toggleEdit();
        }
    });

    self.model.qs(".title").addEventListener("keydown", self.onEnterKey.bind(self));
    self.model.qs(".title").addEventListener("blur", function (e) {
        self.setTitle(e.target.textContent);
        if (!self.rule.title) {
            e.target.textContent = self.getTitle();
        }
    });

    self.model.qs(".description").addEventListener("keydown", self.onEnterKey.bind(self));
    self.model.qs(".description").addEventListener("blur", function (e) {
        self.setDescription(e.target.textContent);
        if (!self.rule.description) {
            e.target.textContent = self.getDescription();
        }
    });

    self.model.qs(".any-url").addEventListener("change", function (e) {
        setButtonChecked(self.model.qs(".any-url"), e.target.checked);
        toggleHidden(e.target.checked, self.model.qs(".host").parentNode, self.model.qs(".path").parentNode, self.model.qs(".pattern"));
        self.validateTLDPattern();
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
        self.model.qs(".btn-tlds").classList.toggle("text-danger", error);
        self.model.qs(".btn-tlds").parentNode.classList.toggle("has-error", error);
    });

    self.model.qs(".select").addEventListener("change", function () {
        self.model.classList.toggle("selected", this.checked);
        toggleHidden(document.querySelectorAll(".rule.selected").length === 0,
            document.querySelector(".selected-action-buttons"));
    });

    self.model.getRuleInput = function () {
        return self;
    };

    self.model.qs(".rule-input").addEventListener("change", function () {
        if (this.reportValidity()) {
            self.save();
        }
    });
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
        return myOptionsManager.saveAllOptions().then(this.updateHeader.bind(this)).then(this.showSavedText.bind(this));
    }
    return myOptionsManager.saveOption(this.optionsPath).then(this.updateHeader.bind(this)).then(this.showSavedText.bind(this));
};

RuleInput.prototype.showSavedText = function () {
    toggleFade(this.model.qs(".text-saved"));
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
    if (this.model.classList.toggle("editing")) {
        this.model.qs(".title").setAttribute("contenteditable", true);
        this.model.qs(".description").setAttribute("contenteditable", true);
    } else {
        this.model.qs(".title").removeAttribute("contenteditable");
        this.model.qs(".description").removeAttribute("contenteditable");
    }
    this.updateInputs();
};

RuleInput.prototype.setActiveState = function () {
    this.model.classList.toggle("disabled", !this.rule.active);
    this.model.qs(".btn-activate").textContent = browser.i18n.getMessage("activate_" + !this.rule.active);
};

RuleInput.prototype.validateTLDPattern = function () {
    let isTldsPattern = !this.model.qs(".any-url").checked && hostsTLDWildcardPattern.test(this.model.qs(".host").value);
    toggleHidden(!isTldsPattern, this.model.qs(".form-group-tlds"));
    if (isTldsPattern) {
        if (this.tldsTagsInput.getValue().length === 0) {
            this.model.qs(".btn-tlds").classList.add("text-danger");
            this.model.qs(".btn-tlds").parentNode.classList.add("has-error");
            toggleHidden(!isTldsPattern, this.model.qs(".tlds-block"));
        }
        this.tldsTagsInput.enable();
    } else {
        this.tldsTagsInput.disable();
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

RuleInput.prototype.setTitle = function (str) {
    let title = encodeURIComponent(str.trim());
    if (title) {
        this.rule.title = title;
    } else {
        delete this.rule.title;
        delete this.rule.name;
    }
    this.save();
};

RuleInput.prototype.getDescription = function () {
    return browser.i18n.getMessage(this.description);
};

RuleInput.prototype.setDescription = function (str) {
    let description = encodeURIComponent(str.trim());
    if (description) {
        this.rule.description = description;
    } else {
        delete this.rule.description;
    }
    this.save();
};

RuleInput.prototype.onEnterKey = function (e) {
    if (e.keyCode === 13) { // Enter
        e.target.blur();
        e.preventDefault();
        return false;
    }
};

RuleInput.prototype.updateHeader = function () {
    let title = this.rule.title || this.rule.name || this.getTitle();
    title = decodeURIComponent(title);
    let description = this.rule.description || this.getDescription();
    description = decodeURIComponent(description);
    this.model.setAttribute("data-type", this.rule.action);
    this.model.qs(".icon").src = "../icons/icon-" + this.rule.action + "@19.png";
    this.model.qs(".title").textContent = title;
    this.model.qs(".title").title = title;
    this.model.qs(".description").textContent = description;
    this.model.qs(".description").title = description;
    this.model.qs(".match-patterns").textContent = RequestControl.resolveUrls(this.rule.pattern).length;
    this.setActiveState();
};

RuleInput.prototype.updateInputs = function () {
    this.model.qs(".scheme").value = this.rule.pattern.scheme;
    this.hostsTagsInput.setValue(this.rule.pattern.host);
    this.pathsTagsInput.setValue(this.rule.pattern.path);
    this.model.qs(".action").value = this.rule.action;
    if (this.rule.pattern.topLevelDomains) {
        this.model.qs(".btn-tlds > .badge").textContent = this.rule.pattern.topLevelDomains.length;
        this.tldsTagsInput.setValue(this.rule.pattern.topLevelDomains);
        this.tldsTagsInput.enable();
    }
    toggleHidden(!hostsTLDWildcardPattern.test(this.model.qs(".host").value), this.model.qs(".form-group-tlds"));

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
        if (hostsTLDWildcardPattern.test(this.model.qs(".host").value)) {
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
    this.updateHeader();
}

function WhitelistRuleInput(rule) {
    RuleInput.call(this, rule);
    this.title = "rule_title_whitelist";
    this.description = "rule_description_whitelist";
    this.optionsPath = "rules";
    this.updateHeader();
}

function FilterRuleInput(rule) {
    RuleInput.call(this, rule);
    this.title = "rule_title_filter";
    this.description = ["rule_description_filter_url", "rule_description_filter_parameters"];
    this.optionsPath = "rules";

    let ruleAction = RuleInputFactory.models.querySelector("#action-" + rule.action).cloneNode(true);
    this.model.qs(".rule-input").appendChild(ruleAction);
    ruleAction.removeAttribute("id");

    this.paramsTagsInput = new TagsInput(this.model.qs(".input-params"));

    this.invertTrim = function (e) {
        setButtonChecked(e.target, e.target.checked);
    };
    this.toggleTrimAll = function (e) {
        setButtonChecked(e.target, e.target.checked);
        toggleHidden(e.target.checked, this.model.qs(".btn-group-params"));
    };
    this.model.qs(".trim-all-params").addEventListener("change", this.toggleTrimAll.bind(this));
    this.model.qs(".invert-trim").addEventListener("change", this.invertTrim.bind(this));
    this.updateHeader();
}

function RedirectRuleInput(rule) {
    RuleInput.call(this, rule);
    this.title = "rule_title_redirect";
    this.description = "rule_description_redirect";
    this.optionsPath = "rules";
    this.updateHeader();

    let ruleAction = RuleInputFactory.models.querySelector("#action-" + rule.action).cloneNode(true);
    this.model.qs(".rule-input").appendChild(ruleAction);
    ruleAction.removeAttribute("id");

    //addInputValidation(this.model.qs(".redirectUrl"), this.setAllowSave.bind(this));
}

RedirectRuleInput.prototype = Object.create(RuleInput.prototype);
RedirectRuleInput.prototype.constructor = RedirectRuleInput;
WhitelistRuleInput.prototype = Object.create(RuleInput.prototype);
WhitelistRuleInput.prototype.constructor = WhitelistRuleInput;
BlockRuleInput.prototype = Object.create(RuleInput.prototype);
BlockRuleInput.prototype.constructor = BlockRuleInput;
FilterRuleInput.prototype = Object.create(RuleInput.prototype);
FilterRuleInput.prototype.constructor = FilterRuleInput;

FilterRuleInput.prototype.updateInputs = function () {
    RuleInput.prototype.updateInputs.call(this);
    this.model.qs(".redirectionFilter-toggle").checked = !this.rule.skipRedirectionFilter;
    if (this.rule.paramsFilter && Array.isArray(this.rule.paramsFilter.values)) {
        this.paramsTagsInput.setValue(this.rule.paramsFilter.values);

        if (this.rule.paramsFilter.invert) {
            setButtonChecked(this.model.qs(".invert-trim"), true);
        }
    }
    if (this.rule.trimAllParams) {
        setButtonChecked(this.model.qs(".trim-all-params"), true);
        toggleHidden(true, this.model.qs(".btn-group-params"));
    }
};

FilterRuleInput.prototype.updateRule = function () {
    RuleInput.prototype.updateRule.call(this);
    this.rule.paramsFilter = {};
    this.rule.paramsFilter.values = this.paramsTagsInput.getValue();

    let regexpChars = /[.+?^${}()|[\]\\]/g; // excluding * wildcard
    let regexpParam = /^\/(.*)\/$/;

    // construct regexp pattern of filter params
    if (this.rule.paramsFilter.values.length > 0) {
        let pattern = "";
        for (let param of this.rule.paramsFilter.values) {
            let testRegexp = param.match(regexpParam);
            if (testRegexp) {
                pattern += "|" + testRegexp[1];
            } else {
                pattern += "|" + param.replace(regexpChars, "\\$&").replace(/\*/g, ".*");
            }
        }
        this.rule.paramsFilter.pattern = pattern.substring(1);

        if (this.model.qs(".invert-trim").checked) {
            this.rule.paramsFilter.invert = true;
        } else {
            delete this.rule.paramsFilter.invert;
        }
    } else {
        delete this.rule.paramsFilter;
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
    if (this.rule.trimAllParams || this.rule.paramsFilter) {
        description.push(browser.i18n.getMessage(this.description[1]));
    }
    if (description.length === 2) {
        return browser.i18n.getMessage("and", description);
    } else {
        return description.join();
    }
};

RedirectRuleInput.prototype.updateInputs = function () {
    RuleInput.prototype.updateInputs.call(this);
    this.model.qs(".redirectUrl").value = this.rule.redirectUrl || "";
};

RedirectRuleInput.prototype.updateRule = function () {
    RuleInput.prototype.updateRule.call(this);
    this.rule.redirectUrl = this.model.qs(".redirectUrl").value;
};

RedirectRuleInput.prototype.getDescription = function () {
    return browser.i18n.getMessage(this.description, this.rule.redirectUrl);
};

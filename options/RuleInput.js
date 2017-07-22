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
    if (RuleInputFactory.prototype.singleton) {
        return RuleInputFactory.prototype.singleton;
    }
    RuleInputFactory.prototype.singleton = this;
}

RuleInputFactory.prototype = {
    load: function () {
        return getSubPage("RuleInputModel.html").then(page => {
            this.models = page;
            translateDocument(this.models);
        });
    },

    newInput: function (rule = new RequestRule()) {
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
    },

    getModel: function (id) {
        let model = this.models.querySelector("#" + id).cloneNode(true);
        model.removeAttribute("id");
        return model;
    }
};

function RuleInput(rule) {
    let self = this;
    self.rule = rule;
    self.model = self.factory.getModel("ruleInputModel");
    self.updateHeader();

    self.hostsTagsInput = new TagsInput(self.$(".host"));
    self.pathsTagsInput = new TagsInput(self.$(".path"));
    self.tldsTagsInput = new TagsInput(self.$(".input-tlds"));

    self.$(".host").addEventListener("change", self.validateTLDPattern.bind(self));
    self.$(".btn-edit").addEventListener("click", self.toggleEdit.bind(self));
    self.$(".btn-activate").addEventListener("click", self.toggleActive.bind(self));
    self.$(".action").addEventListener("change", self.change.bind(self));

    self.$(".rule-header").addEventListener("dblclick", function (e) {
        if (e.target.tagName !== "BUTTON" && e.target.tagName !== "INPUT"
            && !e.target.hasAttribute("contenteditable")) {
            self.toggleEdit();
        }
    });

    self.$(".title").addEventListener("keydown", self.onEnterKey.bind(self));
    self.$(".title").addEventListener("blur", function (e) {
        self.setTitle(e.target.textContent);
        if (!self.rule.title) {
            e.target.textContent = self.getTitle();
        }
    });

    self.$(".description").addEventListener("keydown", self.onEnterKey.bind(self));
    self.$(".description").addEventListener("blur", function (e) {
        self.setDescription(e.target.textContent);
        if (!self.rule.description) {
            e.target.textContent = self.getDescription();
        }
    });

    self.$(".any-url").addEventListener("change", function (e) {
        setButtonChecked(self.$(".any-url"), e.target.checked);
        toggleHidden(e.target.checked, self.$(".host").parentNode, self.$(".path").parentNode, self.$(".pattern"));
        self.validateTLDPattern();
    });

    self.$(".btn-group-types").addEventListener("change", function (e) {
        setButtonChecked(e.target, e.target.checked);
    }, false);

    self.$(".more-types").addEventListener("change", function (e) {
        e.stopPropagation();
        let extraTypes = self.$$(".extra-type:not(:checked)");
        self.$(".more-types").parentNode.querySelector(".text").textContent =
            browser.i18n.getMessage("show_more_" + !self.$(".more-types").checked);
        for (let type of extraTypes) {
            toggleHidden(!self.$(".more-types").checked, type.parentNode);
        }
    }, false);

    self.$(".any-type").addEventListener("change", function (e) {
        setButtonChecked(self.$(".any-type"), e.target.checked);
        toggleHidden(e.target.checked, self.$(".btn-group-types"));
        if (e.target.checked) {
            for (let type of self.$$(".type:checked")) {
                setButtonChecked(type, false);
            }
        }
    });

    self.$(".btn-tlds").addEventListener("click", function () {
        toggleHidden(self.$(".tlds-block"));
    });

    self.$(".input-tlds").addEventListener("change", function () {
        let numberOfTlds = self.tldsTagsInput.getValue().length;
        let error = numberOfTlds === 0;
        self.$(".btn-tlds > .badge").textContent = numberOfTlds;
        self.$(".btn-tlds").classList.toggle("text-danger", error);
        self.$(".btn-tlds").parentNode.classList.toggle("has-error", error);
    });

    self.$(".select").addEventListener("change", function () {
        self.model.classList.toggle("selected", this.checked);
        toggleHidden(document.querySelectorAll(".rule.selected").length === 0,
            document.querySelector(".selected-action-buttons"));
    });

    self.model.getRuleInput = function () {
        return this;
    };

    self.$(".rule-input").addEventListener("change", function () {
        if (this.reportValidity()) {
            self.save();
        }
    });
}

RuleInput.prototype = {
    title: "rule_title_new",
    description: "rule_description_new",
    optionsPath: "rules",
    factory: new RuleInputFactory(),

    $: function (selector) {
        return this.model.querySelector(selector);
    },
    $$: function (selector) {
        return this.model.querySelectorAll(selector);
    },

    getRule: function () {
        this.updateRule();
        return this.rule;
    },

    change: function () {
        this.updateRule();
        let newInput = this.factory.newInput(this.rule);
        this.model.parentNode.insertBefore(newInput.model, this.model);
        this.softRemove();
        newInput.toggleEdit();
    },

    remove: function () {
        this.softRemove();
        if (this.indexOfRule() !== -1) {
            myOptionsManager.saveOption(this.optionsPath);
        } else {
            myOptionsManager.saveAllOptions();
        }
    },

    softRemove: function () {
        this.model.parentNode.removeChild(this.model);
        let i = this.indexOfRule();
        if (i !== -1) {
            myOptionsManager.options[this.optionsPath].splice(i, 1);
        }
    },

    save: function () {
        this.updateRule();
        if (this.indexOfRule() === -1) {
            myOptionsManager.options[this.optionsPath].push(this.rule);
            return myOptionsManager.saveAllOptions().then(this.updateHeader.bind(this)).then(this.showSavedText.bind(this));
        }
        return myOptionsManager.saveOption(this.optionsPath).then(this.updateHeader.bind(this)).then(this.showSavedText.bind(this));
    },

    showSavedText: function () {
        toggleFade(this.$(".text-saved"));
    },

    toggleActive: function () {
        this.rule.active = !this.rule.active;
        this.setActiveState();
        if (this.indexOfRule() !== -1) {
            myOptionsManager.saveOption(this.optionsPath);
        }
    },

    toggleEdit: function () {
        toggleHidden(this.$(".panel-collapse"));
        if (this.model.classList.toggle("editing")) {
            this.$(".title").setAttribute("contenteditable", true);
            this.$(".description").setAttribute("contenteditable", true);
        } else {
            this.$(".title").removeAttribute("contenteditable");
            this.$(".description").removeAttribute("contenteditable");
        }
        this.updateInputs();
    },

    setActiveState: function () {
        this.model.classList.toggle("disabled", !this.rule.active);
        this.$(".btn-activate").textContent = browser.i18n.getMessage("activate_" + !this.rule.active);
    },

    validateTLDPattern: function () {
        let isTldsPattern = !this.$(".any-url").checked && hostsTLDWildcardPattern.test(this.$(".host").value);
        toggleHidden(!isTldsPattern, this.$(".form-group-tlds"));
        if (isTldsPattern) {
            if (this.tldsTagsInput.getValue().length === 0) {
                this.$(".btn-tlds").classList.add("text-danger");
                this.$(".btn-tlds").parentNode.classList.add("has-error");
                toggleHidden(!isTldsPattern, this.$(".tlds-block"));
            }
            this.tldsTagsInput.enable();
        } else {
            this.tldsTagsInput.disable();
        }
    },

    indexOfRule: function () {
        return myOptionsManager.options[this.optionsPath].indexOf(this.rule);
    },

    getTitle: function () {
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
    },

    setTitle: function (str) {
        let title = encodeURIComponent(str.trim());
        if (title) {
            this.rule.title = title;
        } else {
            delete this.rule.title;
            delete this.rule.name;
        }
        this.save();
    },

    getDescription: function () {
        return browser.i18n.getMessage(this.description);
    },

    setDescription: function (str) {
        let description = encodeURIComponent(str.trim());
        if (description) {
            this.rule.description = description;
        } else {
            delete this.rule.description;
        }
        this.save();
    },

    onEnterKey: function (e) {
        if (e.keyCode === 13) { // Enter
            e.target.blur();
            e.preventDefault();
            return false;
        }
    },

    updateHeader: function () {
        let title = this.rule.title || this.rule.name || this.getTitle();
        title = decodeURIComponent(title);
        let description = this.rule.description || this.getDescription();
        description = decodeURIComponent(description);
        this.model.setAttribute("data-type", this.rule.action);
        this.$(".icon").src = "../icons/icon-" + this.rule.action + "@19.png";
        this.$(".title").textContent = title;
        this.$(".title").title = title;
        this.$(".description").textContent = description;
        this.$(".description").title = description;
        this.$(".match-patterns").textContent = RequestControl.resolveUrls(this.rule.pattern).length;
        this.setActiveState();
    },

    updateInputs: function () {
        this.$(".scheme").value = this.rule.pattern.scheme;
        this.hostsTagsInput.setValue(this.rule.pattern.host);
        this.pathsTagsInput.setValue(this.rule.pattern.path);
        this.$(".action").value = this.rule.action;
        if (this.rule.pattern.topLevelDomains) {
            this.$(".btn-tlds > .badge").textContent = this.rule.pattern.topLevelDomains.length;
            this.tldsTagsInput.setValue(this.rule.pattern.topLevelDomains);
            this.tldsTagsInput.enable();
        }
        toggleHidden(!hostsTLDWildcardPattern.test(this.$(".host").value), this.$(".form-group-tlds"));

        setButtonChecked(this.$(".type[value=main_frame]"), false);

        if (!this.rule.types || this.rule.types.length === 0) {
            setButtonChecked(this.$(".any-type"), true);
            toggleHidden(true, this.$(".btn-group-types"));
        } else {
            for (let value of this.rule.types) {
                let type = this.$("[value=" + value + "]");
                setButtonChecked(type, true);
                toggleHidden(false, type.parentNode);
            }
        }

        if (this.rule.pattern.allUrls) {
            setButtonChecked(this.$(".any-url"), true);
            toggleHidden(true, this.$(".host").parentNode, this.$(".path").parentNode, this.$(".pattern"));
        }
    },

    updateRule: function () {
        if (this.$(".any-url").checked) {
            this.rule.pattern.allUrls = true;
        } else {
            this.rule.pattern.scheme = this.$(".scheme").value;
            this.rule.pattern.host = this.hostsTagsInput.getValue();
            this.rule.pattern.path = this.pathsTagsInput.getValue();
            if (hostsTLDWildcardPattern.test(this.$(".host").value)) {
                this.rule.pattern.topLevelDomains = this.tldsTagsInput.getValue();
            }
            delete this.rule.pattern.allUrls;
        }

        this.rule.types = Array.from(this.$$(".type:checked"), type => type.value);
        if (this.rule.types.length === 0 || this.$(".any-type").checked) {
            delete this.rule.types;
        }

        this.rule.action = this.$(".action").value;
    },
};

function BlockRuleInput(rule) {
    RuleInput.call(this, rule);
}
BlockRuleInput.prototype = Object.create(RuleInput.prototype);
BlockRuleInput.prototype.constructor = BlockRuleInput;
BlockRuleInput.prototype.title = "rule_title_block";
BlockRuleInput.prototype.description = "rule_description_block";

function WhitelistRuleInput(rule) {
    RuleInput.call(this, rule);
}
WhitelistRuleInput.prototype = Object.create(RuleInput.prototype);
WhitelistRuleInput.prototype.constructor = WhitelistRuleInput;
WhitelistRuleInput.prototype.title = "rule_title_whitelist";
WhitelistRuleInput.prototype.description = "rule_description_whitelist";

function FilterRuleInput(rule) {
    RuleInput.call(this, rule);

    this.$(".rule-input").appendChild(this.factory.getModel("action-" + rule.action));
    this.paramsTagsInput = new TagsInput(this.$(".input-params"));

    this.invertTrim = function (e) {
        setButtonChecked(e.target, e.target.checked);
    };
    this.toggleTrimAll = function (e) {
        setButtonChecked(e.target, e.target.checked);
        toggleHidden(e.target.checked, this.$(".btn-group-params"));
    };
    this.$(".trim-all-params").addEventListener("change", this.toggleTrimAll.bind(this));
    this.$(".invert-trim").addEventListener("change", this.invertTrim.bind(this));
}
FilterRuleInput.prototype = Object.create(RuleInput.prototype);
FilterRuleInput.prototype.constructor = FilterRuleInput;
FilterRuleInput.prototype.title = "rule_title_filter";
FilterRuleInput.prototype.description = ["rule_description_filter_url", "rule_description_filter_parameters"];

FilterRuleInput.prototype.updateInputs = function () {
    RuleInput.prototype.updateInputs.call(this);
    this.$(".redirectionFilter-toggle").checked = !this.rule.skipRedirectionFilter;
    if (this.rule.paramsFilter && Array.isArray(this.rule.paramsFilter.values)) {
        this.paramsTagsInput.setValue(this.rule.paramsFilter.values);

        if (this.rule.paramsFilter.invert) {
            setButtonChecked(this.$(".invert-trim"), true);
        }
    }
    if (this.rule.trimAllParams) {
        setButtonChecked(this.$(".trim-all-params"), true);
        toggleHidden(true, this.$(".btn-group-params"));
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

        if (this.$(".invert-trim").checked) {
            this.rule.paramsFilter.invert = true;
        } else {
            delete this.rule.paramsFilter.invert;
        }
    } else {
        delete this.rule.paramsFilter;
    }

    if (this.$(".redirectionFilter-toggle").checked) {
        delete this.rule.skipRedirectionFilter;
    } else {
        this.rule.skipRedirectionFilter = true;
    }

    if (this.$(".trim-all-params").checked) {
        this.rule.trimAllParams = true;
    } else {
        delete this.rule.trimAllParams;
    }
};

function RedirectRuleInput(rule) {
    RuleInput.call(this, rule);
    this.$(".rule-input").appendChild(this.factory.getModel("action-" + rule.action));
}
RedirectRuleInput.prototype = Object.create(RuleInput.prototype);
RedirectRuleInput.prototype.constructor = RedirectRuleInput;
RedirectRuleInput.prototype.title = "rule_title_redirect";
RedirectRuleInput.prototype.description = "rule_description_redirect";

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
    this.$(".redirectUrl").value = this.rule.redirectUrl || "";
};

RedirectRuleInput.prototype.updateRule = function () {
    RuleInput.prototype.updateRule.call(this);
    this.rule.redirectUrl = this.$(".redirectUrl").value;
};

RedirectRuleInput.prototype.getDescription = function () {
    return browser.i18n.getMessage(this.description, this.rule.redirectUrl);
};

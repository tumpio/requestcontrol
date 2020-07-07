/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import { createRule, createMatchPatterns, isTLDHostPattern } from "../main/api.js";
import { uuid } from "./lib/uuid.js";
import {
    getSubPage,
    onToggleButtonChange,
    setButtonChecked,
    setButtonDisabled,
    toggleHidden
} from "./lib/UiHelpers.js";
import { translateDocument } from "./lib/i18n.js";
import { TagsInput } from "./lib/tags-input/src/tags-input.js";

/**
 * Request Control Rule Input for rule creation.
 * Prototyped inheritance is used for rule types separation.
 * The same input model in RuleInputModel.html is used for all rule types.
 */

function RequestRule() {
    return {
        uuid: uuid(),
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

export function RuleInputFactory() {
    if (RuleInputFactory.prototype.singleton) {
        return RuleInputFactory.prototype.singleton;
    }
    RuleInputFactory.prototype.singleton = this;
}

function typeModel(index, value) {
    let label = document.createElement("label");
    let input = document.createElement("input");
    let span = document.createElement("span");
    label.setAttribute("class", "btn");
    input.setAttribute("data-index", index);
    input.setAttribute("type", "checkbox");
    input.setAttribute("autocomplete", "off");
    input.setAttribute("class", "type");
    input.setAttribute("value", value);
    span.setAttribute("data-i18n", value);
    label.appendChild(input);
    label.appendChild(span);
    if (index === 0) {
        label.classList.add("active");
        input.checked = true;
    } else if (index > 4) {
        label.classList.add("d-none");
        input.classList.add("extra-type");
    }
    return label;
}

RuleInputFactory.prototype = {
    load: function () {
        let request = new Request("./types.json", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            mode: "same-origin"
        });

        let pagePromise = getSubPage("RuleInputModel.html");
        let typesPromise = fetch(request).then(response => response.json());

        return Promise.all([pagePromise, typesPromise])
            .then(([page, types]) => {
                this.models = page;
                let typesGroup = this.models.querySelector(".btn-group-types");
                let sorted = [];
                for (let [type, index] of Object.entries(types)) {
                    sorted[index] = type;
                }
                for (let [index, type] of sorted.entries()) {
                    typesGroup.insertBefore(typeModel(index, type), typesGroup.lastElementChild);
                }
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
            case "secure":
                return new SecureRuleInput(rule);
            default:
                return new RuleInput(rule);
        }
    },

    getModel: function (id) {
        let model = this.models.querySelector("#" + id).cloneNode(true);
        model.removeAttribute("id");
        return model;
    },

    setOptionsManager: function (manager) {
        this.optionsManager = manager;
    }
};

function RuleInput(rule) {
    this.rule = rule;
    this.model = this.factory.getModel("ruleInputModel");
    this.updateHeader();

    this.model.getRule = this.getRule.bind(this);
    this.model.setRule = this.setRule.bind(this);
    this.model.remove = this.remove.bind(this);
    this.model.edit = this.toggleEdit.bind(this);
    this.model.select = this.select.bind(this);

    this.hostsTagsInput = new TagsInput(this.$(".host"));
    this.pathsTagsInput = new TagsInput(this.$(".path"));
    this.tldsTagsInput = new TagsInput(this.$(".input-tlds"));
    this.includesTagsInput = new TagsInput(this.$(".input-includes"));
    this.excludesTagsInput = new TagsInput(this.$(".input-excludes"));

    browser.runtime.getBrowserInfo().then(info => {
        if (info.name === "Fennec") {
            this.$(".rule-header").addEventListener("click", this.onHeaderClick.bind(this));
        } else {
            this.$(".title").addEventListener("click", this.onHeaderTitleClick.bind(this));
        }
    });
    this.$(".title").addEventListener("keydown", this.onEnterKey.bind(this));
    this.$(".title").addEventListener("blur", this.onSetTitle.bind(this));
    this.$(".description").addEventListener("keydown", this.onEnterKey.bind(this));
    this.$(".description").addEventListener("blur", this.onSetDescription.bind(this));
    this.$(".tag").addEventListener("keydown", this.onEnterKey.bind(this));
    this.$(".tag").addEventListener("blur", this.onSetTag.bind(this));
    this.$(".add-tag").addEventListener("click", this.onAddTag.bind(this));
    this.$(".select").addEventListener("change", this.onSelect.bind(this));
    this.$(".btn-activate").addEventListener("click", this.toggleActive.bind(this));

    this.$(".host").addEventListener("change", this.validateTLDPattern.bind(this));
    this.$(".any-url").addEventListener("change", this.onSelectAnyUrl.bind(this));

    this.$(".collapse-url-matchers").addEventListener("click", this.toggleMatchers.bind(this));

    this.$(".btn-group-types").addEventListener("change", onToggleButtonChange, false);
    this.$(".btn-group-types").addEventListener("change", this.sortTypes.bind(this), false);
    this.$(".more-types").addEventListener("change", this.onShowMoreTypes.bind(this), false);
    this.$(".any-type").addEventListener("change", this.onSelectAnyType.bind(this));

    this.$(".btn-tlds").addEventListener("click", this.toggleTLDs.bind(this));
    this.$(".input-tlds").addEventListener("change", this.onSetTLDs.bind(this));

    this.$(".rule-input").addEventListener("change", this.onChange.bind(this));
    this.$(".btn-delete").addEventListener("click", this.remove.bind(this));

    for (let edit of this.$$(".toggle-edit")) {
        edit.addEventListener("click", this.toggleEdit.bind(this));
    }
    for (let create of this.$$(".btn-create")) {
        create.addEventListener("click", this.create.bind(this));
    }
    if (this.rule.action) {
        this.$(".rule-input").appendChild(this.factory.getModel("action-" + this.rule.action));
    }
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
        return this.rule;
    },

    remove: function () {
        this.softRemove();
        this.factory.optionsManager.saveOption(this.optionsPath);
    },

    softRemove: function () {
        this.model.dispatchEvent(new CustomEvent("rule-removed", {
            bubbles: true
        }));
        let i = this.indexOfRule();
        if (i !== -1) {
            this.factory.optionsManager.options[this.optionsPath].splice(i, 1);
        }
    },

    create: function () {
        this.save()
            .then(this.toggleEdit.bind(this))
            .catch(function () {
                // skip
            });
    },

    save: function () {
        if (!this.isValid()) {
            this.model.classList.add("error");
            return Promise.reject();
        }
        this.model.classList.remove("error");
        if (this.indexOfRule() === -1) {
            this.factory.optionsManager.options[this.optionsPath].push(this.rule);
        }
        return this.factory.optionsManager.saveOption(this.optionsPath)
            .then(this.updateHeader.bind(this))
            .then(this.toggleSaved.bind(this));
    },

    isValid: function () {
        if (!this.$(".rule-input").reportValidity()) {
            return false;
        }
        try {
            this.updateRule();
            createRule(this.rule);
        } catch {
            return false;
        }
        return true;
    },

    toggleParent: function () {
        let list = document.getElementById(this.rule.action);
        if (list !== this.model.parentNode) {
            list.appendChild(this.model);
        }
    },

    toggleSaved: function () {
        let input = this.model;
        input.classList.add("saved");
        setTimeout(function () {
            input.classList.remove("saved");
        }, 5000);
    },

    toggleActive: function () {
        this.rule.active = !this.rule.active;
        this.setActiveState();
        if (this.indexOfRule() !== -1) {
            this.factory.optionsManager.saveOption(this.optionsPath);
        }
    },

    toggleEdit: function () {
        toggleHidden(this.$(".rule-input-area"));
        if (this.model.classList.toggle("editing")) {
            this.$(".title").setAttribute("contenteditable", true);
            this.$(".description").setAttribute("contenteditable", true);
            this.$(".tag").setAttribute("contenteditable", true);
            if (this.model.classList.contains("not-edited")) {
                this.model.classList.remove("not-edited");
                this.updateInputs();
            }
        } else {
            this.$(".title").removeAttribute("contenteditable");
            this.$(".description").removeAttribute("contenteditable");
            this.$(".tag").removeAttribute("contenteditable");
            this.model.dispatchEvent(new CustomEvent("rule-edit-completed", {
                bubbles: true
            }));
        }
    },

    toggleSelect: function () {
        this.select(!this.model.classList.contains("selected"));
        this.model.parentNode.dispatchEvent(new CustomEvent("rule-select", {
            bubbles: true,
            detail: { "action": this.rule.action, parent: this.model.parentNode }
        }));
    },

    toggleMatchers: function () {
        toggleHidden(this.$(".group-url-matchers"));
        this.$(".collapse-url-matchers").classList.toggle("collapsed");
    },

    toggleTLDs: function () {
        toggleHidden(this.$(".tlds-block"));
        this.$(".btn-tlds").classList.toggle("collapsed");
    },

    setActiveState: function () {
        this.model.classList.toggle("disabled", !this.rule.active);
        this.$(".btn-activate").textContent = browser.i18n.getMessage("activate_" + !this.rule.active);
    },

    validateTLDPattern: function () {
        let isTldsPattern = !this.$(".any-url").checked && this.hostsTagsInput.value.some(isTLDHostPattern);
        toggleHidden(!isTldsPattern, this.$(".form-group-tlds"));
        this.tldsTagsInput.disabled = !isTldsPattern;
        if (isTldsPattern) {
            if (this.tldsTagsInput.value.length === 0) {
                this.$(".btn-tlds").classList.add("text-danger");
                this.$(".btn-tlds").parentNode.classList.add("has-error");
                toggleHidden(!isTldsPattern, this.$(".tlds-block"));
            }
        }
    },

    indexOfRule: function () {
        return this.factory.optionsManager.options[this.optionsPath].indexOf(this.rule);
    },

    getTitle: function () {
        let hosts = "";
        if (this.rule.pattern.allUrls) {
            hosts = browser.i18n.getMessage("any_url");
        } else if (Array.isArray(this.rule.pattern.host)) {
            hosts = this.rule.pattern.host.slice(0, 3).join(", ").replace(/\*\.|\.\*/g, "");
            if (this.rule.pattern.host.length > 3) {
                hosts = browser.i18n.getMessage("rule_title_hosts", [hosts,
                    (this.rule.pattern.host.length - 3)]);
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

    setTag: function (str) {
        let tag = encodeURIComponent(str.trim());
        if (tag) {
            this.rule.tag = tag;
        } else {
            delete this.rule.tag;
        }
        this.save();
    },

    onChange: function (e) {
        let input = this;
        if (e.target.classList.contains("action")) {
            this.onActionChange();
            let newInput = this.factory.newInput(this.rule);
            this.model.parentNode.insertBefore(newInput.model, this.model);
            newInput.select(this.isSelected());
            this.softRemove();
            newInput.toggleEdit();
            input = newInput;
        }
        if (input.model.parentNode.id !== "newRules") {
            input.save();
        }
    },

    onActionChange: function () {
        this.updateRule();
    },

    onEnterKey: function (e) {
        if (e.keyCode === 13) { // Enter
            e.target.blur();
            e.preventDefault();
            return false;
        }
    },

    onHeaderClick: function (e) {
        if (e.target.tagName !== "BUTTON" && e.target.tagName !== "INPUT"
            && !e.target.hasAttribute("contenteditable")) {
            this.toggleSelect();
        }
    },

    onHeaderTitleClick: function (e) {
        if (e.target.tagName !== "BUTTON" && e.target.tagName !== "INPUT"
            && !e.target.hasAttribute("contenteditable")) {
            this.toggleEdit();
        }
    },

    onSetTitle: function (e) {
        this.setTitle(e.target.textContent);
        if (!this.rule.title) {
            e.target.textContent = this.getTitle();
        }
    },

    onSetDescription: function (e) {
        this.setDescription(e.target.textContent);
        if (!this.rule.description) {
            e.target.textContent = this.getDescription();
        }
    },

    onAddTag: function (e) {
        toggleHidden(e.target);
        this.$(".tag").focus();
    },

    onSetTag: function (e) {
        this.setTag(e.target.textContent);
    },

    setType: function (value, bool) {
        let type = this.$(".type[value=" + value + "]");
        setButtonChecked(type, bool);
        toggleHidden(false, type.parentNode);
    },

    sortTypes: function () {
        let list = this.$(".btn-group-types");
        let sorting = true;
        let i, types, swap;
        while (sorting) {
            sorting = false;
            types = list.getElementsByClassName("type");
            for (i = 0; i < (types.length - 1); i++) {
                swap = false;
                if (types[i].checked)
                    continue;
                if (types[i + 1].checked) {
                    swap = true;
                    break;
                } else if (Number(types[i].dataset.index) > Number(types[i + 1].dataset.index)) {
                    swap = true;
                    break;
                }
            }
            if (swap) {
                list.insertBefore(types[i + 1].parentNode, types[i].parentNode);
                sorting = true;
            }
        }
    },

    onShowMoreTypes: function (e) {
        e.stopPropagation();
        let extraTypes = this.$$(".extra-type:not(:checked)");
        this.$(".more-types").parentNode.querySelector(".text").textContent =
            browser.i18n.getMessage("show_more_" + !this.$(".more-types").checked);
        for (let type of extraTypes) {
            toggleHidden(!this.$(".more-types").checked, type.parentNode);
        }
    },

    onSelectAnyUrl: function (e) {
        this.setAnyUrl(e.target.checked);
    },

    setAnyUrl: function (enabled) {
        setButtonChecked(this.$(".any-url"), enabled);
        toggleHidden(enabled, this.$(".url-wrap"));
        this.validateTLDPattern();
        this.hostsTagsInput.disabled = enabled;
    },

    onSelectAnyType: function (e) {
        this.setAnyType(e.target.checked);
    },

    setAnyType: function (bool) {
        setButtonChecked(this.$(".any-type"), bool);
        toggleHidden(bool, this.$(".btn-group-types"));
        if (bool) {
            for (let type of this.$$(".type:checked")) {
                setButtonChecked(type, false);
            }
        }
    },

    onSetTLDs: function () {
        let numberOfTlds = this.tldsTagsInput.value.length;
        let error = numberOfTlds === 0;
        this.$(".btn-tlds > .badge").textContent = numberOfTlds;
        this.$(".btn-tlds").classList.toggle("text-danger", error);
        this.$(".btn-tlds").parentNode.classList.toggle("has-error", error);
    },

    onSelect: function (e) {
        this.select(e.target.checked);
        this.model.parentNode.dispatchEvent(new CustomEvent("rule-select", {
            bubbles: true,
            detail: { "action": this.rule.action, parent: this.model.parentNode }
        }));
    },

    select: function (isSelected) {
        this.$(".select").checked = isSelected;
        this.model.classList.toggle("selected", isSelected);
    },

    isSelected: function () {
        return this.$(".select").checked;
    },

    updateHeader: function () {
        let title = this.rule.title || this.rule.name || this.getTitle();
        title = decodeURIComponent(title);
        let description = this.rule.description || this.getDescription();
        description = decodeURIComponent(description);
        let tag = this.rule.tag || "";
        tag = decodeURIComponent(tag);
        this.model.setAttribute("data-type", this.rule.action);
        this.$(".title").textContent = title;
        this.$(".title").title = description;
        this.$(".description").textContent = description;
        this.$(".tag").textContent = tag;
        this.$(".tag-badge").textContent = tag;
        this.$(".count-patterns").textContent = browser.i18n.getMessage("count_patterns",
            [createMatchPatterns(this.rule.pattern).length]);
        if (!this.rule.types) {
            this.$(".count-types").textContent = browser.i18n.getMessage("any");
        } else if (this.rule.types.length === 1) {
            this.$(".count-types").textContent = browser.i18n.getMessage(this.rule.types[0]);
        } else {
            this.$(".count-types").textContent = browser.i18n.getMessage("count_types",
                [this.rule.types.length]);
        }
        toggleHidden(tag.length === 0, this.$(".tag-badge").parentNode);
        toggleHidden(tag.length > 0, this.$(".add-tag"));
        this.setActiveState();
    },

    updateInputs: function () {
        this.$(".scheme").value = this.rule.pattern.scheme || "*";
        this.hostsTagsInput.value = this.rule.pattern.host;
        this.pathsTagsInput.value = this.rule.pattern.path;

        if (this.rule.action) {
            setButtonChecked(this.$(".action[value=" + this.rule.action + "]"), true);
        }

        if (this.rule.pattern.topLevelDomains) {
            this.tldsTagsInput.value = this.rule.pattern.topLevelDomains;
            this.onSetTLDs();
        }

        if (this.rule.pattern.includes) {
            this.includesTagsInput.value = this.rule.pattern.includes;
        }

        if (this.rule.pattern.excludes) {
            this.excludesTagsInput.value = this.rule.pattern.excludes;
        }

        if (this.rule.pattern.origin) {
            setButtonChecked(this.$(".origin-matcher[value=" + this.rule.pattern.origin + "]"), true);
        }

        if (!this.rule.types || this.rule.types.length === 0) {
            this.setAnyType(true);
        } else {
            this.setType("main_frame", false);
            for (let type of this.rule.types) {
                this.setType(type, true);
            }
            this.sortTypes();
        }

        this.setAnyUrl(this.rule.pattern.hasOwnProperty("allUrls"));
    },

    updateRule: function () {
        if (this.$(".any-url").checked) {
            this.rule.pattern.allUrls = true;
        } else {
            this.rule.pattern.scheme = this.$(".scheme").value;
            this.rule.pattern.host = this.hostsTagsInput.value;
            this.rule.pattern.path = this.pathsTagsInput.value;
            if (this.rule.pattern.host.some(isTLDHostPattern)) {
                this.rule.pattern.topLevelDomains = this.tldsTagsInput.value;
            }
            delete this.rule.pattern.allUrls;
        }
        let includes = this.includesTagsInput.value;
        let excludes = this.excludesTagsInput.value;
        let origin = this.$(".origin-matcher:checked");
        if (includes.length > 0) {
            this.rule.pattern.includes = includes;
        } else {
            delete this.rule.pattern.includes;
        }
        if (excludes.length > 0) {
            this.rule.pattern.excludes = excludes;
        } else {
            delete this.rule.pattern.excludes;
        }
        if (origin && origin.value !== "any") {
            this.rule.pattern.origin = origin.value;
        } else {
            delete this.rule.pattern.origin;
        }

        this.rule.types = Array.from(this.$$(".type:checked"), type => type.value);
        if (this.rule.types.length === 0 || this.$(".any-type").checked) {
            delete this.rule.types;
        }

        this.rule.action = this.$(".action:checked").value;
    },

    setRule: function (rule) {
        this.rule = rule;
        this.updateHeader();
        this.updateInputs();
    }
};

function BlockRuleInput(rule) {
    RuleInput.call(this, rule);
}

BlockRuleInput.prototype = Object.create(RuleInput.prototype);
BlockRuleInput.prototype.constructor = BlockRuleInput;
BlockRuleInput.prototype.title = "rule_title_block";
BlockRuleInput.prototype.description = "rule_description_block";

function SecureRuleInput(rule) {
    RuleInput.call(this, rule);
    rule.pattern.scheme = "http";
    delete rule.pattern.allUrls;

    this.$(".scheme").disabled = true;
    this.$(".any-url").disabled = true;
}

SecureRuleInput.prototype = Object.create(RuleInput.prototype);
SecureRuleInput.prototype.constructor = SecureRuleInput;
SecureRuleInput.prototype.title = "rule_title_secure";
SecureRuleInput.prototype.description = "rule_description_secure";

SecureRuleInput.prototype.onActionChange = function () {
    this.$(".scheme").disabled = false;
    this.$(".any-url").disabled = false;
    RuleInput.prototype.onActionChange.call(this);
};

function WhitelistRuleInput(rule) {
    RuleInput.call(this, rule);
    this.$(".log-whitelist-toggle").addEventListener("change", onToggleButtonChange);
}

WhitelistRuleInput.prototype = Object.create(RuleInput.prototype);
WhitelistRuleInput.prototype.constructor = WhitelistRuleInput;
WhitelistRuleInput.prototype.title = "rule_title_whitelist";
WhitelistRuleInput.prototype.description = "rule_description_whitelist";

WhitelistRuleInput.prototype.updateInputs = function () {
    RuleInput.prototype.updateInputs.call(this);
    setButtonChecked(this.$(".log-whitelist-toggle"), this.rule.log === true);
};

WhitelistRuleInput.prototype.updateRule = function () {
    RuleInput.prototype.updateRule.call(this);
    if (this.$(".log-whitelist-toggle").checked) {
        this.rule.log = true;
    } else {
        delete this.rule.log;
    }
};

function BaseRedirectRuleInput(rule) {
    RuleInput.call(this, rule);
    this.$(".redirect-document").addEventListener("change", onToggleButtonChange);
}

BaseRedirectRuleInput.prototype = Object.create(RuleInput.prototype);
BaseRedirectRuleInput.prototype.constructor = FilterRuleInput;

BaseRedirectRuleInput.prototype.updateInputs = function () {
    RuleInput.prototype.updateInputs.call(this);
    setButtonChecked(this.$(".redirect-document"), this.rule.redirectDocument);
};

BaseRedirectRuleInput.prototype.updateRule = function () {
    RuleInput.prototype.updateRule.call(this);

    if (this.$(".redirect-document").checked) {
        this.rule.redirectDocument = true;
    } else {
        delete this.rule.redirectDocument;
    }
};

function FilterRuleInput(rule) {
    BaseRedirectRuleInput.call(this, rule);

    this.paramsTagsInput = new TagsInput(this.$(".input-params"));

    this.$(".trim-all-params").addEventListener("change", this.toggleTrimAll.bind(this));
    this.$(".invert-trim").addEventListener("change", onToggleButtonChange);
    this.$(".filter-toggle").addEventListener("change", this.onToggleFilter.bind(this));
    this.$(".filter-skip-within-same-domain-toggle").addEventListener("change", onToggleButtonChange);
}

FilterRuleInput.prototype = Object.create(BaseRedirectRuleInput.prototype);
FilterRuleInput.prototype.constructor = FilterRuleInput;
FilterRuleInput.prototype.title = "rule_title_filter";
FilterRuleInput.prototype.description = ["rule_description_filter_url",
    "rule_description_filter_parameters"];

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

FilterRuleInput.prototype.toggleTrimAll = function (e) {
    setButtonChecked(e.target, e.target.checked);
    toggleHidden(e.target.checked, this.$(".col-trim-parameters"));
};

FilterRuleInput.prototype.onToggleFilter = function (e) {
    let checked = e.target.checked;
    setButtonChecked(e.target, checked);
    setButtonDisabled(this.$(".filter-skip-within-same-domain-toggle"), !checked);
    if (!checked) {
        setButtonChecked(this.$(".filter-skip-within-same-domain-toggle"), false);
    }
};

FilterRuleInput.prototype.updateInputs = function () {
    BaseRedirectRuleInput.prototype.updateInputs.call(this);
    setButtonChecked(this.$(".filter-toggle"), !this.rule.skipRedirectionFilter);
    setButtonChecked(this.$(".filter-skip-within-same-domain-toggle"), this.rule.skipOnSameDomain);
    setButtonDisabled(this.$(".filter-skip-within-same-domain-toggle"), this.rule.skipRedirectionFilter);
    if (this.rule.paramsFilter && Array.isArray(this.rule.paramsFilter.values)) {
        this.paramsTagsInput.value = this.rule.paramsFilter.values;

        if (this.rule.paramsFilter.invert) {
            setButtonChecked(this.$(".invert-trim"), true);
        }
    }
    if (this.rule.trimAllParams) {
        setButtonChecked(this.$(".trim-all-params"), true);
        toggleHidden(true, this.$(".col-trim-parameters"));
    }
};

FilterRuleInput.prototype.updateRule = function () {
    BaseRedirectRuleInput.prototype.updateRule.call(this);
    this.rule.paramsFilter = {};
    this.rule.paramsFilter.values = this.paramsTagsInput.value;

    if (this.rule.paramsFilter.values.length > 0) {
        if (this.$(".invert-trim").checked) {
            this.rule.paramsFilter.invert = true;
        } else {
            delete this.rule.paramsFilter.invert;
        }
    } else {
        delete this.rule.paramsFilter;
    }

    if (this.$(".filter-toggle").checked) {
        delete this.rule.skipRedirectionFilter;
    } else {
        this.rule.skipRedirectionFilter = true;
    }

    if (this.$(".filter-skip-within-same-domain-toggle").checked) {
        this.rule.skipOnSameDomain = true;
    } else {
        delete this.rule.skipOnSameDomain;
    }

    if (this.$(".trim-all-params").checked) {
        this.rule.trimAllParams = true;
    } else {
        delete this.rule.trimAllParams;
    }
};

function RedirectRuleInput(rule) {
    BaseRedirectRuleInput.call(this, rule);
}

RedirectRuleInput.prototype = Object.create(BaseRedirectRuleInput.prototype);
RedirectRuleInput.prototype.constructor = RedirectRuleInput;
RedirectRuleInput.prototype.title = "rule_title_redirect";
RedirectRuleInput.prototype.description = "rule_description_redirect";

RedirectRuleInput.prototype.updateInputs = function () {
    BaseRedirectRuleInput.prototype.updateInputs.call(this);
    this.$(".redirectUrl").value = this.rule.redirectUrl || "";
};

RedirectRuleInput.prototype.updateRule = function () {
    BaseRedirectRuleInput.prototype.updateRule.call(this);
    this.rule.redirectUrl = this.$(".redirectUrl").value;
};

RedirectRuleInput.prototype.getDescription = function () {
    return browser.i18n.getMessage(this.description, encodeURIComponent(this.rule.redirectUrl));
};

RedirectRuleInput.prototype.getTitle = function () {
    return browser.i18n.getMessage("rule_title_redirect_to", [RuleInput.prototype.getTitle.call(this), encodeURIComponent(this.rule.redirectUrl)]);
};

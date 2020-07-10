/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createRule, createMatchPatterns, isTLDHostPattern } from "../main/api.js";
import { uuid } from "../util/uuid.js";
import { onToggleButtonChange, setButtonChecked, setButtonDisabled, toggleHidden } from "../util/ui-helpers.js";
import { TagsInput } from "../util/tags-input/src/tags-input.js";

export function newRuleInput(
    rule = {
        uuid: uuid(),
        pattern: {
            scheme: "*",
            host: "",
            path: "",
        },
        types: ["main_frame"],
        action: "",
        active: true,
    }
) {
    const template = document.getElementById("ruleInput");
    const model = template.content.cloneNode(true).querySelector(".rule");

    switch (rule.action) {
        case "filter":
            return new FilterRuleInput(rule, model);
        case "block":
            return new BlockRuleInput(rule, model);
        case "redirect":
            return new RedirectRuleInput(rule, model);
        case "whitelist":
            return new WhitelistRuleInput(rule, model);
        case "secure":
            return new SecureRuleInput(rule, model);
        default:
            return new RuleInput(rule, model);
    }
}

class RuleInput {
    constructor(rule, model) {
        this.rule = rule;
        this.model = model;
        this.model.id = "rule-" + rule.uuid;
        this.model.dataset.uuid = rule.uuid;
        this.model.input = this;

        this.hostsTagsInput = new TagsInput(this.$(".host"));
        this.pathsTagsInput = new TagsInput(this.$(".path"));
        this.tldsTagsInput = new TagsInput(this.$(".input-tlds"));
        this.includesTagsInput = new TagsInput(this.$(".input-includes"));
        this.excludesTagsInput = new TagsInput(this.$(".input-excludes"));

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
        this.$(".btn-delete").addEventListener("click", this.onDelete.bind(this));
        this.$(".btn-create").addEventListener("click", this.onCreate.bind(this));
        this.$$(".toggle-edit").forEach((edit) => edit.addEventListener("click", this.toggleEdit.bind(this)));

        browser.runtime.getBrowserInfo().then((info) => {
            if (info.name === "Fennec") {
                this.$(".rule-header").addEventListener("click", this.onHeaderClick.bind(this));
            } else {
                this.$(".title").addEventListener("click", this.onHeaderTitleClick.bind(this));
            }
        });

        if (this.rule.action) {
            const actions = document.getElementById("actions-" + this.rule.action);
            if (actions) {
                this.$(".rule-input").appendChild(actions.content.cloneNode(true));
            }
        }

        this.updateHeader();
    }

    $(selector) {
        return this.model.querySelector(selector);
    }

    $$(selector) {
        return this.model.querySelectorAll(selector);
    }

    toggleSaved() {
        const input = this.model;
        input.classList.add("saved");
        setTimeout(function () {
            input.classList.remove("saved");
        }, 5000);
    }

    toggleActive() {
        this.rule.active = !this.rule.active;
        this.updateActiveState();
        this.notifyChanged();
    }

    toggleEdit() {
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
            this.model.dispatchEvent(
                new CustomEvent("rule-edit-completed", {
                    bubbles: true,
                    detail: {
                        action: this.rule.action,
                    },
                })
            );
        }
    }

    toggleMatchers() {
        toggleHidden(this.$(".group-url-matchers"));
        this.$(".collapse-url-matchers").classList.toggle("collapsed");
    }

    toggleTLDs() {
        toggleHidden(this.$(".tlds-block"));
        this.$(".btn-tlds").classList.toggle("collapsed");
    }

    validateTLDPattern() {
        const isTldsPattern = !this.$(".any-url").checked && this.hostsTagsInput.value.some(isTLDHostPattern);
        toggleHidden(!isTldsPattern, this.$(".form-group-tlds"));
        this.tldsTagsInput.disabled = !isTldsPattern;
        if (isTldsPattern) {
            if (this.tldsTagsInput.value.length === 0) {
                this.$(".btn-tlds").classList.add("text-danger");
                this.$(".btn-tlds").parentNode.classList.add("has-error");
                toggleHidden(!isTldsPattern, this.$(".tlds-block"));
            }
        }
    }

    get title() {
        let hosts = "";
        if (this.rule.pattern.allUrls) {
            hosts = browser.i18n.getMessage("any_url");
        } else if (Array.isArray(this.rule.pattern.host)) {
            hosts = this.rule.pattern.host
                .slice(0, 3)
                .join(", ")
                .replace(/\*\.|\.\*/g, "");
            if (this.rule.pattern.host.length > 3) {
                hosts = browser.i18n.getMessage("rule_title_hosts", [hosts, this.rule.pattern.host.length - 3]);
            }
        } else {
            hosts = this.rule.pattern.host.replace(/\*\.|\.\*/g, "");
        }
        return browser.i18n.getMessage(this.constructor.TITLE_KEY, hosts);
    }

    set title(str) {
        const title = encodeURIComponent(str.trim());
        if (title) {
            this.rule.title = title;
        } else {
            delete this.rule.title;
            delete this.rule.name;
        }
        this.notifyChanged();
        this.updateHeader();
    }

    get description() {
        return browser.i18n.getMessage(this.constructor.DESCRIPTION_KEY);
    }

    set description(str) {
        const description = encodeURIComponent(str.trim());
        if (description) {
            this.rule.description = description;
        } else {
            delete this.rule.description;
        }
        this.notifyChanged();
        this.updateHeader();
    }

    set selected(isSelected) {
        this.model.classList.toggle("selected", isSelected);
        this.$(".select").checked = isSelected;
    }

    get selected() {
        return this.$(".select").checked;
    }

    setTag(str) {
        const tag = encodeURIComponent(str.trim());
        if (tag) {
            this.rule.tag = tag;
        } else {
            delete this.rule.tag;
        }
        this.notifyChanged();
        this.updateHeader();
    }

    onCreate() {
        this.model.dispatchEvent(
            new CustomEvent("rule-created", {
                bubbles: true,
                detail: {
                    input: this,
                    rule: this.rule,
                },
            })
        );
    }

    onChange(e) {
        try {
            this.updateRule();
        } finally {
            this.updateHeader();
        }
        if (e.target.classList.contains("action")) {
            this.onActionChange();
        } else {
            this.notifyChanged();
        }
    }

    onActionChange() {
        this.model.dispatchEvent(
            new CustomEvent("rule-action-changed", {
                bubbles: true,
                detail: {
                    input: this,
                },
            })
        );
    }

    onDelete() {
        this.model.dispatchEvent(
            new CustomEvent("rule-deleted", {
                bubbles: true,
                detail: {
                    uuid: this.rule.uuid,
                },
            })
        );
    }

    onEnterKey(e) {
        if (e.keyCode === 13) {
            // Enter
            e.target.blur();
            e.preventDefault();
            return false;
        }
    }

    onHeaderClick(e) {
        if (
            e.target.tagName !== "BUTTON" &&
            e.target.tagName !== "INPUT" &&
            !e.target.hasAttribute("contenteditable")
        ) {
            this.$(".select").click();
        }
    }

    onHeaderTitleClick(e) {
        if (
            e.target.tagName !== "BUTTON" &&
            e.target.tagName !== "INPUT" &&
            !e.target.hasAttribute("contenteditable")
        ) {
            this.toggleEdit();
        }
    }

    onSetTitle(e) {
        this.title = e.target.textContent;
        if (!this.rule.title) {
            e.target.textContent = this.title;
        }
    }

    onSetDescription(e) {
        this.description = e.target.textContent;
        if (!this.rule.description) {
            e.target.textContent = this.description;
        }
    }

    onAddTag(e) {
        toggleHidden(e.target);
        this.$(".tag").focus();
    }

    onSetTag(e) {
        this.setTag(e.target.textContent);
    }

    onShowMoreTypes(e) {
        e.stopPropagation();
        const extraTypes = this.$$(".extra-type:not(:checked)");
        this.$(".more-types").parentNode.querySelector(".text").textContent = browser.i18n.getMessage(
            "show_more_" + !this.$(".more-types").checked
        );
        for (const type of extraTypes) {
            toggleHidden(!this.$(".more-types").checked, type.parentNode);
        }
    }

    onSelectAnyUrl(e) {
        this.setAnyUrl(e.target.checked);
    }

    setAnyUrl(enabled) {
        setButtonChecked(this.$(".any-url"), enabled);
        toggleHidden(enabled, this.$(".url-wrap"));
        this.validateTLDPattern();
        this.hostsTagsInput.disabled = enabled;
    }

    onSelectAnyType(e) {
        this.setAnyType(e.target.checked);
    }

    setAnyType(bool) {
        setButtonChecked(this.$(".any-type"), bool);
        toggleHidden(bool, this.$(".btn-group-types"));
        if (bool) {
            this.$$(".type:checked").forEach((type) => setButtonChecked(type, false));
        }
    }

    onSetTLDs() {
        const numberOfTlds = this.tldsTagsInput.value.length;
        const error = numberOfTlds === 0;
        this.$(".btn-tlds > .badge").textContent = numberOfTlds;
        this.$(".btn-tlds").classList.toggle("text-danger", error);
        this.$(".btn-tlds").parentNode.classList.toggle("has-error", error);
    }

    onSelect(e) {
        this.selected = e.target.checked;
        this.model.dispatchEvent(
            new CustomEvent("rule-selected", {
                bubbles: true,
            })
        );
    }

    notifyChanged() {
        this.model.dispatchEvent(
            new CustomEvent("rule-changed", {
                bubbles: true,
                detail: {
                    rule: this.rule,
                    input: this,
                },
            })
        );
    }

    isValid() {
        if (!this.$(".rule-input").reportValidity()) {
            return false;
        }
        try {
            createRule(this.rule);
        } catch {
            return false;
        }
        return true;
    }

    setType(value, bool) {
        const type = this.$(".type[value=" + value + "]");
        setButtonChecked(type, bool);
        toggleHidden(false, type.parentNode);
    }

    sortTypes() {
        const list = this.$(".btn-group-types");
        let sorting = true;
        let i, types, swap;
        while (sorting) {
            sorting = false;
            types = list.getElementsByClassName("type");
            for (i = 0; i < types.length - 1; i++) {
                swap = false;
                if (types[i].checked) continue;
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
    }

    updateHeader() {
        const title = decodeURIComponent(this.rule.title || this.rule.name || this.title);
        const description = decodeURIComponent(this.rule.description || this.description);
        const tag = decodeURIComponent(this.rule.tag || "");
        this.model.setAttribute("data-type", this.rule.action);
        this.$(".title").textContent = title;
        this.$(".title").title = description;
        this.$(".description").textContent = description;
        this.$(".tag").textContent = tag;
        this.$(".tag-badge").textContent = tag;
        this.$(".count-patterns").textContent = browser.i18n.getMessage("count_patterns", [
            createMatchPatterns(this.rule.pattern).length,
        ]);
        if (!this.rule.types) {
            this.$(".count-types").textContent = browser.i18n.getMessage("any");
        } else if (this.rule.types.length === 1) {
            this.$(".count-types").textContent = browser.i18n.getMessage(this.rule.types[0]);
        } else {
            this.$(".count-types").textContent = browser.i18n.getMessage("count_types", [this.rule.types.length]);
        }
        toggleHidden(tag.length === 0, this.$(".tag-badge").parentNode);
        toggleHidden(tag.length > 0, this.$(".add-tag"));
        this.updateActiveState();
    }

    updateActiveState() {
        this.model.classList.toggle("disabled", !this.rule.active);
        this.$(".btn-activate").textContent = browser.i18n.getMessage("activate_" + !this.rule.active);
    }

    updateInputs() {
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
            for (const type of this.rule.types) {
                this.setType(type, true);
            }
            this.sortTypes();
        }

        this.setAnyUrl(this.rule.pattern.hasOwnProperty("allUrls"));
    }

    updateRule() {
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

        const includes = this.includesTagsInput.value;
        const excludes = this.excludesTagsInput.value;
        const origin = this.$(".origin-matcher:checked");

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

        this.rule.types = Array.from(this.$$(".type:checked"), (type) => type.value);

        if (this.rule.types.length === 0 || this.$(".any-type").checked) {
            delete this.rule.types;
        }

        this.rule.action = this.$(".action:checked").value;
    }
}

class BlockRuleInput extends RuleInput {
    constructor(rule, model) {
        super(rule, model);
    }
}

class SecureRuleInput extends RuleInput {
    constructor(rule, model) {
        super(rule, model);
        rule.pattern.scheme = "http";
        delete rule.pattern.allUrls;
        this.$(".scheme").disabled = true;
        this.$(".any-url").disabled = true;
    }

    onActionChange() {
        this.$(".scheme").disabled = false;
        this.$(".any-url").disabled = false;
        super.onActionChange();
    }
}

class WhitelistRuleInput extends RuleInput {
    constructor(rule, model) {
        super(rule, model);
        this.$(".log-whitelist-toggle").addEventListener("change", onToggleButtonChange);
    }

    updateInputs() {
        super.updateInputs();
        setButtonChecked(this.$(".log-whitelist-toggle"), this.rule.log === true);
    }

    updateRule() {
        super.updateRule();
        if (this.$(".log-whitelist-toggle").checked) {
            this.rule.log = true;
        } else {
            delete this.rule.log;
        }
    }
}

class BaseRedirectRuleInput extends RuleInput {
    constructor(rule, model) {
        super(rule, model);
        this.$(".redirect-document").addEventListener("change", onToggleButtonChange);
    }

    updateInputs() {
        super.updateInputs();
        setButtonChecked(this.$(".redirect-document"), this.rule.redirectDocument);
    }

    updateRule() {
        super.updateRule();
        if (this.$(".redirect-document").checked) {
            this.rule.redirectDocument = true;
        } else {
            delete this.rule.redirectDocument;
        }
    }
}

class FilterRuleInput extends BaseRedirectRuleInput {
    constructor(rule, model) {
        super(rule, model);
        this.paramsTagsInput = new TagsInput(this.$(".input-params"));
        this.$(".trim-all-params").addEventListener("change", this.onToggleTrimAll.bind(this));
        this.$(".invert-trim").addEventListener("change", onToggleButtonChange);
        this.$(".filter-toggle").addEventListener("change", this.onToggleFilter.bind(this));
        this.$(".filter-skip-within-same-domain-toggle").addEventListener("change", onToggleButtonChange);
    }

    onToggleTrimAll(e) {
        setButtonChecked(e.target, e.target.checked);
        toggleHidden(e.target.checked, this.$(".col-trim-parameters"));
    }

    onToggleFilter(e) {
        const checked = e.target.checked;
        setButtonChecked(e.target, checked);
        setButtonDisabled(this.$(".filter-skip-within-same-domain-toggle"), !checked);
        if (!checked) {
            setButtonChecked(this.$(".filter-skip-within-same-domain-toggle"), false);
        }
    }

    updateInputs() {
        super.updateInputs();
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
    }

    updateRule() {
        super.updateRule();
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
    }
}

class RedirectRuleInput extends BaseRedirectRuleInput {
    constructor(rule, model) {
        super(rule, model);
    }

    get title() {
        return browser.i18n.getMessage("rule_title_redirect_to", [
            super.title,
            encodeURIComponent(this.rule.redirectUrl),
        ]);
    }

    get description() {
        return browser.i18n.getMessage("rule_description_redirect", encodeURIComponent(this.rule.redirectUrl));
    }

    updateInputs() {
        super.updateInputs();
        this.$(".redirectUrl").value = this.rule.redirectUrl || "";
    }

    updateRule() {
        super.updateRule();
        this.rule.redirectUrl = this.$(".redirectUrl").value;
    }
}

RuleInput.TITLE_KEY = "rule_title_new";
RuleInput.DESCRIPTION_KEY = "rule_description_new";
BlockRuleInput.TITLE_KEY = "rule_title_block";
BlockRuleInput.DESCRIPTION_KEY = "rule_description_block";
SecureRuleInput.TITLE_KEY = "rule_title_secure";
SecureRuleInput.DESCRIPTION_KEY = "rule_description_secure";
WhitelistRuleInput.TITLE_KEY = "rule_title_whitelist";
WhitelistRuleInput.DESCRIPTION_KEY = "rule_description_whitelist";
FilterRuleInput.TITLE_KEY = "rule_title_filter";
FilterRuleInput.DESCRIPTION_KEY = "rule_description_filter";
RedirectRuleInput.TITLE_KEY = "rule_title_redirect";

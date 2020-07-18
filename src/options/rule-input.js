/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createRule, createMatchPatterns, isTLDHostPattern } from "../main/api.js";
import { uuid } from "../util/uuid.js";
import { onToggleButtonChange, setButtonChecked, setButtonDisabled, toggleHidden } from "../util/ui-helpers.js";

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
    let input;
    switch (rule.action) {
        case "filter":
            input = new FilterRuleInput();
            break;
        case "block":
            input = new BlockRuleInput();
            break;
        case "redirect":
            input = new RedirectRuleInput();
            break;
        case "whitelist":
            input = new WhitelistRuleInput();
            break;
        case "secure":
            input = new SecureRuleInput();
            break;
        default:
            input = new RuleInput();
    }
    input.id = rule.uuid;
    input.dataset.uuid = rule.uuid;
    input.rule = rule;
    input.classList.add("not-edited");
    input.spellcheck = false;
    return input;
}

const getIsMobile = (() => browser.runtime.getBrowserInfo().then((info) => info.name === "Fennec"))();

class RuleInput extends HTMLElement {
    constructor() {
        super();
        const template = document.getElementById("rule-input");
        this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));
        const root = this.shadowRoot;

        this.hostsTagsInput = root.getElementById("host");
        this.pathsTagsInput = root.getElementById("path");
        this.tldsTagsInput = root.getElementById("tlds");
        this.includesTagsInput = root.getElementById("includes");
        this.excludesTagsInput = root.getElementById("excludes");

        root.getElementById("title").addEventListener("keydown", this.onEnterKey.bind(this));
        root.getElementById("title").addEventListener("blur", this.onSetTitle.bind(this));
        root.getElementById("description").addEventListener("keydown", this.onEnterKey.bind(this));
        root.getElementById("description").addEventListener("blur", this.onSetDescription.bind(this));
        root.getElementById("tag").addEventListener("keydown", this.onEnterKey.bind(this));
        root.getElementById("tag").addEventListener("blur", this.onSetTag.bind(this));
        root.getElementById("add-tag").addEventListener("click", this.onAddTag.bind(this));
        root.getElementById("select").addEventListener("change", this.onSelect.bind(this));
        root.getElementById("activate").addEventListener("click", this.toggleActive.bind(this));
        root.getElementById("host").addEventListener("change", this.validateTLDPattern.bind(this));
        root.getElementById("any-url").addEventListener("change", this.onSelectAnyUrl.bind(this));
        root.getElementById("collapse-matchers").addEventListener("click", this.toggleMatchers.bind(this));
        root.getElementById("types").addEventListener("change", onToggleButtonChange, false);
        root.getElementById("types").addEventListener("change", this.sortTypes.bind(this), false);
        root.getElementById("more-types").addEventListener("change", this.onShowMoreTypes.bind(this), false);
        root.getElementById("any-type").addEventListener("change", this.onSelectAnyType.bind(this));
        root.getElementById("collapse-tlds").addEventListener("click", this.toggleTLDs.bind(this));
        root.getElementById("tlds").addEventListener("change", this.onSetTLDs.bind(this));
        root.getElementById("form").addEventListener("change", this.onChange.bind(this));
        root.getElementById("delete").addEventListener("click", this.onDelete.bind(this));
        root.getElementById("create").addEventListener("click", this.onCreate.bind(this));
        this.shadowRoot
            .querySelectorAll(".toggle-edit")
            .forEach((edit) => edit.addEventListener("click", this.toggleEdit.bind(this)));

        getIsMobile.then((isMobile) => {
            if (isMobile) {
                this.shadowRoot.getElementById("header").addEventListener("click", this.onHeaderClick.bind(this));
            } else {
                this.shadowRoot.getElementById("title").addEventListener("click", this.onHeaderTitleClick.bind(this));
            }
        });
    }

    focus() {
        this.shadowRoot.getElementById("host").focus();
    }

    toggleSaved() {
        const input = this;
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
        toggleHidden(this.shadowRoot.getElementById("input-area"));
        if (this.classList.toggle("editing")) {
            this.shadowRoot.getElementById("title").setAttribute("contenteditable", true);
            this.shadowRoot.getElementById("description").setAttribute("contenteditable", true);
            this.shadowRoot.getElementById("tag").setAttribute("contenteditable", true);
            if (this.classList.contains("not-edited")) {
                this.classList.remove("not-edited");
                this.updateInputs();
            }
        } else {
            this.shadowRoot.getElementById("title").removeAttribute("contenteditable");
            this.shadowRoot.getElementById("description").removeAttribute("contenteditable");
            this.shadowRoot.getElementById("tag").removeAttribute("contenteditable");
            this.dispatchEvent(
                new CustomEvent("rule-edit-completed", {
                    bubbles: true,
                    composed: true,
                    detail: {
                        action: this.rule.action,
                        input: this,
                    },
                })
            );
        }
    }

    toggleMatchers() {
        toggleHidden(this.shadowRoot.getElementById("matchers"));
        this.shadowRoot.getElementById("collapse-matchers").classList.toggle("collapsed");
    }

    toggleTLDs() {
        toggleHidden(this.shadowRoot.getElementById("tlds-area"));
        this.shadowRoot.getElementById("collapse-tlds").classList.toggle("collapsed");
    }

    validateTLDPattern() {
        const isTldsPattern =
            !this.shadowRoot.getElementById("any-url").checked && this.hostsTagsInput.tags.some(isTLDHostPattern);
        toggleHidden(!isTldsPattern, this.shadowRoot.getElementById("tlds-form"));
        this.tldsTagsInput.disabled = !isTldsPattern;
        if (isTldsPattern) {
            if (this.tldsTagsInput.tags.length === 0) {
                this.shadowRoot.getElementById("collapse-tlds").classList.add("text-danger");
                this.shadowRoot.getElementById("collapse-tlds").parentNode.classList.add("has-error");
                toggleHidden(!isTldsPattern, this.shadowRoot.getElementById("tlds-area"));
            }
        }
    }

    set rule(rule) {
        this._rule = rule;
        this.updateHeader();
    }

    get rule() {
        return this._rule;
    }

    get title() {
        if (this._ctitle) {
            return this._ctitle;
        }
        let title;
        if (this.rule.title) {
            title = decodeURIComponent(this.rule.title);
        } else if (this.rule.name) {
            title = decodeURIComponent(this.rule.name);
        } else {
            title = this.defaultTitle;
        }
        this._ctitle = title;
        return title;
    }

    get defaultTitle() {
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
        this._ctitle = null;
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
        if (this._cdescription) {
            return this._cdescription;
        }
        let description;
        if (this.rule.description) {
            description = decodeURIComponent(this.rule.description);
        } else {
            description = this.defaultDescription;
        }
        this._cdescription = description;
        return description;
    }

    get defaultDescription() {
        return browser.i18n.getMessage(this.constructor.DESCRIPTION_KEY);
    }

    set description(str) {
        this._cdescription = null;
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
        this.classList.toggle("selected", isSelected);
        this.shadowRoot.getElementById("select").checked = isSelected;
    }

    get selected() {
        return this.shadowRoot.getElementById("select").checked;
    }

    get tag() {
        if (this._ctag) {
            return this._ctag;
        }
        let tag;
        if (this.rule.tag) {
            tag = decodeURIComponent(this.rule.tag);
        } else {
            tag = "";
        }
        this._ctag = tag;
        return tag;
    }

    set tag(str) {
        this._ctag = null;
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
        if (!this.isValid()) {
            this.reportValidity();
            return;
        }
        this.dispatchEvent(
            new CustomEvent("rule-created", {
                bubbles: true,
                composed: true,
                detail: {
                    rule: this.rule,
                },
            })
        );
    }

    onChange(e) {
        this.updateRule();
        this.updateHeader();

        if (e.target.classList.contains("action")) {
            this.onActionChange();
        } else {
            this.notifyChangedIfValid();
        }
    }

    onActionChange() {
        this.dispatchEvent(
            new CustomEvent("rule-action-changed", {
                bubbles: true,
                composed: true,
                detail: {
                    input: this,
                },
            })
        );
    }

    onDelete() {
        this.dispatchEvent(
            new CustomEvent("rule-deleted", {
                bubbles: true,
                composed: true,
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
            this.shadowRoot.getElementById("select").click();
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
        this.shadowRoot.getElementById("tag").focus();
    }

    onSetTag(e) {
        this.tag = e.target.textContent;
    }

    onShowMoreTypes(e) {
        e.stopPropagation();
        const extraTypes = this.shadowRoot.querySelectorAll(".extra-type:not(:checked)");
        const moreButton = this.shadowRoot.getElementById("more-types");
        moreButton.parentNode.querySelector(".text").textContent = browser.i18n.getMessage(
            "show_more_" + !moreButton.checked
        );
        for (const type of extraTypes) {
            toggleHidden(!moreButton.checked, type.parentNode);
        }
    }

    onSelectAnyUrl(e) {
        this.setAnyUrl(e.target.checked);
    }

    setAnyUrl(enabled) {
        setButtonChecked(this.shadowRoot.getElementById("any-url"), enabled);
        toggleHidden(enabled, this.shadowRoot.getElementById("url-area"));
        this.validateTLDPattern();
        this.hostsTagsInput.disabled = enabled;
    }

    onSelectAnyType(e) {
        this.setAnyType(e.target.checked);
    }

    setAnyType(bool) {
        setButtonChecked(this.shadowRoot.getElementById("any-type"), bool);
        toggleHidden(bool, this.shadowRoot.getElementById("types"));
        if (bool) {
            this.shadowRoot.querySelectorAll(".type:checked").forEach((type) => setButtonChecked(type, false));
        }
    }

    onSetTLDs() {
        const numberOfTlds = this.tldsTagsInput.tags.length;
        const error = numberOfTlds === 0;
        this.shadowRoot.querySelector("#collapse-tlds > .badge").textContent = numberOfTlds;
        this.shadowRoot.getElementById("collapse-tlds").classList.toggle("text-danger", error);
        this.shadowRoot.getElementById("collapse-tlds").parentNode.classList.toggle("has-error", error);
    }

    onSelect(e) {
        this.selected = e.target.checked;
        this.dispatchEvent(
            new CustomEvent("rule-selected", {
                bubbles: true,
                composed: true,
            })
        );
    }

    notifyChangedIfValid() {
        if (!this.isValid()) {
            this.notifyInvalid();
        } else {
            this.notifyChanged();
        }
    }

    notifyChanged() {
        this.dispatchEvent(
            new CustomEvent("rule-changed", {
                bubbles: true,
                composed: true,
                detail: {
                    rule: this.rule,
                    input: this,
                },
            })
        );
    }

    notifyInvalid() {
        this.dispatchEvent(
            new CustomEvent("rule-invalid", {
                bubbles: true,
                composed: true,
                detail: {
                    input: this,
                },
            })
        );
    }

    isValid() {
        if (!this.shadowRoot.getElementById("form").checkValidity()) {
            return false;
        }
        try {
            createRule(this.rule);
        } catch {
            return false;
        }
        this.classList.remove("error");
        return true;
    }

    reportValidity() {
        this.classList.toggle("error", !this.isValid());
        this.shadowRoot.getElementById("form").reportValidity();
    }

    setType(value, bool) {
        const type = this.shadowRoot.querySelector(".type[value=" + value + "]");
        setButtonChecked(type, bool);
        toggleHidden(false, type.parentNode);
    }

    sortTypes() {
        const list = this.shadowRoot.getElementById("types");
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
        this.setAttribute("data-type", this.rule.action);
        this.shadowRoot.getElementById("title").textContent = this.title;
        this.shadowRoot.getElementById("title").title = this.description;
        this.shadowRoot.getElementById("description").textContent = this.description;
        this.shadowRoot.getElementById("tag").textContent = this.tag;
        this.shadowRoot.getElementById("tag-badge").textContent = this.tag;
        this.shadowRoot.getElementById("patterns-badge").textContent = browser.i18n.getMessage("count_patterns", [
            createMatchPatterns(this.rule.pattern).length,
        ]);
        if (!this.rule.types) {
            this.shadowRoot.getElementById("types-badge").textContent = browser.i18n.getMessage("any");
        } else if (this.rule.types.length === 1) {
            this.shadowRoot.getElementById("types-badge").textContent = browser.i18n.getMessage(this.rule.types[0]);
        } else {
            this.shadowRoot.getElementById("types-badge").textContent = browser.i18n.getMessage("count_types", [
                this.rule.types.length,
            ]);
        }
        toggleHidden(this.tag.length === 0, this.shadowRoot.getElementById("tag-badge").parentNode);
        toggleHidden(this.tag.length > 0, this.shadowRoot.getElementById("add-tag"));
        this.updateActiveState();
    }

    updateActiveState() {
        this.classList.toggle("disabled", !this.rule.active);
        this.shadowRoot.getElementById("activate").textContent = browser.i18n.getMessage(
            "activate_" + !this.rule.active
        );
    }

    updateInputs() {
        this.shadowRoot.getElementById("scheme").value = this.rule.pattern.scheme || "*";
        this.hostsTagsInput.tags = this.rule.pattern.host;
        this.pathsTagsInput.tags = this.rule.pattern.path;

        if (this.rule.action) {
            setButtonChecked(this.shadowRoot.querySelector(".action[value=" + this.rule.action + "]"), true);
        }

        if (this.rule.pattern.topLevelDomains) {
            this.tldsTagsInput.tags = this.rule.pattern.topLevelDomains;
            this.onSetTLDs();
        }

        if (this.rule.pattern.includes) {
            this.includesTagsInput.tags = this.rule.pattern.includes;
        }

        if (this.rule.pattern.excludes) {
            this.excludesTagsInput.tags = this.rule.pattern.excludes;
        }

        if (this.rule.pattern.origin) {
            setButtonChecked(
                this.shadowRoot.querySelector(".origin-matcher[value=" + this.rule.pattern.origin + "]"),
                true
            );
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
        if (this.shadowRoot.getElementById("any-url").checked) {
            this.rule.pattern.allUrls = true;
        } else {
            this.rule.pattern.scheme = this.shadowRoot.getElementById("scheme").value;
            this.rule.pattern.host = this.hostsTagsInput.tags;
            this.rule.pattern.path = this.pathsTagsInput.tags;
            if (this.rule.pattern.host.some(isTLDHostPattern)) {
                this.rule.pattern.topLevelDomains = this.tldsTagsInput.tags;
            }
            delete this.rule.pattern.allUrls;
        }

        const includes = this.includesTagsInput.tags;
        const excludes = this.excludesTagsInput.tags;
        const origin = this.shadowRoot.querySelector(".origin-matcher:checked");

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

        this.rule.types = Array.from(this.shadowRoot.querySelectorAll(".type:checked"), (type) => type.value);

        if (this.rule.types.length === 0 || this.shadowRoot.getElementById("any-type").checked) {
            delete this.rule.types;
        }

        const action = this.shadowRoot.querySelector(".action:checked");
        if (action) {
            this.rule.action = action.value;
        }
    }
}

class BlockRuleInput extends RuleInput {}

class SecureRuleInput extends RuleInput {
    constructor() {
        super();
        this.shadowRoot.getElementById("scheme").disabled = true;
        this.shadowRoot.getElementById("any-url").disabled = true;
    }

    set rule(rule) {
        rule.pattern.scheme = "http";
        delete rule.pattern.allUrls;
        super.rule = rule;
    }

    get rule() {
        return super.rule;
    }

    onActionChange() {
        this.shadowRoot.getElementById("scheme").disabled = false;
        this.shadowRoot.getElementById("any-url").disabled = false;
        super.onActionChange();
    }
}

class WhitelistRuleInput extends RuleInput {
    constructor() {
        super();
        const actions = document.getElementById("actions-whitelist");
        this.shadowRoot.getElementById("form").appendChild(actions.content.cloneNode(true));
        this.shadowRoot.getElementById("log-whitelist").addEventListener("change", onToggleButtonChange);
    }

    updateInputs() {
        super.updateInputs();
        setButtonChecked(this.shadowRoot.getElementById("log-whitelist"), this.rule.log === true);
    }

    updateRule() {
        super.updateRule();
        if (this.shadowRoot.getElementById("log-whitelist").checked) {
            this.rule.log = true;
        } else {
            delete this.rule.log;
        }
    }
}

class BaseRedirectRuleInput extends RuleInput {
    updateInputs() {
        super.updateInputs();
        setButtonChecked(this.shadowRoot.getElementById("redirect-document"), this.rule.redirectDocument);
    }

    updateRule() {
        super.updateRule();
        if (this.shadowRoot.getElementById("redirect-document").checked) {
            this.rule.redirectDocument = true;
        } else {
            delete this.rule.redirectDocument;
        }
    }
}

class FilterRuleInput extends BaseRedirectRuleInput {
    constructor() {
        super();
        const actions = document.getElementById("actions-filter");
        this.shadowRoot.getElementById("form").appendChild(actions.content.cloneNode(true));

        this.paramsTagsInput = this.shadowRoot.getElementById("input-params");
        this.shadowRoot.getElementById("trim-all-params").addEventListener("change", this.onToggleTrimAll.bind(this));
        this.shadowRoot.getElementById("invert-trim").addEventListener("change", onToggleButtonChange);
        this.shadowRoot.getElementById("filter-redirection").addEventListener("change", this.onToggleFilter.bind(this));
        this.shadowRoot.getElementById("skip-same-domain").addEventListener("change", onToggleButtonChange);
        this.shadowRoot.getElementById("redirect-document").addEventListener("change", onToggleButtonChange);
    }

    onToggleTrimAll(e) {
        setButtonChecked(e.target, e.target.checked);
        toggleHidden(e.target.checked, this.shadowRoot.getElementById("trim-parameters"));
    }

    onToggleFilter(e) {
        const checked = e.target.checked;
        setButtonChecked(e.target, checked);
        setButtonDisabled(this.shadowRoot.getElementById("skip-same-domain"), !checked);
        if (!checked) {
            setButtonChecked(this.shadowRoot.getElementById("skip-same-domain"), false);
        }
    }

    updateInputs() {
        super.updateInputs();
        setButtonChecked(this.shadowRoot.getElementById("filter-redirection"), !this.rule.skipRedirectionFilter);
        setButtonChecked(this.shadowRoot.getElementById("skip-same-domain"), this.rule.skipOnSameDomain);
        setButtonDisabled(this.shadowRoot.getElementById("skip-same-domain"), this.rule.skipRedirectionFilter);
        if (this.rule.paramsFilter && Array.isArray(this.rule.paramsFilter.values)) {
            this.paramsTagsInput.tags = this.rule.paramsFilter.values;
            if (this.rule.paramsFilter.invert) {
                setButtonChecked(this.shadowRoot.getElementById("invert-trim"), true);
            }
        }
        if (this.rule.trimAllParams) {
            setButtonChecked(this.shadowRoot.getElementById("trim-all-params"), true);
            toggleHidden(true, this.shadowRoot.getElementById("trim-parameters"));
        }
    }

    updateRule() {
        super.updateRule();
        this.rule.paramsFilter = {};
        this.rule.paramsFilter.values = this.paramsTagsInput.tags;
        if (this.rule.paramsFilter.values.length > 0) {
            if (this.shadowRoot.getElementById("invert-trim").checked) {
                this.rule.paramsFilter.invert = true;
            } else {
                delete this.rule.paramsFilter.invert;
            }
        } else {
            delete this.rule.paramsFilter;
        }
        if (this.shadowRoot.getElementById("filter-redirection").checked) {
            delete this.rule.skipRedirectionFilter;
        } else {
            this.rule.skipRedirectionFilter = true;
        }
        if (this.shadowRoot.getElementById("skip-same-domain").checked) {
            this.rule.skipOnSameDomain = true;
        } else {
            delete this.rule.skipOnSameDomain;
        }
        if (this.shadowRoot.getElementById("trim-all-params").checked) {
            this.rule.trimAllParams = true;
        } else {
            delete this.rule.trimAllParams;
        }
    }
}

class RedirectRuleInput extends BaseRedirectRuleInput {
    constructor() {
        super();
        const actions = document.getElementById("actions-redirect");
        this.shadowRoot.getElementById("form").appendChild(actions.content.cloneNode(true));

        this.shadowRoot.getElementById("redirect-document").addEventListener("change", onToggleButtonChange);
    }

    get defaultTitle() {
        return browser.i18n.getMessage("rule_title_redirect_to", [
            super.defaultTitle,
            encodeURIComponent(this.rule.redirectUrl),
        ]);
    }

    get defaultDescription() {
        return browser.i18n.getMessage("rule_description_redirect", encodeURIComponent(this.rule.redirectUrl));
    }

    updateInputs() {
        super.updateInputs();
        this.shadowRoot.getElementById("redirect-url").value = this.rule.redirectUrl || "";
    }

    updateRule() {
        super.updateRule();
        this.rule.redirectUrl = this.shadowRoot.getElementById("redirect-url").value;
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

customElements.define("filter-rule-input", FilterRuleInput);
customElements.define("redirect-rule-input", RedirectRuleInput);
customElements.define("secure-rule-input", SecureRuleInput);
customElements.define("block-rule-input", BlockRuleInput);
customElements.define("whitelist-rule-input", WhitelistRuleInput);
customElements.define("new-rule-input", RuleInput);

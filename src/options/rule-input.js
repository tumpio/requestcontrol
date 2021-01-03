/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createRequestFilters, createRule, isTLDHostPattern } from "../main/api.js";
import { onToggleButtonChange, setButtonChecked, setButtonDisabled, toggleHidden } from "../util/ui-helpers.js";
import { uuid } from "../util/uuid.js";

const isMobile = window.matchMedia("(max-width: 35em)").matches;

class RuleInput extends HTMLElement {
    constructor() {
        super();
        const template = document.getElementById("rule-input");
        this.appendChild(template.content.cloneNode(true));

        this.hostsTagsInput = this.querySelector("#host");
        this.pathsTagsInput = this.querySelector("#path");
        this.tldsTagsInput = this.querySelector("#tlds");
        this.includesTagsInput = this.querySelector("#includes");
        this.excludesTagsInput = this.querySelector("#excludes");

        this.querySelector("#title").addEventListener("keydown", this.onKeyDown.bind(this));
        this.querySelector("#title").addEventListener("blur", this.onSetTitle.bind(this));
        this.querySelector("#description").addEventListener("keydown", this.onKeyDown.bind(this));
        this.querySelector("#description").addEventListener("blur", this.onSetDescription.bind(this));
        this.querySelector("#tag").addEventListener("keydown", this.onKeyDown.bind(this));
        this.querySelector("#tag").addEventListener("blur", this.onSetTag.bind(this));
        this.querySelector("#add-tag").addEventListener("click", this.onAddTag.bind(this));
        this.querySelector("#select").addEventListener("change", this.onSelect.bind(this));
        this.querySelector("#activate").addEventListener("click", this.toggleActive.bind(this));
        this.querySelector("#host").addEventListener("change", this.validateTLDPattern.bind(this));
        this.querySelector("#any-url").addEventListener("change", this.onSelectAnyUrl.bind(this));
        this.querySelector("#any-tld").addEventListener("change", this.onSelectAnyTLD.bind(this));
        this.querySelector("#collapse-matchers").addEventListener("click", this.toggleMatchers.bind(this));
        this.querySelector("#types").addEventListener("change", onToggleButtonChange, false);
        this.querySelector("#types").addEventListener("change", this.sortTypes.bind(this), false);
        this.querySelector("#more-types").addEventListener("change", this.onShowMoreTypes.bind(this), false);
        this.querySelector("#any-type").addEventListener("change", this.onSelectAnyType.bind(this));
        this.querySelector("#collapse-tlds").addEventListener("click", this.toggleTLDs.bind(this));
        this.querySelector("#tlds").addEventListener("change", this.onSetTLDs.bind(this));
        this.querySelector("#form").addEventListener("change", this.onChange.bind(this));
        this.querySelector("#delete").addEventListener("click", this.onDelete.bind(this));
        this.querySelector("#create").addEventListener("click", this.onCreate.bind(this));
        this.querySelectorAll(".toggle-edit").forEach((edit) =>
            edit.addEventListener("click", this.toggleEdit.bind(this))
        );

        if (isMobile) {
            this.querySelector("#header").addEventListener("click", this.onHeaderClick.bind(this));
        } else {
            this.querySelector("#title").addEventListener("click", this.onHeaderTitleClick.bind(this));
        }
    }

    focus() {
        this.querySelector("#host").focus();
    }

    toggleSaved() {
        const input = this;
        input.classList.add("saved");
        clearTimeout(this.savedTimeout);
        this.savedTimeout = setTimeout(() => {
            input.classList.remove("saved");
        }, 5000);
    }

    toggleActive() {
        this.rule.active = !this.rule.active;
        this.updateActiveState();
        this.updateIfNotEdited();
        this.notifyChangedIfValid();
    }

    toggleEdit() {
        const editing = this.classList.toggle("editing");
        const isNew = this.hasAttribute("new");
        toggleHidden(
            !editing,
            ...this.querySelectorAll(".edit-label"),
            this.querySelector("#input-area"),
            this.querySelector(".description-wrap"),
            this.querySelector(".tag-wrap")
        );
        toggleHidden(editing, this.querySelector(".information"));
        toggleHidden(isNew, this.querySelector(".btn-done"));
        toggleHidden(!isNew, this.querySelector(".btn-create"));
        this.querySelector("#title").setAttribute("contenteditable", editing);
        this.querySelector("#description").setAttribute("contenteditable", editing);
        this.querySelector("#tag").setAttribute("contenteditable", editing);

        if (editing) {
            this.updateIfNotEdited();
        } else {
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
        toggleHidden(this.querySelector("#matchers"));
        this.querySelector("#collapse-matchers").classList.toggle("collapsed");
    }

    toggleTLDs() {
        toggleHidden(this.querySelector("#tlds-area"));
        this.querySelector("#collapse-tlds").classList.toggle("collapsed");
    }

    validateTLDPattern() {
        const isTldsPattern =
            !this.querySelector("#any-url").checked && this.hostsTagsInput.tags.some(isTLDHostPattern);
        toggleHidden(!isTldsPattern, this.querySelector("#tlds-form"));
        this.tldsTagsInput.disabled = !isTldsPattern;
        if (isTldsPattern && this.tldsTagsInput.tags.length === 0) {
            this.querySelector("#collapse-tlds").classList.add("text-danger");
            this.querySelector("#collapse-tlds").parentNode.classList.add("has-error");
            toggleHidden(!isTldsPattern, this.querySelector("#tlds-area"));
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
    }

    get description() {
        if (this._cdescription) {
            return this._cdescription;
        }
        const description = this.rule.description ? decodeURIComponent(this.rule.description) : this.defaultDescription;
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
    }

    set selected(isSelected) {
        this.classList.toggle("selected", isSelected);
        this.querySelector("#select").checked = isSelected;
    }

    get selected() {
        return this.querySelector("#select").checked;
    }

    get tag() {
        if (this._ctag) {
            return this._ctag;
        }
        const tag = this.rule.tag ? decodeURIComponent(this.rule.tag) : "";
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

        if (e.target.id === "action") {
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

    onKeyDown(e) {
        if (e.key === "Enter") {
            e.target.blur();
            e.preventDefault();
            return false;
        }
    }

    onHeaderClick(e) {
        if (e.target.tagName !== "BUTTON" && e.target.tagName !== "INPUT" && !this.classList.contains("editing")) {
            this.querySelector("#select").click();
        }
    }

    onHeaderTitleClick(e) {
        if (
            e.target.tagName !== "BUTTON" &&
            e.target.tagName !== "INPUT" &&
            e.target.getAttribute("contenteditable") !== "true"
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
        this.querySelector("#tag").focus();
    }

    onSetTag(e) {
        this.tag = e.target.textContent;
        const isEmpty = this.tag === "";
        toggleHidden(isEmpty, this.querySelector("#tag-badge").parentNode);
        toggleHidden(!isEmpty, this.querySelector("#add-tag"));
    }

    onShowMoreTypes(e) {
        e.stopPropagation();
        const extraTypes = this.querySelectorAll(".extra-type:not(:checked)");
        const moreButton = this.querySelector("#more-types");
        moreButton.parentNode.querySelector(".text").textContent = browser.i18n.getMessage(
            `show_more_${!moreButton.checked}`
        );
        for (const type of extraTypes) {
            toggleHidden(!moreButton.checked, type.parentNode);
        }
    }

    onSelectAnyUrl(e) {
        this.setAnyUrl(e.target.checked);
    }

    setAnyUrl(enabled) {
        setButtonChecked(this.querySelector("#any-url"), enabled);
        toggleHidden(enabled, this.querySelector("#url-area"));
        this.validateTLDPattern();
        this.hostsTagsInput.disabled = enabled;
    }

    onSelectAnyTLD(e) {
        this.setAnyTLD(e.target.checked);
    }

    setAnyTLD(enabled) {
        setButtonChecked(this.querySelector("#any-tld"), enabled);
        toggleHidden(enabled, this.tldsTagsInput.parentNode);
        this.tldsTagsInput.disabled = enabled;
    }

    onSelectAnyType(e) {
        this.setAnyType(e.target.checked);
    }

    setAnyType(bool) {
        setButtonChecked(this.querySelector("#any-type"), bool);
        toggleHidden(bool, this.querySelector("#types"));
        if (bool) {
            this.querySelectorAll(".type:checked").forEach((type) => setButtonChecked(type, false));
        }
    }

    onSetTLDs() {
        const numberOfTlds = this.tldsTagsInput.tags.length;
        const error = numberOfTlds === 0;
        this.querySelector("#collapse-tlds").classList.toggle("text-danger", error);
        this.querySelector("#collapse-tlds").parentNode.classList.toggle("has-error", error);
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
        if (!this.querySelector("#form").checkValidity()) {
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
        this.querySelector("#form").reportValidity();
    }

    setType(value, bool) {
        const type = this.querySelector(`.type[value=${value}]`);
        setButtonChecked(type, bool);
        toggleHidden(false, type.parentNode);
    }

    sortTypes() {
        const list = this.querySelector("#types");
        let sorting = true;
        let i, types, swap;
        while (sorting) {
            sorting = false;
            types = list.getElementsByClassName("type");
            for (i = 0; i < types.length - 1; i++) {
                swap = false;
                if (types[i].checked) {
                    continue;
                }
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
        this.dataset.type = this.rule.action;
        this.querySelector("#title").textContent = this.title;
        this.querySelector("#title").title = this.description;
        this.querySelector("#description").textContent = this.description;
        this.querySelector("#tag").textContent = this.tag;
        this.querySelector("#tag-badge").textContent = this.tag;
        this.querySelector("#patterns-badge").textContent = browser.i18n.getMessage(
            "count_patterns",
            createRequestFilters(this.rule).reduce((acc, curr) => acc + curr.urls.length, 0)
        );
        if (!this.rule.types) {
            this.querySelector("#types-badge").textContent = browser.i18n.getMessage("any");
        } else if (this.rule.types.length === 1) {
            this.querySelector("#types-badge").textContent = browser.i18n.getMessage(this.rule.types[0]);
        } else {
            this.querySelector("#types-badge").textContent = browser.i18n.getMessage(
                "count_types",
                this.rule.types.length
            );
        }
        toggleHidden(this.tag.length === 0, this.querySelector("#tag-badge").parentNode);
        toggleHidden(this.tag.length > 0, this.querySelector("#add-tag"));
        this.updateActiveState();
    }

    updateActiveState() {
        this.classList.toggle("disabled", !this.rule.active);
        this.querySelector("#activate").textContent = browser.i18n.getMessage(`activate_${!this.rule.active}`);
    }

    updateIfNotEdited() {
        if (this.classList.contains("not-edited")) {
            this.classList.remove("not-edited");
            this.updateInputs();
        }
    }

    updateInputs() {
        this.querySelector("#scheme").value = this.rule.pattern.scheme || "*";
        this.hostsTagsInput.tags = this.rule.pattern.host;
        this.pathsTagsInput.tags = this.rule.pattern.path;

        if (this.rule.action) {
            this.querySelector("#action").value = this.rule.action;
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
            setButtonChecked(this.querySelector(`.origin-matcher[value=${this.rule.pattern.origin}]`), true);
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
        this.setAnyTLD(this.rule.pattern.hasOwnProperty("anyTLD"));
    }

    updateRule() {
        if (this.querySelector("#any-url").checked) {
            this.rule.pattern.allUrls = true;
        } else {
            this.rule.pattern.scheme = this.querySelector("#scheme").value;
            this.rule.pattern.host = this.hostsTagsInput.tags;
            this.rule.pattern.path = this.pathsTagsInput.tags;
            if (this.rule.pattern.host.some(isTLDHostPattern)) {
                this.rule.pattern.topLevelDomains = this.tldsTagsInput.tags;
            }
            delete this.rule.pattern.allUrls;
        }
        if (this.querySelector("#any-tld").checked) {
            this.rule.pattern.anyTLD = true;
        } else {
            delete this.rule.pattern.anyTLD;
        }

        const includes = this.includesTagsInput.tags;
        const excludes = this.excludesTagsInput.tags;
        const origin = this.querySelector(".origin-matcher:checked");

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

        this.rule.types = Array.from(this.querySelectorAll(".type:checked"), (type) => type.value);

        if (this.rule.types.length === 0 || this.querySelector("#any-type").checked) {
            delete this.rule.types;
        }

        const action = this.querySelector("#action").value;
        if (action) {
            this.rule.action = action;
        }
    }
}

class BlockRuleInput extends RuleInput {}

class SecureRuleInput extends RuleInput {
    constructor() {
        super();
        this.querySelector("#scheme").disabled = true;
        this.querySelector("#any-url").disabled = true;
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
        this.querySelector("#scheme").disabled = false;
        this.querySelector("#any-url").disabled = false;
        super.onActionChange();
    }
}

class WhitelistRuleInput extends RuleInput {
    constructor() {
        super();
        const actions = document.getElementById("actions-whitelist");
        this.querySelector("#form").appendChild(actions.content.cloneNode(true));
        this.querySelector("#log-whitelist").addEventListener("change", onToggleButtonChange);
    }

    updateInputs() {
        super.updateInputs();
        setButtonChecked(this.querySelector("#log-whitelist"), this.rule.log === true);
    }

    updateRule() {
        super.updateRule();
        if (this.querySelector("#log-whitelist").checked) {
            this.rule.log = true;
        } else {
            delete this.rule.log;
        }
    }
}

class BaseRedirectRuleInput extends RuleInput {
    updateInputs() {
        super.updateInputs();
        setButtonChecked(this.querySelector("#redirect-document"), this.rule.redirectDocument);
    }

    updateRule() {
        super.updateRule();
        if (this.querySelector("#redirect-document").checked) {
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
        this.querySelector("#form").appendChild(actions.content.cloneNode(true));

        this.paramsTagsInput = this.querySelector("#input-params");
        this.querySelector("#trim-all-params").addEventListener("change", this.onToggleTrimAll.bind(this));
        this.querySelector("#invert-trim").addEventListener("change", onToggleButtonChange);
        this.querySelector("#filter-redirection").addEventListener("change", this.onToggleFilter.bind(this));
        this.querySelector("#skip-same-domain").addEventListener("change", onToggleButtonChange);
        this.querySelector("#redirect-document").addEventListener("change", onToggleButtonChange);
    }

    onToggleTrimAll(e) {
        setButtonChecked(e.target, e.target.checked);
        toggleHidden(e.target.checked, this.querySelector("#trim-parameters"));
    }

    onToggleFilter(e) {
        const { checked } = e.target;
        setButtonChecked(e.target, checked);
        setButtonDisabled(this.querySelector("#skip-same-domain"), !checked);
        if (!checked) {
            setButtonChecked(this.querySelector("#skip-same-domain"), false);
        }
    }

    updateInputs() {
        super.updateInputs();
        setButtonChecked(this.querySelector("#filter-redirection"), !this.rule.skipRedirectionFilter);
        setButtonChecked(this.querySelector("#skip-same-domain"), this.rule.skipOnSameDomain);
        setButtonDisabled(this.querySelector("#skip-same-domain"), this.rule.skipRedirectionFilter);
        if (this.rule.paramsFilter && Array.isArray(this.rule.paramsFilter.values)) {
            this.paramsTagsInput.tags = this.rule.paramsFilter.values;
            if (this.rule.paramsFilter.invert) {
                setButtonChecked(this.querySelector("#invert-trim"), true);
            }
        }
        if (this.rule.trimAllParams) {
            setButtonChecked(this.querySelector("#trim-all-params"), true);
            toggleHidden(true, this.querySelector("#trim-parameters"));
        }
    }

    updateRule() {
        super.updateRule();
        this.rule.paramsFilter = {};
        this.rule.paramsFilter.values = this.paramsTagsInput.tags;
        if (this.rule.paramsFilter.values.length > 0) {
            if (this.querySelector("#invert-trim").checked) {
                this.rule.paramsFilter.invert = true;
            } else {
                delete this.rule.paramsFilter.invert;
            }
        } else {
            delete this.rule.paramsFilter;
        }
        if (this.querySelector("#filter-redirection").checked) {
            delete this.rule.skipRedirectionFilter;
        } else {
            this.rule.skipRedirectionFilter = true;
        }
        if (this.querySelector("#skip-same-domain").checked) {
            this.rule.skipOnSameDomain = true;
        } else {
            delete this.rule.skipOnSameDomain;
        }
        if (this.querySelector("#trim-all-params").checked) {
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
        this.querySelector("#form").appendChild(actions.content.cloneNode(true));

        this.querySelector("#redirect-document").addEventListener("change", onToggleButtonChange);
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
        this.querySelector("#redirect-url").value = this.rule.redirectUrl || "";
    }

    updateRule() {
        super.updateRule();
        this.rule.redirectUrl = this.querySelector("#redirect-url").value;
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
    input.id = `rule-${rule.uuid}`;
    input.dataset.uuid = rule.uuid;
    input.rule = rule;
    input.classList.add("not-edited");
    input.spellcheck = false;
    return input;
}

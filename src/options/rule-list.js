/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { newRuleInput } from "./rule-input.js";

class RuleList extends HTMLElement {
    constructor() {
        super();
        const template = document.getElementById("rule-list");
        this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));

        this.list = this.shadowRoot.getElementById("list");
        this.shadowRoot.getElementById("icon").src = this.getAttribute("icon");
        this.shadowRoot.getElementById("title").textContent = browser.i18n.getMessage(this.getAttribute("text"));
        this.shadowRoot.getElementById("collapse").addEventListener("click", () => this.collapse());
        this.shadowRoot.getElementById("select-all").addEventListener("change", (e) => this.onSelectAll(e));

        this.shadowRoot.addEventListener("rule-selected", () => this.updateHeader());
        this.shadowRoot.addEventListener("rule-deleted", (e) => this.onDelete(e));
        this.shadowRoot.addEventListener("rule-edit-completed", (e) => this.onEditComplete(e));
        this.shadowRoot.addEventListener("rule-action-changed", (e) => this.onActionChange(e));
        this.shadowRoot.addEventListener("rule-created", (e) => this.onCreate(e));
        this.shadowRoot.addEventListener("rule-changed", (e) => this.onchange(e));
        this.shadowRoot.addEventListener("rule-invalid", (e) => this.onInvalid(e));
    }

    get selected() {
        return Array.from(this.list.querySelectorAll(".selected"), (selected) => selected.rule);
    }

    get size() {
        return this.list.childElementCount;
    }

    get isEmpty() {
        return this.list.childElementCount === 0;
    }

    newRule() {
        const input = newRuleInput();
        this.list.append(input);
        this.updateHeader();
        this.toggle();
        input.setAttribute("new", "new");
        input.toggleEdit();
        input.scrollIntoView();
        input.focus();
    }

    add(rule) {
        const ruleInput = newRuleInput(rule);
        const title = ruleInput.title;

        if (this.size === 0 || this.list.lastElementChild.title.localeCompare(title) < 0) {
            this.list.append(ruleInput);
            return;
        }

        for (let next of this.list.childNodes) {
            if (next.title.localeCompare(title) >= 0) {
                next.before(ruleInput);
                break;
            }
        }
    }

    addCreated(rule) {
        this.add(rule);
        this.updateHeader();
        this.toggle();
    }

    addFrom(input) {
        this.add(input.rule);
        const newInput = this.shadowRoot.getElementById(input.rule.uuid);
        newInput.selected = input.selected;
        newInput.toggleSaved();
        this.updateHeader();
        this.toggle();
    }

    toggle() {
        this.classList.toggle("d-none", this.size === 0);
    }

    collapse() {
        this.shadowRoot.getElementById("collapse").classList.toggle("collapsed");
        this.list.classList.toggle("collapsed");
    }

    removeSelected() {
        this.list.querySelectorAll(".selected").forEach((ruleInput) => ruleInput.remove());
        this.updateHeader();
        this.toggle();
    }

    removeAll() {
        while (this.list.lastChild) {
            this.list.lastChild.remove();
        }
    }

    edit(uuid) {
        const rule = this.shadowRoot.getElementById(uuid);
        if (rule) {
            rule.toggleEdit();
            rule.scrollIntoView();
        }
    }

    mark(rules, className) {
        rules.forEach((rule) => {
            const input = this.shadowRoot.getElementById(rule.uuid);
            if (input) {
                input.classList.add(className);
            }
        });
    }

    updateHeader() {
        const checkbox = this.shadowRoot.getElementById("select-all");

        if (!this.list.querySelector(".selected")) {
            checkbox.checked = false;
            checkbox.indeterminate = false;
        } else if (!this.list.querySelector(":not(.selected)")) {
            checkbox.checked = true;
            checkbox.indeterminate = false;
        } else {
            checkbox.checked = false;
            checkbox.indeterminate = true;
        }
        this.updateSelectedText();
    }

    updateSelectedText() {
        const count = this.list.querySelectorAll(".selected").length;
        const selectedText = this.shadowRoot.getElementById("selected-text");
        selectedText.classList.toggle("d-none", count === 0);
        selectedText.textContent = browser.i18n.getMessage("selected_rules_count", [count, this.size]);
    }

    onSelectAll(e) {
        const checked = e.target.checked;
        this.list.childNodes.forEach((rule) => {
            rule.selected = checked;
        });
        this.updateSelectedText();
        this.dispatchEvent(
            new CustomEvent("rule-selected", {
                bubbles: true,
                composed: true,
            })
        );
    }

    onCreate(e) {
        e.target.remove();
        this.updateHeader();
        this.toggle();
    }

    onDelete(e) {
        e.target.remove();
        this.updateHeader();
        this.toggle();
    }

    onEditComplete(e) {
        const action = e.detail.action;
        if (action !== this.id) {
            e.target.remove();
            this.updateHeader();
            this.toggle();
        }
    }

    onchange(e) {
        if (this.id === "new") {
            e.stopPropagation();
        }
    }

    onActionChange(e) {
        const input = e.detail.input;
        const newInput = newRuleInput(input.rule);

        if (this.id === "new") {
            newInput.setAttribute("new", "new");
        }

        input.replaceWith(newInput);
        newInput.selected = input.selected;
        newInput.toggleEdit();
        newInput.notifyChangedIfValid();
    }

    onInvalid(e) {
        const input = e.detail.input;
        if (this.id !== "new") {
            input.reportValidity();
        }
    }
}

customElements.define("rule-list", RuleList);

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { newRuleInput } from "./rule-input.js";

customElements.define(
    "rule-list",
    class extends HTMLElement {
        constructor() {
            super();
            const template = document.getElementById("rule-list");
            this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));

            this.list = this.shadowRoot.querySelector(".list");
            this.shadowRoot.querySelector("#icon").src = this.getAttribute("icon");
            this.shadowRoot.querySelector("#title").textContent = browser.i18n.getMessage(this.getAttribute("text"));
            this.shadowRoot.querySelector(".collapse-button").addEventListener("click", () => this.collapse());
            this.shadowRoot.querySelector(".select-all").addEventListener("change", (e) => this.onSelectAll(e));

            this.shadowRoot.addEventListener("rule-selected", () => this.updateHeader());
            this.shadowRoot.addEventListener("rule-deleted", (e) => this.onDelete(e));
            this.shadowRoot.addEventListener("rule-edit-completed", (e) => this.onEditComplete(e));
            this.shadowRoot.addEventListener("rule-action-changed", (e) => this.onActionChange(e));
            this.shadowRoot.addEventListener("rule-created", (e) => this.onCreate(e));
            this.shadowRoot.addEventListener("rule-changed", (e) => this.onchange(e));
            this.shadowRoot.addEventListener("rule-invalid", (e) => this.onInvalid(e));
        }

        get selected() {
            return Array.from(this.list.querySelectorAll(".rule.selected"), (selected) => selected.input.rule);
        }

        get size() {
            return this.list.querySelectorAll(".rule").length;
        }

        newRule() {
            const input = newRuleInput();
            this.list.append(input.model);
            this.updateHeader();
            this.toggle();
            input.toggleEdit();
            input.$(".host").focus();
            input.model.scrollIntoView();
        }

        add(rule) {
            const ruleInput = newRuleInput(rule).model;
            const title = ruleInput.querySelector(".title").textContent;

            if (
                this.list.childElementCount === 0 ||
                this.list.querySelector(".rule:last-child .title").textContent.localeCompare(title) < 0
            ) {
                this.list.append(ruleInput);
                return;
            }

            for (let next of this.list.querySelectorAll(".rule")) {
                const nextTitle = next.querySelector(".title").textContent;
                if (nextTitle.localeCompare(title) >= 0) {
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
            const newInput = this.list.querySelector("#rule-" + input.rule.uuid).input;
            newInput.selected = input.selected;
            newInput.toggleSaved();
            this.updateHeader();
            this.toggle();
        }

        toggle() {
            this.classList.toggle("d-none", this.size === 0);
        }

        collapse() {
            this.shadowRoot.querySelector(".collapse-button").classList.toggle("collapsed");
            this.list.classList.toggle("collapsed");
        }

        removeSelected() {
            this.list.querySelectorAll(".rule.selected").forEach((ruleInput) => ruleInput.remove());
            this.updateHeader();
            this.toggle();
        }

        removeAll() {
            while (this.list.lastChild) {
                this.list.lastChild.remove();
            }
        }

        edit(uuid) {
            const rule = this.list.querySelector("#rule-" + uuid);
            if (rule) {
                rule.input.toggleEdit();
                rule.scrollIntoView();
            }
        }

        mark(rules, className) {
            rules.forEach((rule) => {
                const input = this.list.querySelector("#rule-" + rule.uuid);
                if (input) {
                    input.classList.add(className);
                }
            });
        }

        updateHeader() {
            const checkbox = this.shadowRoot.querySelector(".select-all");

            if (!this.list.querySelector(".select:checked")) {
                checkbox.checked = false;
                checkbox.indeterminate = false;
            } else if (!this.list.querySelector(".select:not(:checked)")) {
                checkbox.checked = true;
                checkbox.indeterminate = false;
            } else {
                checkbox.checked = false;
                checkbox.indeterminate = true;
            }
            this.updateSelectedText();
        }

        updateSelectedText() {
            const count = this.list.querySelectorAll(".select:checked").length;
            const total = this.list.querySelectorAll(".select").length;
            const selectedText = this.shadowRoot.querySelector(".selected-text");
            selectedText.classList.toggle("d-none", count === 0);
            selectedText.textContent = browser.i18n.getMessage("selected_rules_count", [count, total]);
        }

        onSelectAll(e) {
            const checked = e.target.checked;
            this.list.querySelectorAll(".rule").forEach((rule) => {
                rule.input.selected = checked;
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
            input.model.replaceWith(newInput.model);
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
);

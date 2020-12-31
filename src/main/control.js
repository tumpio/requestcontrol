/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { WhitelistRule, LoggedWhitelistRule } from "./rules/whitelist.js";
import { BlockRule } from "./rules/block.js";
import { RedirectRule, BaseRedirectRule } from "./rules/redirect.js";
import { FilterRule } from "./rules/filter.js";
import { ControlRule } from "./rules/base.js";
import { SecureRule } from "./rules/secure.js";

LoggedWhitelistRule.priority = 0;
WhitelistRule.priority = -1;
BlockRule.priority = -2;
SecureRule.priority = -3;
RedirectRule.priority = -4;
FilterRule.priority = -4;

Object.defineProperty(ControlRule.prototype, "priority", {
    get() {
        return this.constructor.priority;
    },
});

export class CompositeRule {
    constructor(ruleA, ruleB) {
        if (ruleA instanceof RedirectRule) {
            this.rules = [ruleA, ruleB];
        } else {
            this.rules = [ruleB, ruleA];
        }
        this.priority = ruleA.priority;
    }

    add(rule) {
        if (rule instanceof RedirectRule) {
            this.rules.unshift(rule);
        } else {
            this.rules.push(rule);
        }
    }

    resolve(request) {
        for (const rule of this.rules) {
            const resolve = rule.resolve(request);
            if (resolve !== null) {
                return resolve;
            }
        }
        return null;
    }
}

export class RequestController {
    constructor(notify, updateTab) {
        this.requests = new Map();
        ControlRule.notify = notify;
        BaseRedirectRule.updateTab = updateTab;
    }

    mark(request, rule) {
        const current = this.requests.get(request.requestId);

        if (typeof current === "undefined" || rule.priority > current.priority) {
            this.requests.set(request.requestId, rule);
            return true;
        }

        if (rule.priority === current.priority && rule instanceof BaseRedirectRule) {
            this.compose(current, rule, request);
            return true;
        }

        return false;
    }

    compose(current, rule, request) {
        if (current instanceof CompositeRule) {
            current.add(rule);
            return;
        }
        this.requests.set(request.requestId, new CompositeRule(current, rule));
    }

    resolve(request) {
        if (!this.requests.has(request.requestId)) {
            return null;
        }
        const rule = this.requests.get(request.requestId);
        this.requests.delete(request.requestId);
        return rule.resolve(request);
    }
}

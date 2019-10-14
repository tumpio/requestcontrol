/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { WhitelistRule } from "./rules/whitelist.js";
import { BlockRule } from "./rules/block.js";
import { RedirectRule, BaseRedirectRule } from "./rules/redirect.js";
import { FilterRule } from "./rules/filter.js";
import { ControlRule } from "./rules/base.js";
import { SecureRule } from "./rules/secure.js";

WhitelistRule.priority = 0;
BlockRule.priority = -1;
SecureRule.priority = -2;
RedirectRule.priority = -3;
FilterRule.priority = -4;

export class RequestController {
    constructor(notify, updateTab) {
        this.requests = new Map();
        ControlRule.notify = notify;
        BaseRedirectRule.updateTab = updateTab;
    }

    mark(request, rule) {
        if (!rule.match(request)) {
            return false;
        }
        let current = this.requests.get(request.requestId);
        if (typeof current !== "undefined" &&
            current.constructor.priority >= rule.constructor.priority
        ) {
            return false;
        }
        this.requests.set(request.requestId, rule);
        return true;
    }

    resolve(request) {
        if (!this.requests.has(request.requestId)) {
            return null;
        }
        let rule = this.requests.get(request.requestId);
        this.requests.delete(request.requestId);
        return rule.resolve(request);
    }
}

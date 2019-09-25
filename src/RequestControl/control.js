/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { WhitelistRule } from "./whitelist.js";
import { BlockRule } from "./block.js";
import { RedirectRule, BaseRedirectRule } from "./redirect.js";
import { FilterRule } from "./filter.js";
import { ControlRule } from "./base.js";

WhitelistRule.priority = 0;
BlockRule.priority = -1;
RedirectRule.priority = -2;
FilterRule.priority = -3;

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

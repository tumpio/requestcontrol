/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { WhitelistRule } from "./whitelist.js";
import { BlockRule } from "./block.js";
import { RedirectRule } from "./redirect.js";
import { FilterRule } from "./filter.js";

WhitelistRule.priority = 0;
BlockRule.priority = -1;
RedirectRule.priority = -2;
FilterRule.priority = -3;

export class RequestController {
    constructor() {
        this.markedRequests = new Map();
    }

    markRequest(details, rule) {
        if (!rule.match(details)) {
            return false;
        }
        let request = this.markedRequests.get(details.requestId);
        if (typeof request === "undefined") {
            this.markedRequests.set(details.requestId, details);
            request = details;
        }
        if (typeof request.rule === "undefined" ||
            rule.constructor.priority > request.rule.constructor.priority
        ) {
            request.rule = rule;
        }
        return true;
    }

    resolve(details, callback) {
        if (this.markedRequests.has(details.requestId)) {
            let request = this.markedRequests.get(details.requestId);
            this.markedRequests.delete(request.requestId);
            request.resolve = request.rule.constructor.resolve;
            return request.resolve(callback);
        }
        return null;
    }

    clear() {
        this.markedRequests.clear();
    }
}

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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
        if (typeof request.rulePriority === "undefined" || rule.priority > request.rulePriority) {
            request.rulePriority = rule.priority;
            request.rule = rule;
            request.resolve = rule.resolve;
            request.action = rule.action;
        } else if (rule.priority === request.rulePriority) {
            if (typeof request.rules === "undefined") {
                request.rules = [request.rule];
            }
            request.rules.push(rule);
            request.action |= rule.action;
        }
        return true;
    }

    resolve(details, callback) {
        if (this.markedRequests.has(details.requestId)) {
            let request = this.markedRequests.get(details.requestId);
            this.markedRequests.delete(request.requestId);
            return request.resolve(callback);
        }
        return null;
    }

    clear() {
        this.markedRequests.clear();
    }
}

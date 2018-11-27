/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {ControlRule, WHITELIST_ACTION} from "./base.js";

export class WhitelistRule extends ControlRule {
    static resolve() {
        return null;
    }
}

export class LoggedWhitelistRule extends WhitelistRule {
    static resolve(callback) {
        callback(this, WHITELIST_ACTION);
        return super.resolve();
    }
}
WhitelistRule.prototype.priority = 0;
WhitelistRule.prototype.action = WHITELIST_ACTION;
WhitelistRule.prototype.resolve = WhitelistRule.resolve;

LoggedWhitelistRule.prototype.resolve = LoggedWhitelistRule.resolve;

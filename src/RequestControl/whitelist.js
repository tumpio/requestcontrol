/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ControlRule } from "./base.js";

export class WhitelistRule extends ControlRule {
    static resolve() {
        return null;
    }
}

export class LoggedWhitelistRule extends WhitelistRule {
    static resolve(callback) {
        callback(this);
        return super.resolve();
    }
}

WhitelistRule.icon = "/icons/icon-whitelist.svg";

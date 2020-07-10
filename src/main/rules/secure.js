/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ControlRule } from "./base.js";

export const SECURE_RESPONSE = { upgradeToSecure: true };

export class SecureRule extends ControlRule {
    resolve(request) {
        this.constructor.notify(this, request);
        return SECURE_RESPONSE;
    }
}

SecureRule.icon = "/icons/icon-secure.svg";
SecureRule.action = "secure";

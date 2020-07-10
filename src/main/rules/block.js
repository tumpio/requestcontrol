/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ControlRule } from "./base.js";

export const BLOCKING_RESPONSE = { cancel: true };

export class BlockRule extends ControlRule {
    resolve(request) {
        this.constructor.notify(this, request);
        return BLOCKING_RESPONSE;
    }
}

BlockRule.icon = "/icons/icon-block.svg";
BlockRule.action = "block";

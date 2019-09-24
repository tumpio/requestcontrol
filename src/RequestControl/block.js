/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ControlRule } from "./base.js";

export class BlockRule extends ControlRule {
    static resolve(callback) {
        callback(this);
        return { cancel: true };
    }
}

BlockRule.icon = "/icons/icon-block.svg";

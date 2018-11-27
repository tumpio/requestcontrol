/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {BLOCK_ACTION, ControlRule} from "./base.js";

export class BlockRule extends ControlRule {
    static resolve(callback) {
        callback(this, BLOCK_ACTION);
        return {cancel: true};
    }
}

BlockRule.prototype.priority = -1;
BlockRule.prototype.action = BLOCK_ACTION;
BlockRule.prototype.resolve = BlockRule.resolve;

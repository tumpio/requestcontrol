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

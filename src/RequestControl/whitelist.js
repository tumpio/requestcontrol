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

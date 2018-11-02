export class ControlRule {
    constructor(uuid, matcher) {
        this.uuid = uuid;
        this.matcher = matcher;
    }

    match(request) {
        return this.matcher.test(request);
    }
}

export class BaseMatchExtender {
    static test() {
        return true;
    }
}

export class InvalidUrlException {
    constructor(target) {
        this.target = target;
        this.name = "error_invalid_url";
    }
}

export const NO_ACTION = 0;
export const WHITELIST_ACTION = 1 << 1;
export const BLOCK_ACTION = 1 << 2;
export const REDIRECT_ACTION = 1 << 3;
export const FILTER_ACTION = 1 << 4;
export const DISABLED_STATE = 1 << 5;

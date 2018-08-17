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

export const REQUEST_CONTROL_ICONS = {};
REQUEST_CONTROL_ICONS[WHITELIST_ACTION] = {
    19: "/icons/icon-whitelist@19.png",
    38: "/icons/icon-whitelist@38.png"
};
REQUEST_CONTROL_ICONS[BLOCK_ACTION] = {
    19: "/icons/icon-block@19.png",
    38: "/icons/icon-block@38.png"
};
REQUEST_CONTROL_ICONS[FILTER_ACTION] = {
    19: "/icons/icon-filter@19.png",
    38: "/icons/icon-filter@38.png"
};
REQUEST_CONTROL_ICONS[REDIRECT_ACTION] = {
    19: "/icons/icon-redirect@19.png",
    38: "/icons/icon-redirect@38.png"
};
REQUEST_CONTROL_ICONS[NO_ACTION] = {
    19: "/icons/icon-blank@19.png",
    38: "/icons/icon-blank@38.png"
};
REQUEST_CONTROL_ICONS[DISABLED_STATE] = {
    19: "/icons/icon-disabled@19.png",
    38: "/icons/icon-disabled@38.png"
};
REQUEST_CONTROL_ICONS[FILTER_ACTION | REDIRECT_ACTION] = REQUEST_CONTROL_ICONS[FILTER_ACTION];

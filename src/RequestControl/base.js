/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export class ControlRule {
    constructor({ uuid }, matcher) {
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

export const NO_ACTION = 0;
export const WHITELIST_ACTION = 1 << 1;
export const BLOCK_ACTION = 1 << 2;
export const REDIRECT_ACTION = 1 << 3;
export const FILTER_ACTION = 1 << 4;
export const DISABLED_STATE = 1 << 5;

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

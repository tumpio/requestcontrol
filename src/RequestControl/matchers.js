/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {BaseMatchExtender} from "./base.js";
import {libTld} from "./url.js";
import {createRegexpPattern} from "./api.js";

export class RequestMatcher {
    constructor(matchers) {
        this.extensions = matchers;
    }

    test(request) {
        for (let extension of this.extensions) {
            if (!extension.test(request)) {
                return false;
            }
        }
        return true;
    }
}

export class IncludeMatcher {
    constructor(values) {
        this.pattern = createRegexpPattern(values, true, true);
    }

    test(request) {
        return this.pattern.test(request.url);
    }
}

export class ExcludeMatcher extends IncludeMatcher {
    constructor(values) {
        super(values);
    }

    test(request) {
        return !super.test(request);
    }
}

export class DomainMatcher {
    static test(request) {
        return DomainMatcher.testUrls(request.originUrl, request.url);
    }

    static testUrls(originUrl, targetUrl) {
        if (typeof originUrl === "undefined") {
            // top-level document
            return true;
        }
        let origin = libTld.getDomain(originUrl);
        let outgoing = libTld.getDomain(targetUrl);
        if (outgoing === null) {
            // expect request to be from same domain
            return true;
        }
        return origin === outgoing;
    }
}

export class ThirdPartyMatcher {
    static test(request) {
        return !DomainMatcher.test(request);
    }
}

export function createRequestMatcher(rule) {
    let matchers = [];
    if (rule.pattern) {
        if (rule.pattern.includes) {
            for (let value of rule.pattern.includes) {
                matchers.push(new IncludeMatcher([value]));
            }
        }

        if (rule.pattern.excludes) {
            matchers.push(new ExcludeMatcher(rule.pattern.excludes));
        }
    }
    return matchers.length > 0 ?
        new RequestMatcher(matchers) : BaseMatchExtender;
}

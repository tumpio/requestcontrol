/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { libTld, UrlParser } from "./url.js";
import { createRegexpPattern } from "./api.js";

export class BaseMatchExtender {
    static test() {
        return true;
    }
}

export class RequestMatcher {
    constructor(matchers) {
        this.extensions = matchers;
    }

    test(request) {
        for (const extension of this.extensions) {
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
        const origin = libTld.getDomain(originUrl);
        const outgoing = libTld.getDomain(targetUrl);
        if (outgoing === null) {
            // expect request to be from same domain
            return true;
        }
        return origin === outgoing;
    }
}

export class OriginMatcher {
    static test(request) {
        return OriginMatcher.testUrls(request.originUrl, request.url);
    }

    static testUrls(originUrl, targetUrl) {
        if (typeof originUrl === "undefined") {
            // top-level document
            return true;
        }
        const { origin } = new UrlParser(originUrl);
        const outgoing = new UrlParser(targetUrl).origin;
        return origin === outgoing;
    }
}

export class ThirdPartyDomainMatcher {
    static test(request) {
        return !DomainMatcher.test(request);
    }
}

export class ThirdPartyOriginMatcher {
    static test(request) {
        return !OriginMatcher.test(request);
    }
}

export function createRequestMatcher(rule) {
    const matchers = [];
    if (rule.pattern) {
        if (rule.pattern.includes) {
            for (const value of rule.pattern.includes) {
                matchers.push(new IncludeMatcher([value]));
            }
        }

        if (rule.pattern.excludes) {
            matchers.push(new ExcludeMatcher(rule.pattern.excludes));
        }

        if (rule.pattern.origin === "same-domain") {
            matchers.push(DomainMatcher);
        } else if (rule.pattern.origin === "same-origin") {
            matchers.push(OriginMatcher);
        } else if (rule.pattern.origin === "third-party-domain") {
            matchers.push(ThirdPartyDomainMatcher);
        } else if (rule.pattern.origin === "third-party-origin") {
            matchers.push(ThirdPartyOriginMatcher);
        }
    }
    return matchers.length > 0 ? new RequestMatcher(matchers) : BaseMatchExtender;
}

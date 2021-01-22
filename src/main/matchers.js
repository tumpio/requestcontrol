/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createRegexpPattern } from "../util/regexp.js";
import { libTld, UrlParser } from "./url.js";

export class BaseMatcher {
    static test() {
        return true;
    }
}

export class RequestMatcher {
    constructor(matchers) {
        this.matchers = matchers;
    }

    test(request) {
        return this.matchers.every((matcher) => matcher.test(request));
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
        return typeof request.thirdParty === "boolean"
            ? !request.thirdParty
            : DomainMatcher.testUrls(request.originUrl, request.url);
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

export class HostnameWithoutSuffixMatcher {
    constructor(hostname) {
        const parts = hostname.split(".");

        if (parts.length < 2 || parts.pop() !== "*") {
            throw "Incorrect TLD wildcard hostname pattern!";
        }

        this.domainWithoutSuffix = parts.pop();
        this.matchAnySubdomain = parts.length > 0 && parts[0] === "*";

        if (this.matchAnySubdomain) {
            parts.shift();
        }

        this.subdomainparts = parts.join(".");
    }

    test(request) {
        const { domainWithoutSuffix, subdomain } = libTld.parse(request.url);
        return this.domainWithoutSuffix === domainWithoutSuffix && this.testSubdomain(subdomain);
    }

    testSubdomain(subdomain) {
        if (this.subdomainparts === subdomain) {
            return true;
        }
        if (!this.matchAnySubdomain) {
            return false;
        }
        if (this.subdomainparts === "") {
            return true;
        }
        if (subdomain.length < this.subdomainparts.length + 1) {
            return false;
        }
        const leadingDotIndex = subdomain.length - this.subdomainparts.length - 1;
        return subdomain.endsWith(this.subdomainparts) && subdomain[leadingDotIndex] === ".";
    }
}

export class HostnamesWithoutSuffixMatcher {
    constructor(hostnames) {
        this.matchers = hostnames.includes("*.*")
            ? [BaseMatcher]
            : hostnames.map((hostname) => new HostnameWithoutSuffixMatcher(hostname));
    }

    test(request) {
        return this.matchers.some((matcher) => matcher.test(request));
    }
}

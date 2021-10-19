/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
    BaseMatcher,
    DomainMatcher,
    ExcludeMatcher,
    HostnamesWithoutSuffixMatcher,
    IncludeMatcher,
    MethodMatcher,
    OriginMatcher,
    RequestMatcher,
    ThirdPartyDomainMatcher,
    ThirdPartyOriginMatcher,
} from "./matchers.js";
import { BlockRule } from "./rules/block.js";
import { FilterRule } from "./rules/filter.js";
import { RedirectRule } from "./rules/redirect.js";
import { SecureRule } from "./rules/secure.js";
import { LoggedWhitelistRule, WhitelistRule } from "./rules/whitelist.js";

export const ALL_URLS = "<all_urls>";

export function createRequestFilters(data) {
    if (!data || !data.pattern) {
        return [];
    }

    if (!data.pattern.allUrls && data.pattern.anyTLD) {
        return createAnyTldRequestFilters(data);
    }

    return [
        {
            rule: createRule(data),
            urls: createMatchPatterns(data.pattern),
            matcher: createRequestMatcher(data.pattern),
            types: data.types,
            incognito: data.pattern.incognito,
        },
    ];
}

export function createRequestMatcher(pattern, hostnamesWithoutSuffix = []) {
    const matchers = [];

    if (pattern.includes) {
        for (const value of pattern.includes) {
            matchers.push(new IncludeMatcher([value]));
        }
    }

    if (pattern.excludes) {
        matchers.push(new ExcludeMatcher(pattern.excludes));
    }

    switch (pattern.origin) {
        case "same-domain": {
            matchers.push(DomainMatcher);
            break;
        }
        case "same-origin": {
            matchers.push(OriginMatcher);
            break;
        }
        case "third-party-domain": {
            matchers.push(ThirdPartyDomainMatcher);
            break;
        }
        case "third-party-origin": {
            matchers.push(ThirdPartyOriginMatcher);
            break;
        }
    }

    if (pattern.method && pattern.method.length > 0) {
        matchers.push(new MethodMatcher(pattern.method));
    }

    if (hostnamesWithoutSuffix.length > 0) {
        matchers.push(new HostnamesWithoutSuffixMatcher(hostnamesWithoutSuffix));
    }

    return matchers.length > 0 ? new RequestMatcher(matchers) : BaseMatcher;
}

export function createRule(data) {
    switch (data.action) {
        case "whitelist":
            if (data.log) {
                return new LoggedWhitelistRule(data);
            }
            return new WhitelistRule(data);
        case "block":
            return new BlockRule(data);
        case "redirect":
            return new RedirectRule(data);
        case "filter":
            return new FilterRule(data);
        case "secure":
            return new SecureRule(data);
        default:
            throw new Error("Unsupported rule action");
    }
}

/**
 * Construct array of match patterns
 * @param pattern pattern of request control rule
 * @returns {*} array of match patterns
 */
export function createMatchPatterns(pattern) {
    const urls = [];
    const hosts = Array.isArray(pattern.host) ? pattern.host : [pattern.host];
    let paths = Array.isArray(pattern.path) ? pattern.path : [pattern.path];

    if (pattern.allUrls) {
        return [ALL_URLS];
    }

    if (!pattern.path || paths.length <= 0) {
        paths = [""];
    }

    for (let host of hosts) {
        if (isTLDHostPattern(host)) {
            host = host.slice(0, -1);
            for (const TLD of pattern.topLevelDomains) {
                for (const path of paths) {
                    urls.push(`${pattern.scheme}://${host}${TLD}${prefixPath(path)}`);
                }
            }
        } else {
            for (const path of paths) {
                urls.push(`${pattern.scheme}://${host}${prefixPath(path)}`);
            }
        }
    }

    return urls;
}

function createAnyTldRequestFilters(data) {
    const filters = [];
    const rule = createRule(data);
    const hosts = Array.isArray(data.pattern.host) ? data.pattern.host : [data.pattern.host];

    const withoutSuffix = [];
    const withSuffix = [];

    hosts.forEach((host) => (isTLDHostPattern(host) ? withoutSuffix : withSuffix).push(host));

    if (withoutSuffix.length > 0) {
        filters.push({
            rule,
            urls: createMatchPatterns({
                scheme: data.pattern.scheme,
                host: "*",
                path: data.pattern.path,
            }),
            matcher: createRequestMatcher(data.pattern, withoutSuffix),
            types: data.types,
            incognito: data.pattern.incognito,
        });
    }

    if (withSuffix.length > 0) {
        filters.push({
            rule,
            urls: createMatchPatterns({
                scheme: data.pattern.scheme,
                host: withSuffix,
                path: data.pattern.path,
            }),
            matcher: createRequestMatcher(data.pattern),
            types: data.types,
            incognito: data.pattern.incognito,
        });
    }

    return filters;
}

export function isTLDHostPattern(host) {
    const hostTLDWildcardPattern = /^(.+)\.\*$/;
    return hostTLDWildcardPattern.test(host);
}

function prefixPath(path) {
    return path.startsWith("/") ? path : `/${path}`;
}

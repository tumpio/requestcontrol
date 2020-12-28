/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createMatchPatterns, createRule } from "../main/api.js";
import { RequestController, CompositeRule } from "../main/control.js";
import { LoggedWhitelistRule, WhitelistRule } from "../main/rules/whitelist.js";
import { BlockRule } from "../main/rules/block.js";
import { RedirectRule } from "../main/rules/redirect.js";
import { FilterRule } from "../main/rules/filter.js";
import { SecureRule } from "../main/rules/secure.js";

export function testRules(testUrl, rulePatterns) {
    try {
        new URL(testUrl);
    } catch {
        return browser.i18n.getMessage("invalid_test_url");
    }
    const controller = new RequestController();
    const request = { requestId: 0, url: testUrl };

    try {
        for (const rulePattern of rulePatterns) {
            const rule = createRule(rulePattern);
            const matchPatterns = createMatchPatterns(rulePattern.pattern);
            for (const matchPattern of matchPatterns) {
                if (matchPatternToRegExp(matchPattern).test(request.url)) {
                    controller.mark(request, rule);
                    break;
                }
            }
        }
    } catch {
        return browser.i18n.getMessage("error_invalid_rule");
    }
    const rule = controller.requests.get(request.requestId);

    if (!rule) {
        return browser.i18n.getMessage("no_match");
    }
    return testRule(rule, testUrl);
}

function testRule(rule, testUrl) {
    let redirectUrl;
    switch (rule.constructor) {
        case WhitelistRule:
        case LoggedWhitelistRule:
            return browser.i18n.getMessage("whitelisted");
        case BlockRule:
            return browser.i18n.getMessage("blocked");
        case RedirectRule:
        case FilterRule:
            redirectUrl = rule.apply(testUrl);
            try {
                new URL(redirectUrl);
            } catch {
                return browser.i18n.getMessage("invalid_target_url") + redirectUrl;
            }
            if (redirectUrl === testUrl) {
                return browser.i18n.getMessage("matched_no_change");
            }
            return redirectUrl;
        case CompositeRule:
            redirectUrl = rule.rules.reduce((url, r) => {
                const change = r.apply(url);
                if (change !== null) {
                    return change;
                }
                return url;
            }, testUrl);
            try {
                new URL(redirectUrl);
            } catch {
                return browser.i18n.getMessage("invalid_target_url") + redirectUrl;
            }
            if (redirectUrl === testUrl) {
                return browser.i18n.getMessage("matched_no_change");
            }
            return redirectUrl;
        case SecureRule:
            return browser.i18n.getMessage("upgraded_to_secure");
        default:
            break;
    }
}

/**
 * Transforms a valid match pattern into a regular expression
 * which matches all URLs included by that pattern.
 * Source: MDN
 * @param  {string}  pattern  The pattern to transform.
 * @return {RegExp}           The pattern's equivalent as a RegExp.
 * @throws {TypeError}        If the pattern is not a valid MatchPattern
 */
function matchPatternToRegExp(pattern) {
    if (pattern === "" || pattern === "<all_urls>") {
        return /^(?:http|https):\/\//;
    }

    const schemeSegment = "(\\*|http|https)";
    const hostSegment = "(\\*|(?:\\*\\.)?(?:[^/*]+))?";
    const pathSegment = "(.*)";
    const matchPatternRegExp = new RegExp(`^${schemeSegment}://${hostSegment}/${pathSegment}$`);
    const regexpChars = /[.+^$?{}()|[\]\\]/g; // excluding "*"

    const match = matchPatternRegExp.exec(pattern);
    if (!match) {
        throw new TypeError(`"${pattern}" is not a valid MatchPattern`);
    }

    const [, scheme, , path] = match;
    let host = match[2];
    if (!host) {
        throw new TypeError(`"${pattern}" does not have a valid host`);
    }

    let regex = "^";

    if (scheme === "*") {
        regex += "(http|https)";
    } else {
        regex += scheme;
    }

    regex += "://";

    if (host && host === "*") {
        regex += "[^/]+?";
    } else if (host) {
        if (host.match(/^\*\./)) {
            regex += "[^/]*?";
            host = host.substring(2);
        }
        regex += host.replace(regexpChars, "\\$&");
    }

    if (path) {
        if (path === "*") {
            regex += "(/.*)?";
        } else if (path.charAt(0) !== "/") {
            regex += "/";
            regex += path.replace(regexpChars, "\\$&").replace(/\*/g, ".*?");
            regex += "/?";
        }
    }

    regex += "$";
    return new RegExp(regex);
}

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createMatchPatterns, createRule } from "../main/api.js";
import { RequestController } from "../main/control.js";
import { LoggedWhitelistRule, WhitelistRule } from "../main/rules/whitelist.js";
import { BlockRule } from "../main/rules/block.js";
import { RedirectRule } from "../main/rules/redirect.js";
import { FilterRule } from "../main/rules/filter.js";

export function testRules(testUrl, rulePatterns) {
    try {
        new URL(testUrl);
    } catch (e) {
        return browser.i18n.getMessage("invalid_test_url");
    }
    let controller = new RequestController();
    let request = { requestId: 0, url: testUrl };

    try {
        for (let rulePattern of rulePatterns) {
            let rule = createRule(rulePattern);
            let matchPatterns = createMatchPatterns(rulePattern.pattern);
            for (let matchPattern of matchPatterns) {
                if (matchPatternToRegExp(matchPattern).test(request.url)) {
                    controller.mark(request, rule);
                    break;
                }
            }
        }
    } catch (e) {
        return browser.i18n.getMessage("error_invalid_rule");
    }
    let rule = controller.requests.get(request.requestId);

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
                if (redirectUrl !== testUrl) {
                    return redirectUrl;
                } else {
                    return browser.i18n.getMessage("matched_no_change");
                }
            } catch (e) {
                return browser.i18n.getMessage("invalid_target_url") + redirectUrl;
            }
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
        return (/^(?:http|https):\/\//);
    }

    const schemeSegment = "(\\*|http|https)";
    const hostSegment = "(\\*|(?:\\*\\.)?(?:[^/*]+))?";
    const pathSegment = "(.*)";
    const matchPatternRegExp = new RegExp(
        `^${schemeSegment}://${hostSegment}/${pathSegment}$`
    );

    let match = matchPatternRegExp.exec(pattern);
    if (!match) {
        throw new TypeError(`"${pattern}" is not a valid MatchPattern`);
    }

    let [, scheme, host, path] = match;
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
        regex += host.replace(/\./g, "\\.");
    }

    if (path) {
        if (path === "*") {
            regex += "(/.*)?";
        } else if (path.charAt(0) !== "/") {
            regex += "/";
            regex += path.replace(/\./g, "\\.").replace(/\?/g, "\\?").replace(/\*/g, ".*?");
            regex += "/?";
        }
    }

    regex += "$";
    return new RegExp(regex);
}
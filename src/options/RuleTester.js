/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { createMatchPatterns, createRule } from "/src/RequestControl/api.js";
import { RequestController } from "/src/RequestControl/control.js";

export function testRules(url, rulePatterns) {
    let testURL = new URL(url);
    let request = { url: testURL.href };
    let controller = new RequestController();
    for (let rulePattern of rulePatterns) {
        let rule = createRule(rulePattern);
        let matchPatterns = createMatchPatterns(rulePattern.pattern);
        for (let matchPattern of matchPatterns) {
            if (matchPatternToRegExp(matchPattern).test(url)) {
                controller.markRequest(request, rule);
                break;
            }
        }
    }
    return request;
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
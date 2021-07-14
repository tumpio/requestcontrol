/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Construct regexp from list of globs (pattern with wildcards) and regexp pattern strings
 * @param values list of globs or regexp pattern strings
 * @param insensitive if true, set case insensitive flag
 * @param containing if false, add string begin and end .
 * @returns {RegExp}
 */
export function createRegexpPattern(values, insensitive = true, containing = false) {
    const regexpChars = /[$()+.[\\\]^{|}]/g; // excluding "*" and "?" wildcard chars
    const regexpParam = /^\/(.*)\/$/;
    const flags = insensitive ? "i" : "";

    let pattern = "";
    for (const param of values) {
        const testRegexp = param.match(regexpParam);
        pattern += "|";
        pattern += containing ? "" : "^";
        if (testRegexp && isValidRegExp(testRegexp[1])) {
            pattern += testRegexp[1];
        } else {
            pattern += param.replace(regexpChars, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
        }
        pattern += containing ? "" : "$";
    }
    return new RegExp(pattern.substring(1), flags);
}

/**
 * Transforms a valid match pattern into a regular expression
 * which matches all URLs included by that pattern.
 * Source: MDN
 * @param  {string}  pattern  The pattern to transform.
 * @return {RegExp}           The pattern's equivalent as a RegExp.
 * @throws {TypeError}        If the pattern is not a valid MatchPattern
 */
export function matchPatternToRegExp(pattern) {
    if (pattern === "" || pattern === "<all_urls>") {
        return /^(?:http|https):\/\//;
    }

    const schemeSegment = "(\\*|http|https)";
    const hostSegment = "(\\*|(?:\\*\\.)?(?:[^/*]+))?";
    const pathSegment = "(.*)";
    const matchPatternRegExp = new RegExp(`^${schemeSegment}://${hostSegment}/${pathSegment}$`);
    const regexpChars = /[$()+.?[\\\]^{|}]/g; // excluding "*"

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
        if (/^\*\./.test(host)) {
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

function isValidRegExp(pattern) {
    try {
        new RegExp(pattern);
    } catch {
        return false;
    }
    return true;
}

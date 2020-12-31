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

function isValidRegExp(pattern) {
    try {
        new RegExp(pattern);
    } catch {
        return false;
    }
    return true;
}

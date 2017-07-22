/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const RequestControl = {};

/**
 * Construct array of urls from given rule pattern
 * @param pattern pattern of request control rule
 * @returns {*} array of urls
 */
RequestControl.resolveUrls = function (pattern) {
    let urls = [];
    let hosts = Array.isArray(pattern.host) ? pattern.host : [pattern.host];
    let paths = Array.isArray(pattern.path) ? pattern.path : [pattern.path];

    if (pattern.allUrls) {
        return ["<all_urls>"];
    }

    if (paths.length <= 0) {
        paths = [""];
    }

    let hostTLDWildcardPattern = /^(.+)\.\*$/;

    for (let host of hosts) {
        for (let path of paths) {
            if (hostTLDWildcardPattern.test(host)) {
                host = host.slice(0, -1);
                for (let TLD of pattern.topLevelDomains) {
                    urls.push(pattern.scheme + "://" + host + TLD + "/" + path);
                }
            } else {
                urls.push(pattern.scheme + "://" + host + "/" + path);
            }
        }
    }

    return urls;
};

/**
 * Construct regexp pattern of filter params
 * @param values
 * @returns {string}
 */
RequestControl.createTrimPattern = function (values) {
    let regexpChars = /[.+?^${}()|[\]\\]/g; // excluding * wildcard
    let regexpParam = /^\/(.*)\/$/;

    let pattern = "";
    for (let param of values) {
        let testRegexp = param.match(regexpParam);
        if (testRegexp) {
            pattern += "|" + testRegexp[1];
        } else {
            pattern += "|" + param.replace(regexpChars, "\\$&").replace(/\*/g, ".*");
        }
    }
    return pattern.substring(1);
};

/**
 * Options schema
 * @type {{rules: [*]}}
 */
RequestControl.optionsSchema = {
    rules: []
};

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const RequestControl = {};
const URL_PARAMETER_NAMES = ["hash", "host", "hostname", "href", "origin", "password", "pathname",
    "port", "protocol", "search", "username"];
const NO_ACTION = 0;
const WHITELIST_ACTION = 1 << 1;
const BLOCK_ACTION = 1 << 2;
const REDIRECT_ACTION = 1 << 3;
const FILTER_ACTION = 1 << 4;
const DISABLED_STATE = 1 << 5;
const REQUEST_CONTROL_ICONS = {};

REQUEST_CONTROL_ICONS[WHITELIST_ACTION] = {
    19: "/icons/icon-whitelist@19.png",
    38: "/icons/icon-whitelist@38.png"
};
REQUEST_CONTROL_ICONS[BLOCK_ACTION] = {
    19: "/icons/icon-block@19.png",
    38: "/icons/icon-block@38.png"
};
REQUEST_CONTROL_ICONS[FILTER_ACTION] = {
    19: "/icons/icon-filter@19.png",
    38: "/icons/icon-filter@38.png"
};
REQUEST_CONTROL_ICONS[REDIRECT_ACTION] = {
    19: "/icons/icon-redirect@19.png",
    38: "/icons/icon-redirect@38.png"
};
REQUEST_CONTROL_ICONS[NO_ACTION] = {
    19: "/icons/icon-blank@19.png",
    38: "/icons/icon-blank@38.png"
};
REQUEST_CONTROL_ICONS[DISABLED_STATE] = {
    19: "/icons/icon-disabled@19.png",
    38: "/icons/icon-disabled@38.png"
};
REQUEST_CONTROL_ICONS[FILTER_ACTION | REDIRECT_ACTION] = REQUEST_CONTROL_ICONS[FILTER_ACTION];

class InvalidUrlException {
    constructor(target) {
        this.target = target;
        this.name = "error_invalid_url";
    }
}

class ControlRule {
    constructor(id) {
        this.id = id;
    }
}

class WhitelistRule extends ControlRule {
    constructor(id) {
        super(id);
    }

    static resolve(callback) {
        callback(this, WHITELIST_ACTION);
        return null;
    }
}

class BlockRule extends ControlRule {
    constructor(id) {
        super(id);
    }

    static resolve(callback) {
        callback(this, BLOCK_ACTION);
        return {cancel: true};
    }
}

class FilterRule extends ControlRule {
    constructor(id, paramsFilter, removeQueryString, skipInlineUrlFilter) {
        super(id);
        this.queryParamsPattern = (paramsFilter) ? RequestControl.createTrimPattern(paramsFilter.values) : "";
        this.invertQueryFilter = (paramsFilter) ? paramsFilter.invert : false;
        this.removeQueryString = removeQueryString;
        this.skipInlineUrlFilter = skipInlineUrlFilter;
    }

    apply(requestURL) {
        if (!this.skipInlineUrlFilter) {
            let redirectionUrl = RequestControl.parseInlineUrl(requestURL.href);
            if (redirectionUrl) {
                requestURL.href = redirectionUrl;
            }
        }
        if (this.removeQueryString) {
            requestURL.search = "";
        } else if (this.queryParamsPattern.length > 0 && requestURL.search.length > 0) {
            requestURL.search = RequestControl.trimQueryParameters(requestURL.search, this.queryParamsPattern,
                this.invertQueryFilter);
        }
        return requestURL;
    }
}

class RedirectRule extends ControlRule {
    constructor(id, redirectUrl) {
        super(id);
        let [parsedUrl, instructions] = RequestControl.parseRedirectInstructions(redirectUrl);
        let patterns = RequestControl.parseRedirectParameters(parsedUrl);
        this.instructions = instructions;
        this.patterns = patterns;
    }

    apply(requestURL) {
        if (this.patterns.length > 0) {
            let redirectUrl = "";
            for (let pattern of this.patterns) {
                redirectUrl += pattern.resolve(requestURL);
            }
            try {
                requestURL.href = redirectUrl;
            } catch (e) {
                throw new InvalidUrlException(redirectUrl);
            }
        }
        for (let instruction of this.instructions) {
            instruction.apply(requestURL);
        }
        return requestURL;
    }
}

class RedirectInstruction {
    constructor(name, patterns) {
        this.patterns = patterns;
        this.name = name;
    }

    apply(requestURL) {
        let value = "";
        for (let pattern of this.patterns) {
            value += pattern.resolve(requestURL);
        }
        requestURL[this.name] = value;
    }
}

class BaseRedirectPattern {
    constructor(value) {
        this.value = value;
    }

    resolve() {
        return this.value;
    }
}

class ParameterExpansion extends BaseRedirectPattern {
    constructor(value) {
        super(value);
    }

    resolve(requestURL) {
        return requestURL[this.value];
    }
}

class ParameterManipulation extends BaseRedirectPattern {
    constructor(parameter, manipulationRules) {
        super(parameter);
        this.manipulations = RequestControl.parseStringManipulations(manipulationRules);
    }

    resolve(requestURL) {
        let value = this.value.resolve(requestURL);
        for (let manipulation of this.manipulations) {
            value = manipulation.apply(value);
        }
        return value;
    }
}

class ReplaceStringManipulation {
    constructor(pattern, replacement) {
        this.pattern = new RegExp(pattern);
        this.replacement = replacement;
    }

    apply(str) {
        return str.replace(this.pattern, this.replacement);
    }
}

class ExtractStringManipulation {
    constructor(offset, length) {
        this.offset = offset;
        this.length = length;
    }

    apply(str) {
        return ExtractStringManipulation.extractSubstring(str, this.offset, this.length);
    }

    /**
     * Extract a substring.
     * @param str value
     * @param offset the begin of sub string extraction.
     *  Negative offset is counted from end of string.
     * @param length the length of extracted substring.
     *  Negative length reduces the length of extracted substring starting from end.
     * @returns {string}
     */
    static extractSubstring(str, offset, length) {
        let substr;
        let i = (offset === ":" ? 0 : parseInt(offset.substring(1)));
        if (i < 0) {
            substr = str.slice(i);
        } else {
            substr = str.substring(i);
        }
        if (length) {
            let l = (length === ":" ? 0 : parseInt(length.substring(1)));
            if (l < 0) {
                substr = substr.substring(0, substr.length + l);
            } else {
                substr = substr.substring(0, l);
            }
        }
        return substr;
    }
}

RequestControl.markRule = function (request, rule) {
    if (typeof request.rulePriority === "undefined"
        || rule.priority > request.rulePriority) {
        request.rulePriority = rule.priority;
        request.rules = [rule];
        request.resolve = rule.resolve;
        request.action = rule.action;
    } else if (rule.priority === request.rulePriority) {
        request.rules.push(rule);
        request.action |= rule.action;
    }
};

RequestControl.processRedirectRules = function (callback, errorCallback) {
    let requestURL = new URL(this.url);
    let skipInlineUrlFilter = false;
    let appliedRules = [];
    let action = this.action & (FILTER_ACTION | REDIRECT_ACTION);

    for (let rule of this.rules) {
        if (rule.skipInlineUrlFilter) {
            skipInlineUrlFilter = true;
        }
        try {
            requestURL = rule.apply(requestURL);
            if (requestURL.href !== this.url) {
                appliedRules.push(rule);
            }
        } catch (e) {
            errorCallback(this, rule, e);
        }
    }

    if (appliedRules.length > 0) {
        this.redirectUrl = requestURL.href;

        if (this.action & FILTER_ACTION && this.type === "sub_frame"
            && !skipInlineUrlFilter) {
            callback(this, action, true);
            return {cancel: true};
        } else {
            callback(this, action);
            return {redirectUrl: this.redirectUrl};
        }
    }
    return null;
};

RequestControl.createRule = function (index, rule) {
    switch (rule.action) {
        case "whitelist":
            return new WhitelistRule(index);
        case "block":
            return new BlockRule(index);
        case "redirect":
            return new RedirectRule(index, rule.redirectUrl);
        case "filter":
            return new FilterRule(index, rule.paramsFilter, rule.trimAllParams, rule.skipRedirectionFilter);
        default:
            throw new Error("Unsupported rule action");
    }
};

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

    if (!pattern.path || paths.length <= 0) {
        paths = [""];
    }

    let hostTLDWildcardPattern = /^(.+)\.\*$/;

    for (let host of hosts) {
        if (hostTLDWildcardPattern.test(host)) {
            host = host.slice(0, -1);
            for (let TLD of pattern.topLevelDomains) {
                for (let path of paths) {
                    urls.push(pattern.scheme + "://" + host + TLD + "/" + path);
                }
            }
        } else {
            for (let path of paths) {
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
 * Parser for inline redirection url.
 * @param url
 * @returns {string}
 */
RequestControl.parseInlineUrl = function (url) {
    let i = url.indexOf("http", 1);

    if (i < 0) {
        return null;
    }

    let inlineUrl = url.slice(i);

    // extract redirection url from a query parameter
    if (url.charAt(i - 1) === "=") {
        inlineUrl = inlineUrl.replace(/[&;].*/, "");
    }

    let j = 4;
    if (inlineUrl.charAt(j) === "s") {
        j++;
    }
    if (inlineUrl.startsWith("%3", j)) {
        inlineUrl = inlineUrl.replace(/\?.*/, "");
    }

    inlineUrl = decodeURIComponent(inlineUrl);

    if (!inlineUrl.startsWith("://", j)) {
        return null;
    }

    return inlineUrl;
};

RequestControl.parseRedirectInstructions = function (redirectUrl) {
    let parsedInstructions = [];
    let instruction;
    let parsedUrl = "";
    let previousEnd = -1;

    for (let i = 0; i < redirectUrl.length; i++) {
        if (redirectUrl.charAt(i) === "[" && !instruction) {
            for (let name of URL_PARAMETER_NAMES) {
                if (redirectUrl.startsWith(name, i + 1)) {
                    if (redirectUrl.charAt(i + name.length + 1) === "=") {
                        instruction = {
                            offset: i,
                            name: name,
                            valueStart: i + name.length + 2
                        };
                        i = instruction.valueStart;
                    }
                }
            }
        } else if (redirectUrl.charAt(i) === "]" && instruction) {
            instruction.end = i;
            instruction.patterns = RequestControl.parseRedirectParameters(
                redirectUrl.substring(instruction.valueStart, instruction.end));
            parsedInstructions.push(new RedirectInstruction(instruction.name, instruction.patterns));
            parsedUrl += redirectUrl.substring(previousEnd + 1, instruction.offset);
            previousEnd = instruction.end;
            instruction = null;
        }
    }
    parsedUrl += redirectUrl.substring(previousEnd + 1);
    return [parsedUrl, parsedInstructions];
};

RequestControl.parseRedirectParameters = function (redirectUrl) {
    let parsedParameters = [];
    let parameter;
    let inlineCount = 0;
    let previousEnd = -1;

    for (let i = 0; i < redirectUrl.length; i++) {
        if (redirectUrl.charAt(i) === "{") {
            inlineCount++;

            if (parameter) {
                continue;
            }

            // Look up parameter name
            for (let name of URL_PARAMETER_NAMES) {
                if (redirectUrl.startsWith(name, i + 1)) {
                    parameter = {
                        offset: i,
                        name: name,
                        ruleStart: i + name.length + 1
                    };
                    i += parameter.name.length;
                }
            }
        } else if (redirectUrl.charAt(i) === "}" && parameter) {
            inlineCount--;

            if (inlineCount === 0) {
                parameter.end = i;
                let parameterExpansion = new ParameterExpansion(parameter.name);

                if (previousEnd + 1 !== parameter.offset) {
                    parsedParameters.push(new BaseRedirectPattern(
                        redirectUrl.substring(previousEnd + 1, parameter.offset)));
                }

                if (parameter.end !== parameter.ruleStart) {
                    parsedParameters.push(new ParameterManipulation(parameterExpansion,
                        redirectUrl.substring(parameter.ruleStart, parameter.end)));
                } else {
                    parsedParameters.push(parameterExpansion);
                }
                previousEnd = parameter.end;
                parameter = null;
            }
        }
    }
    if (previousEnd + 1 < redirectUrl.length) {
        parsedParameters.push(new BaseRedirectPattern(redirectUrl.substring(previousEnd + 1)));
    }
    return parsedParameters;
};

RequestControl.parseStringManipulations = function (rules) {
    let manipulations = [];
    let replacePattern = /^\/(.+?(?!\\).)\/([^|]*)(\|(.*))?/;
    let extractPattern = /^(:-?\d*)(:-?\d*)?(\|(.*))?/;
    while (typeof rules === "string" && rules.length > 0) {
        let match = replacePattern.exec(rules);
        if (match !== null) {
            let [, pattern, replacement, , end] = match;
            manipulations.push(new ReplaceStringManipulation(pattern, replacement));
            rules = end;
            continue;
        }
        match = extractPattern.exec(rules);
        if (match !== null) {
            let [, offset, length, , end] = match;
            manipulations.push(new ExtractStringManipulation(offset, length));
            rules = end;
        } else {
            break;
        }
    }
    return manipulations;
};

RequestControl.trimQueryParameters = function (queryString, trimPattern, invert) {
    let trimmedQuery = "";
    let queries = queryString.substring(1).split("?");
    let pattern = new RegExp("^(" + trimPattern + ")$");

    for (let query of queries) {
        let searchParams = query.split("&");
        let i = searchParams.length;
        if (invert) {
            while (i--) {
                if (!pattern.test(searchParams[i].split("=")[0])) {
                    searchParams.splice(i, 1);
                }
            }
        } else {
            while (i--) {
                if (pattern.test(searchParams[i].split("=")[0])) {
                    searchParams.splice(i, 1);
                }
            }
        }
        if (searchParams.length > 0) {
            trimmedQuery += "?" + searchParams.join("&");
        }
    }
    return trimmedQuery;
};

WhitelistRule.prototype.priority = 0;
WhitelistRule.prototype.action = WHITELIST_ACTION;
WhitelistRule.prototype.resolve = WhitelistRule.resolve;

BlockRule.prototype.priority = -1;
BlockRule.prototype.action = BLOCK_ACTION;
BlockRule.prototype.resolve = BlockRule.resolve;

FilterRule.prototype.priority = -2;
FilterRule.prototype.action = FILTER_ACTION;
FilterRule.prototype.resolve = RequestControl.processRedirectRules;

RedirectRule.prototype.priority = -2;
RedirectRule.prototype.action = REDIRECT_ACTION;
RedirectRule.prototype.resolve = RequestControl.processRedirectRules;

if (typeof exports !== "undefined") {
    exports.RequestControl = RequestControl;
    exports.FilterRule = FilterRule;
    exports.RedirectRule = RedirectRule;
    var URL = require("url").URL;
}

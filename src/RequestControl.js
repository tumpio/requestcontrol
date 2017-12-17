/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const RequestControl = {};
const URL_PARAMETER_NAMES = ["hash", "host", "hostname", "href", "origin", "password", "pathname", "port", "protocol",
    "search", "username"];
const WHITELIST_ACTION = 0;
const BLOCK_ACTION = 1;
const FILTER_ACTION = 2;
const REDIRECT_ACTION = 3;
const NO_ACTION = 4;
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

class ControlRule {
    constructor(id) {
        this.id = id;
    }
}

class WhitelistRule extends ControlRule {
    constructor(id) {
        super(id);
    }

    markRequest(request) {
        if (!request[WHITELIST_ACTION]) {
            request[WHITELIST_ACTION] = [];
        }
        request[WHITELIST_ACTION].push(this);
    }

    static resolveRequest(resolve) {
        resolve(null);
    }
}

class BlockRule extends ControlRule {
    constructor(id) {
        super(id);
    }

    markRequest(request) {
        if (!request[BLOCK_ACTION]) {
            request[BLOCK_ACTION] = [];
        }
        request[BLOCK_ACTION].push(this);
    }

    static resolveRequest(resolve) {
        resolve({cancel: true});
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

    markRequest(request) {
        if (!request[FILTER_ACTION]) {
            request[FILTER_ACTION] = [];
        }
        request[FILTER_ACTION].push(this);
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
                // TODO: Inform user that redirect rule resulted in invalid URL
            }
        }
        for (let instruction of this.instructions) {
            instruction.apply(requestURL);
        }
        return requestURL;
    }

    markRequest(request) {
        if (!request[REDIRECT_ACTION]) {
            request[REDIRECT_ACTION] = [];
        }
        request[REDIRECT_ACTION].push(this);
    }

    static resolveRequest(resolve, redirectUrl) {
        resolve({redirectUrl: redirectUrl});
    }
}

class RedirectInstruction {
    constructor(name, value) {
        this.value = value;
        this.name = name;
    }

    apply(requestURL) {
        requestURL[this.name] = this.value;
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

class BaseStringManipulation {
    constructor() {
    }

    apply(str) {
        return str;
    }
}

class ReplaceManipulation extends BaseStringManipulation {
    constructor(pattern, replacement) {
        super();
        this.pattern = new RegExp(pattern);
        this.replacement = replacement;
    }

    apply(str) {
        return str.replace(this.pattern, this.replacement);
    }
}

class ExtractManipulation extends BaseStringManipulation {
    constructor(offset, length) {
        super();
        this.offset = offset;
        this.length = length;
    }

    apply(str) {
        return ExtractManipulation.extractSubstring(str, this.offset, this.length);
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

/**
 * Create a new rule listener.
 * @param index
 * @param rule
 * @returns {ControlRule} rule
 */
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
            break;
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
        if (redirectUrl.charAt(i) == "[" && !instruction) {
            for (let name of URL_PARAMETER_NAMES) {
                if (redirectUrl.startsWith(name, i + 1)) {
                    if (redirectUrl.charAt(i + name.length + 1) == "=") {
                        instruction = {
                            offset: i,
                            name: name,
                            valueStart: i + name.length + 2
                        };
                        i = instruction.valueStart;
                    }
                }
            }
        } else if (redirectUrl.charAt(i) == "]" && instruction) {
            instruction.end = i;
            instruction.value = redirectUrl.substring(instruction.valueStart, instruction.end);
            parsedInstructions.push(new RedirectInstruction(instruction.name, instruction.value));
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
        if (redirectUrl.charAt(i) == "{") {
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
        } else if (redirectUrl.charAt(i) == "}" && parameter) {
            inlineCount--;

            if (inlineCount == 0) {
                parameter.end = i;
                let parameterExpansion = new ParameterExpansion(parameter.name);

                if (previousEnd + 1 != parameter.offset) {
                    parsedParameters.push(new BaseRedirectPattern(
                        redirectUrl.substring(previousEnd + 1, parameter.offset)));
                }

                if (parameter.end != parameter.ruleStart) {
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
        if (match != null) {
            let [, pattern, replacement, , end] = match;
            manipulations.push(new ReplaceManipulation(pattern, replacement));
            rules = end;
            continue;
        }
        match = extractPattern.exec(rules);
        if (match != null) {
            let [, offset, length, , end] = match;
            manipulations.push(new ExtractManipulation(offset, length));
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

if (typeof exports !== 'undefined') {
    exports.RequestControl = RequestControl;
    exports.FilterRule = FilterRule;
    exports.RedirectRule = RedirectRule;
}

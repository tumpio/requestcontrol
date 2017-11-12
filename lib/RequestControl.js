/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const RequestControl = {};

/**
 *  Parameters of URL object.
 */
const urlParameters = ["hash", "host", "href", "origin", "pathname", "password", "port", "protocol", "search",
    "username"];

/**
 * Pattern of substring replace manipulation rule. e.g {parameter/[a-z]{4}/centi} => centimeter
 */
const replacePattern = /^\/(.+?(?!\\).)\/([^|]*)(\|(.*))?/;

/**
 * Patter of substring extraction manipulation rule. {parameter:2:-4} => ram
 */
const extractPattern = /^(:-?\d*)(:-?\d*)?(\|(.*))?/;

class RedirectRule {
    constructor(redirectUrl) {
        let [parsedUrl, instructions] = RequestControl.parseRedirectInstructions(redirectUrl);
        let patterns = RequestControl.parseRedirectParameters(parsedUrl);
        this.instructions = instructions;
        this.patterns = patterns;
    }

    apply(requestURL) {
        for (let instruction of this.instructions) {
            instruction.apply(requestURL);
        }
        let redirectUrl = "";
        for (let pattern of this.patterns) {
            redirectUrl += pattern.resolve(requestURL);
        }
        try {
            return new URL(redirectUrl);
        } catch (e) {
            return requestURL;
        }
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
        return value;
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
RequestControl.parseInlineRedirectionUrl = function (url) {
    let i = url.indexOf("http", 1);

    if (i < 0) {
        return "";
    }

    let inlineUrl = url.slice(i);

    // extract redirection url from a query parameter
    if (url.charAt(i - 1) === "=") {
        inlineUrl = inlineUrl.replace(/[&;].*/, "");
    }

    inlineUrl = decodeURIComponent(inlineUrl);

    let j = 4;
    if (inlineUrl.charAt(j) === "s") {
        j++;
    }
    if (!inlineUrl.startsWith("://", j)) {
        return "";
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
            for (let name of urlParameters) {
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
            for (let name of urlParameters) {
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

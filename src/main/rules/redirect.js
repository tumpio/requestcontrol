/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ControlRule } from "./base.js";
import { QueryParser, URL_PARAMETERS, UrlParser } from "../url.js";
import { BLOCKING_RESPONSE } from "./block.js";

// For unit tests under node
const atob = (typeof window !== "undefined") ? window.atob : function (a) {
    let buffer = Buffer.from(a, "base64");
    return buffer.toString("binary");
};
const btoa = (typeof window !== "undefined") ? window.btoa : function btoa(b) {
    let buffer = Buffer.from(b, "binary");
    return buffer.toString("base64");
};

export class BaseRedirectRule extends ControlRule {
    constructor(
        {
            uuid,
            redirectDocument = false
        } = {}, matcher) {
        super({ uuid }, matcher);
        this.redirectDocument = redirectDocument;
    }

    resolve(request) {
        let redirectUrl = this.apply(request.url);

        if (request.url === redirectUrl) {
            return null;
        }

        if (this.redirectDocument && request.type !== "main_frame") {
            this.constructor
                .updateTab(request.tabId, redirectUrl)
                .then(() => this.constructor.notify(this, request, redirectUrl));
            return BLOCKING_RESPONSE;
        } else {
            this.constructor.notify(this, request, redirectUrl);
            return { redirectUrl: redirectUrl };
        }
    }
}

export class RedirectRule extends BaseRedirectRule {
    constructor(
        {
            uuid,
            redirectUrl = "",
            redirectDocument = false
        } = {}, matcher) {
        super({ uuid, redirectDocument }, matcher);
        let [parsedUrl, instructions] = parseRedirectInstructions(redirectUrl);
        let patterns = parseRedirectParameters(parsedUrl);
        this.instructions = instructions;
        this.patterns = patterns;
    }

    apply(url) {
        let parser = new UrlParser(url);
        if (this.patterns.length > 0) {
            let redirectUrl = "";
            for (let pattern of this.patterns) {
                redirectUrl += pattern.resolve(parser);
            }
            parser.href = redirectUrl;
        }
        for (let instruction of this.instructions) {
            instruction.apply(parser);
        }
        return parser.href;
    }
}

RedirectRule.icon = "/icons/icon-redirect.svg";

class RedirectInstruction {
    constructor(name, patterns) {
        this.patterns = patterns;
        this.name = name;
    }

    apply(urlParser) {
        let value = "";
        for (let pattern of this.patterns) {
            value += pattern.resolve(urlParser);
        }
        urlParser[this.name] = value;
    }
}

class QueryInstruction extends RedirectInstruction {
    constructor(name, patterns) {
        super(name, patterns);
    }

    apply(urlParser) {
        let value = "";
        for (let pattern of this.patterns) {
            value += pattern.resolve(urlParser);
        }
        let queryParser = new QueryParser(urlParser.href);
        queryParser.set(this.name, value);
        urlParser.href = queryParser.href;
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
    resolve(urlParser) {
        return urlParser[this.value];
    }
}

class QueryParameterExpansion extends BaseRedirectPattern {
    resolve(urlParser) {
        return new QueryParser(urlParser.href).get(this.value);
    }
}

class ParameterManipulation extends BaseRedirectPattern {
    constructor(parameter, manipulationRules) {
        super(parameter);
        this.manipulations = parseStringManipulations(manipulationRules);
    }

    resolve(urlParser) {
        let value = this.value.resolve(urlParser);
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

class ReplaceAllStringManipulation extends ReplaceStringManipulation {
    constructor(pattern, replacement) {
        super(new RegExp(pattern, "g"), replacement);
    }
}

class ExtractStringManipulation {
    constructor(offset, length) {
        this.offset = offset;
        this.length = length;
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

    apply(str) {
        return ExtractStringManipulation.extractSubstring(str, this.offset, this.length);
    }
}

class DecodeURIManipulation {

    static apply(str) {
        return decodeURI(str);
    }
}

class EncodeURIManipulation {

    static apply(str) {
        return encodeURI(str);
    }
}

class DecodeURIComponentManipulation {

    static apply(str) {
        return decodeURIComponent(str);
    }
}

class EncodeURIComponentManipulation {

    static apply(str) {
        return encodeURIComponent(str);
    }
}

class DecodeBase64Manipulation {

    static apply(str) {
        return atob(str);
    }
}

class EncodeBase64Manipulation {

    static apply(str) {
        return btoa(str);
    }
}


function parseRedirectInstructions(redirectUrl) {
    let parsedInstructions = [];
    let instruction;
    let queryInstruction = false;
    let parsedUrl = "";
    let previousEnd = -1;
    let inlineCount = 0;
    let queryParamStart = "search.";

    for (let i = 0; i < redirectUrl.length; i++) {
        if (redirectUrl.charAt(i) === "[") {
            inlineCount++;
            if (!instruction) {

                if (redirectUrl.startsWith(queryParamStart, i + 1)) {
                    let name = redirectUrl.substring(i + queryParamStart.length + 1).match(/^\w+/)[0];
                    instruction = {
                        offset: i,
                        name: name,
                        valueStart: queryParamStart.length + name.length + 2
                    };
                    i += queryParamStart.length + name.length;
                    queryInstruction = true;
                    continue;
                }


                for (let name of URL_PARAMETERS) {
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
            }
        } else if (redirectUrl.charAt(i) === "]" && instruction) {
            inlineCount--;
            if (inlineCount === 0) {
                instruction.end = i;
                instruction.patterns = parseRedirectParameters(
                    redirectUrl.substring(instruction.valueStart, instruction.end));
                if (queryInstruction) {
                    parsedInstructions.push(new QueryInstruction(instruction.name, instruction.patterns));
                } else {
                    parsedInstructions.push(new RedirectInstruction(instruction.name, instruction.patterns));
                }
                parsedUrl += redirectUrl.substring(previousEnd + 1, instruction.offset);
                previousEnd = instruction.end;
                instruction = null;
                queryInstruction = false;
            }
        }
    }
    parsedUrl += redirectUrl.substring(previousEnd + 1);
    return [parsedUrl, parsedInstructions];
}

function parseRedirectParameters(redirectUrl) {
    let parsedParameters = [];
    let parameter;
    let parameterExpansion;
    let inlineCount = 0;
    let previousEnd = -1;
    let queryParamStart = "search.";

    for (let i = 0; i < redirectUrl.length; i++) {
        if (redirectUrl.charAt(i) === "{") {
            inlineCount++;

            if (parameter) {
                continue;
            }

            if (redirectUrl.startsWith(queryParamStart, i + 1)) {
                let name = redirectUrl.substring(i + queryParamStart.length + 1).match(/^\w+/)[0];
                parameter = {
                    offset: i,
                    ruleStart: queryParamStart.length + name.length + 1
                };
                i += queryParamStart.length + name.length;
                parameterExpansion = new QueryParameterExpansion(name);
                continue;
            }

            // Look up parameter name
            for (let name of URL_PARAMETERS) {
                if (redirectUrl.startsWith(name, i + 1)
                    && redirectUrl.charAt(i + name.length + 1).match(/[}/:|]/)) {
                    parameter = {
                        offset: i,
                        ruleStart: i + name.length + 1
                    };
                    i += name.length;
                    parameterExpansion = new ParameterExpansion(name);
                    break;
                }
            }
        } else if (redirectUrl.charAt(i) === "}" && parameter && parameterExpansion) {
            inlineCount--;

            if (inlineCount === 0) {
                parameter.end = i;

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
}

function parseStringManipulations(rules) {
    let manipulations = [];
    let replacePattern = /^\|?\/(.+?\/[^|]*)(.*)/;
    let replaceAllPattern = /^\|?\/\/(.+?\/[^|]*)(.*)/;
    let extractPattern = /^\|?(:-?\d*)(:-?\d*)?(.*)/;
    let keywordPattern = /^\|(\w+)(.*)/;
    let keywordManipulations = {
        "decodeuri": DecodeURIManipulation,
        "encodeuri": EncodeURIManipulation,
        "decodeuricomponent": DecodeURIComponentManipulation,
        "encodeuricomponent": EncodeURIComponentManipulation,
        "decodebase64": DecodeBase64Manipulation,
        "encodebase64": EncodeBase64Manipulation,
    };
    while (typeof rules === "string" && rules.length > 0) {
        let match = replaceAllPattern.exec(rules);
        if (match !== null) {
            let [, p, end] = match;
            let [pattern, replacement] = parseReplacePattern(p);
            if (pattern != null) {
                manipulations.push(new ReplaceAllStringManipulation(pattern, replacement));
            }
            rules = end;
            continue;
        }
        match = replacePattern.exec(rules);
        if (match !== null) {
            let [, p, end] = match;
            let [pattern, replacement] = parseReplacePattern(p);
            if (pattern != null) {
                manipulations.push(new ReplaceStringManipulation(pattern, replacement));
            }
            rules = end;
            continue;
        }
        match = extractPattern.exec(rules);
        if (match !== null) {
            let [, offset, length, end] = match;
            manipulations.push(new ExtractStringManipulation(offset, length));
            rules = end;
            continue;
        }
        match = keywordPattern.exec(rules);
        if (match !== null) {
            let [, keyword, end] = match;
            keyword = keyword.toLowerCase();
            if (keywordManipulations.hasOwnProperty(keyword)) {
                manipulations.push(keywordManipulations[keyword]);
                rules = end;
            } else {
                break;
            }
        } else {
            break;
        }
    }
    return manipulations;
}

function parseReplacePattern(str) {
    let counter = 0;
    for (let i = 0; i < str.length; i++) {
        if (str.charAt(i) === "\\") {
            counter++;
        } else if (str.charAt(i) === "/" && counter === 0 || counter % 1) {
            return [str.substring(0, i), str.substring(i + 1)];
        } else {
            counter = 0;
        }
    }
    return [null, null];
}

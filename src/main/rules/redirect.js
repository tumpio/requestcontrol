/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ControlRule } from "./base.js";
import { QueryParser, URL_PARAMETERS, UrlParser } from "../url.js";
import { BLOCKING_RESPONSE } from "./block.js";

export class BaseRedirectRule extends ControlRule {
    constructor({ uuid, tag, redirectDocument = false } = {}, matcher) {
        super({ uuid, tag }, matcher);
        this.redirectDocument = redirectDocument;
    }

    resolve(request) {
        const redirectUrl = this.apply(request.url);

        if (request.url === redirectUrl) {
            return null;
        }

        if (this.redirectDocument && request.type !== "main_frame") {
            this.constructor
                .updateTab(request.tabId, redirectUrl)
                .then(() => this.constructor.notify(this, request, redirectUrl));
            return BLOCKING_RESPONSE;
        }
        this.constructor.notify(this, request, redirectUrl);
        return { redirectUrl };
    }
}

export class RedirectRule extends BaseRedirectRule {
    constructor({ uuid, tag, redirectUrl = "", redirectDocument = false } = {}, matcher) {
        super({ uuid, tag, redirectDocument }, matcher);
        const [parsedUrl, instructions] = parseRedirectInstructions(redirectUrl);
        const patterns = parseRedirectParameters(parsedUrl);
        this.instructions = instructions;
        this.patterns = patterns;
    }

    apply(url) {
        const parser = new UrlParser(url);
        if (this.patterns.length > 0) {
            let redirectUrl = "";
            for (const pattern of this.patterns) {
                redirectUrl += pattern.resolve(parser);
            }
            parser.href = redirectUrl;
        }
        for (const instruction of this.instructions) {
            instruction.apply(parser);
        }
        return parser.href;
    }
}

RedirectRule.icon = "/icons/icon-redirect.svg";
RedirectRule.action = "redirect";

class RedirectInstruction {
    constructor(name, patterns) {
        this.patterns = patterns;
        this.name = name;
    }

    apply(urlParser) {
        let value = "";
        for (const pattern of this.patterns) {
            value += pattern.resolve(urlParser);
        }
        urlParser[this.name] = value;
    }
}

class QueryInstruction extends RedirectInstruction {
    apply(urlParser) {
        let value = "";
        for (const pattern of this.patterns) {
            value += pattern.resolve(urlParser);
        }
        const queryParser = new QueryParser(urlParser.href);
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
        for (const manipulation of this.manipulations) {
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
        const i = offset === ":" ? 0 : Number.parseInt(offset.substring(1));
        if (i < 0) {
            substr = str.slice(i);
        } else {
            substr = str.substring(i);
        }
        if (length) {
            const l = length === ":" ? 0 : Number.parseInt(length.substring(1));
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
    const parsedInstructions = [];
    let instruction;
    let queryInstruction = false;
    let parsedUrl = "";
    let previousEnd = -1;
    let inlineCount = 0;
    const queryParamStart = "search.";

    for (let i = 0; i < redirectUrl.length; i++) {
        if (redirectUrl.charAt(i) === "[") {
            inlineCount++;
            if (!instruction) {
                if (redirectUrl.startsWith(queryParamStart, i + 1)) {
                    const name = redirectUrl.substring(i + queryParamStart.length + 1).match(/^\w+/)[0];
                    instruction = {
                        offset: i,
                        name,
                        valueStart: queryParamStart.length + name.length + 2,
                    };
                    i += queryParamStart.length + name.length;
                    queryInstruction = true;
                    continue;
                }

                for (const name of URL_PARAMETERS) {
                    if (redirectUrl.startsWith(name, i + 1) && redirectUrl.charAt(i + name.length + 1) === "=") {
                        instruction = {
                            offset: i,
                            name,
                            valueStart: i + name.length + 2,
                        };
                        i = instruction.valueStart;
                    }
                }
            }
        } else if (redirectUrl.charAt(i) === "]" && instruction) {
            inlineCount--;
            if (inlineCount === 0) {
                instruction.end = i;
                instruction.patterns = parseRedirectParameters(
                    redirectUrl.substring(instruction.valueStart, instruction.end)
                );
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
    const parsedParameters = [];
    let parameter;
    let parameterExpansion;
    let inlineCount = 0;
    let previousEnd = -1;
    const queryParamStart = "search.";

    for (let i = 0; i < redirectUrl.length; i++) {
        if (redirectUrl.charAt(i) === "{") {
            inlineCount++;

            if (parameter) {
                continue;
            }

            if (redirectUrl.startsWith(queryParamStart, i + 1)) {
                const name = redirectUrl.substring(i + queryParamStart.length + 1).match(/^\w+/)[0];
                parameter = {
                    offset: i,
                    ruleStart: queryParamStart.length + name.length + 1,
                };
                i += queryParamStart.length + name.length;
                parameterExpansion = new QueryParameterExpansion(name);
                continue;
            }

            // Look up parameter name
            for (const name of URL_PARAMETERS) {
                if (redirectUrl.startsWith(name, i + 1) && redirectUrl.charAt(i + name.length + 1).match(/[/:|}]/)) {
                    parameter = {
                        offset: i,
                        ruleStart: i + name.length + 1,
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
                    parsedParameters.push(
                        new BaseRedirectPattern(redirectUrl.substring(previousEnd + 1, parameter.offset))
                    );
                }

                if (parameter.end !== parameter.ruleStart) {
                    parsedParameters.push(
                        new ParameterManipulation(
                            parameterExpansion,
                            redirectUrl.substring(parameter.ruleStart, parameter.end)
                        )
                    );
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
    const manipulations = [];
    const replacePattern = /^\|?\/(.+?\/[^|]*)(.*)/;
    const replaceAllPattern = /^\|?\/\/(.+?\/[^|]*)(.*)/;
    const extractPattern = /^\|?(:-?\d*)(:-?\d*)?(.*)/;
    const keywordPattern = /^\|(\w+)(.*)/;
    const keywordManipulations = {
        decodeuri: DecodeURIManipulation,
        encodeuri: EncodeURIManipulation,
        decodeuricomponent: DecodeURIComponentManipulation,
        encodeuricomponent: EncodeURIComponentManipulation,
        decodebase64: DecodeBase64Manipulation,
        encodebase64: EncodeBase64Manipulation,
    };
    while (typeof rules === "string" && rules.length > 0) {
        let match = replaceAllPattern.exec(rules);
        if (match !== null) {
            const [, p, end] = match;
            const [pattern, replacement] = parseReplacePattern(p);
            if (pattern != null) {
                manipulations.push(new ReplaceAllStringManipulation(pattern, replacement));
            }
            rules = end;
            continue;
        }
        match = replacePattern.exec(rules);
        if (match !== null) {
            const [, p, end] = match;
            const [pattern, replacement] = parseReplacePattern(p);
            if (pattern != null) {
                manipulations.push(new ReplaceStringManipulation(pattern, replacement));
            }
            rules = end;
            continue;
        }
        match = extractPattern.exec(rules);
        if (match !== null) {
            const [, offset, length, end] = match;
            manipulations.push(new ExtractStringManipulation(offset, length));
            rules = end;
            continue;
        }
        match = keywordPattern.exec(rules);
        if (match !== null) {
            const keyword = match[1].toLowerCase();
            const end = match[2];
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
        } else if ((str.charAt(i) === "/" && counter === 0) || counter % 1) {
            return [str.substring(0, i), str.substring(i + 1)];
        } else {
            counter = 0;
        }
    }
    return [null, null];
}

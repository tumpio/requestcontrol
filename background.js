/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const myOptionsManager = new OptionsManager();
const tldStarPattern = /^(.+)\.\*$/;
const redirectUrlPattern = /^https?:\/\/.+(https?)(:\/\/|%3A\/\/|%3A%2F%2F)(.+)$/;
const paramExpanPattern = /{([a-z]+)(.*?)}/g;
const redirectInstrPattern = /\[([a-z]+)=(.+?)]/g;
const substrExtractPattern = /^(:-?\d*)(:-?\d*)?(\|(.*))?/;
const substrReplacePattern = /^\/(.+?(?!\\).)\/([^|]*)(\|(.*))?/;
const requestListeners = [];
var requestDetails = {};

var titles = {
    filter: "Request was filtered",
    block: "Request was blocked",
    redirect: "Request was redirected",
    whitelist: "Request was whitelisted"
};

const whitelist = new Map();

function tidyWhitelist() {
    if (whitelist.size > 20) {
        let timeLimit = Date.now() - 1000;
        for (let [requestId, timeStamp] of whitelist) {
            if (timeStamp < timeLimit) {
                whitelist.delete(requestId);
            }
        }
    }
}

function RequestAction(rule) {
    switch (rule.action) {
        case "filter":
            return function (request) {
                return new Promise((resolve) => {
                    if (whitelist.has(request.requestId) || request.method !== "GET" || request.tabId === -1) {
                        resolve(null);
                    } else {
                        let redirectUrl = parseRedirectUrl(request.url);
                        if (redirectUrl.length < request.url.length) {
                            resolve({cancel: true});
                            browser.tabs.update(request.tabId, {
                                url: redirectUrl
                            });
                            addPageActionDetails(request, rule.action);
                        } else {
                            resolve(null);
                        }
                    }
                });
            };
        case "block":
            return function (request) {
                return new Promise((resolve) => {
                    if (whitelist.has(request.requestId)) {
                        resolve(null);
                    } else {
                        resolve({cancel: true});
                        addPageActionDetails(request, rule.action);
                    }
                });
            };
        case "redirect":
            return function (request) {
                return new Promise((resolve) => {
                    if (whitelist.has(request.requestId)) {
                        resolve(null);
                    } else {
                        let [requestUrl, instrParsed] = parseRedirectInstructions(request.url, rule.redirectUrl);
                        let paramsExpanded = resolveParamExpansion(requestUrl.href, instrParsed);
                        let redirectUrl;

                        try {
                            redirectUrl = new URL(paramsExpanded);
                        } catch (e) {
                            redirectUrl = requestUrl;
                        }

                        if (redirectUrl.href !== request.url) {
                            resolve({redirectUrl: redirectUrl.href});
                        } else {
                            resolve(null);
                        }
                        addPageActionDetails(request, rule.action);
                    }
                });
            };
        case "whitelist":
            return function (request) {
                whitelist.set(request.requestId, request.timeStamp);
                return new Promise((resolve) => {
                    resolve(null);
                    addPageActionDetails(request, rule.action);
                    tidyWhitelist();
                });
            }
    }
}

function parseRedirectInstructions(requestURL, redirectURL) {
    let url = new URL(requestURL);
    let redirectInstrReplacer = function (match, param, value) {
        if (param in url && typeof url[param] === "string") {
            url[param] = value;
        }
        return "";
    };

    let instrRemoved = redirectURL.replace(redirectInstrPattern, redirectInstrReplacer);

    return [url, instrRemoved];
}

function resolveParamExpansion(requestURL, redirectURL) {
    let paramExpansionReplacer = function (match, param, manipulationRules) {
        let url = new URL(requestURL);
        if (param in url && typeof url[param] === "string") {
            return applyStringManipulation(url[param], manipulationRules);
        }
        return "";
    };
    return redirectURL.replace(paramExpanPattern, paramExpansionReplacer);
}

function applyStringManipulation(str, rules) {
    if (typeof rules !== "string" || rules.length === 0) {
        return str;
    }
    if (substrReplacePattern.test(rules)) {
        return replaceSubstring(str, ...rules.match(substrReplacePattern));
    } else if (substrExtractPattern.test(rules)) {
        return extractSubstring(str, ...rules.match(substrExtractPattern));
    }
    return str;
}

function replaceSubstring(str, match, pattern, replacement, pipe, manipulationRules) {
    let newStr = str.replace(new RegExp(pattern), replacement);
    return applyStringManipulation(newStr, manipulationRules);
}

function extractSubstring(str, match, offset, length, pipe, manipulationRules) {
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
    return applyStringManipulation(substr, manipulationRules);
}

function addPageActionDetails(request, action) {
    requestDetails[request.tabId] = {
        action: action,
        originUrl: request.originUrl,
        timeStamp: request.timeStamp,
        type: request.type,
        url: request.url
    };
    browser.webNavigation.onDOMContentLoaded.addListener(function (details) {
        browser.pageAction.setIcon({
            tabId: details.tabId,
            path: {
                19: "icons/icon-" + action + "@19.png",
                38: "icons/icon-" + action + "@38.png"
            }
        });
        browser.pageAction.setTitle({
            tabId: details.tabId,
            title: titles[action]
        });
        browser.pageAction.show(details.tabId);
        browser.webNavigation.onDOMContentLoaded.removeListener(arguments.callee);
    });
}

function redirectUrlReplacer(match, p1, p2, p3) {
    if (p2[0] === "%") {
        p2 = decodeURIComponent(p2);
    }
    if (/(%26|%2F)/.test(p3)) {
        p3 = p3.replace(/&.+/, "");
    }
    return p1 + p2 + filterUnwantedQueryParams(decodeURIComponent(p3));
}

function parseRedirectUrl(url) {
    return url.replace(redirectUrlPattern, redirectUrlReplacer);
}

function filterQuery(query) {
    let queryParam = query.split("=")[0];
    return !myOptionsManager.options.queryParams.includes(queryParam);
}

function filterUnwantedQueryParams(url) {
    let urlParts = url.split("?");
    for (let i = urlParts.length - 1; i >= 1; i--) {
        urlParts[i] = urlParts[i].split("&").filter(filterQuery).join("&");
        if (urlParts[i].length === 0) {
            urlParts.splice(i, 1);
        }
    }
    return urlParts.join("?");
}

function resolveUrls(pattern) {
    let urls = [];
    if (pattern.allUrls) {
        return ["<all_urls>"];
    }
    if (tldStarPattern.test(pattern.host)) {
        for (let TLD of pattern.topLevelDomains) {
            urls.push(tldStarPatternRuleToUrl(pattern, TLD));
        }
    } else {
        urls.push(patternRuleToUrl(pattern));
    }
    return urls;
}

function patternRuleToUrl(pattern) {
    return pattern.scheme + "://" + (pattern.matchSubDomains ? "*." : "") + pattern.host + "/" + pattern.path;
}

function tldStarPatternRuleToUrl(pattern, TLD) {
    return pattern.scheme + "://" + (pattern.matchSubDomains ? "*." : "") + pattern.host.replace(tldStarPattern, "$1." +
            TLD) + "/" + pattern.path;
}

function removePreviousListeners() {
    let listener;
    while (requestListeners.length) {
        listener = requestListeners.pop();
        browser.webRequest.onBeforeRequest.removeListener(listener);
    }
}

function addListeners(rules) {
    let filter, listener;
    for (let rule of rules) {
        if (!rule.active) {
            continue;
        }
        filter = {
            urls: resolveUrls(rule.pattern),
            types: rule.types
        };
        listener = new RequestAction(rule);
        browser.webRequest.onBeforeRequest.addListener(listener, filter, ["blocking"]);
        requestListeners.push(listener);
    }
}

function init() {
    removePreviousListeners();
    addListeners(myOptionsManager.options.whitelist);
    addListeners(myOptionsManager.options.rules);
    browser.webRequest.handlerBehaviorChanged();
}

myOptionsManager.loadOptions(init);
myOptionsManager.onChanged(init);

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const myOptionsManager = new OptionsManager(RequestControl.defaultOptions);
const tldStarPattern = /^(.+)\.\*$/;
const redirectUrlPattern = /^https?:\/\/(.+)(https?)(:\/\/|%3A\/\/|%3A%2F%2F)(.+)$/;
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

const requests = new Map();

function RequestActionFactory(rule) {
    switch (rule.action) {
        case "whitelist":
            return whitelistAction;
        case "block":
            return blockAction;
        case "redirect":
            return function (details) {
                redirectAction(details, rule);
            };
        case "filter":
            return function (details) {
                filterAction(details, rule);
            };
    }
}

function getRequest(details) {
    if (!requests.has(details.requestId)) {
        requests.set(details.requestId, details);
    }
    return requests.get(details.requestId);
}

function whitelistAction(details) {
    let request = getRequest(details);
    request.whitelist = true;
}

function blockAction(details) {
    let request = getRequest(details);
    request.block = true;
}

function redirectAction(details, rule) {
    let request = getRequest(details);
    request.filter = true;

    if (!request.redirectRules) {
        request.redirectRules = [rule];
    } else {
        request.redirectRules.push(rule);
    }
}

function filterAction(details, rule) {
    let request = getRequest(details);
    request.filter = true;

    if (!request.filterRules) {
        request.filterRules = [rule];
    } else {
        request.filterRules.push(rule);
    }

    if (rule.skipRedirectionFilter) {
        request.skipRedirectionFilter = true;
    }
}

function applyRedirectRules(url, rule) {
    let [requestUrl, instrParsed] = parseRedirectInstructions(url, rule.redirectUrl);
    let paramsExpanded = resolveParamExpansion(requestUrl.href, instrParsed);

    try {
        return new URL(paramsExpanded);
    } catch (e) {
        return requestUrl;
    }
}

function applyFilterRules(url, rules) {
    let skipRedirectionFilter = true;
    let trimAllParams = false;
    let paramsFilter = [];

    for (let rule of rules) {
        if (!rule.skipRedirectionFilter) {
            skipRedirectionFilter = false;
        }
        if (rule.trimAllParams) {
            trimAllParams = true;
        }
        if (Array.isArray(rule.paramsFilter)) {
            paramsFilter = paramsFilter.concat(rule.paramsFilter);
        }
    }

    // redirection url filter
    if (!skipRedirectionFilter) {
        url = new URL(url.href.replace(redirectUrlPattern, redirectUrlReplacer));
    }

    // trim query parameters
    if (trimAllParams) {
        url.search = "";
    } else if (paramsFilter.length > 0) {
        let filterParams = new URLSearchParams();
        let pattern = new RegExp("^(" + paramsFilter.join("|").replace("*", ".*") + ")$");
        for (let param of url.searchParams) {
            if (!pattern.test(param[0])) {
                filterParams.append(param[0], param[1]);
            }
        }
        url.search = filterParams.toString();
    }
    return url;
}

function redirectUrlReplacer(match, urlBegin, p1, p2, urlEnd) {
    if (p2[0] === "%") {
        p2 = decodeURIComponent(p2);
    }
    if (/(%26|%2F)/.test(urlEnd) || urlBegin.includes("?")) {
        urlEnd = urlEnd.replace(/[&;].+/, "");
    }
    return p1 + p2 + decodeURIComponent(urlEnd);
}

function parseRedirectInstructions(url, redirectURL) {
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

function addPageActionDetails(request) {
    requestDetails[request.tabId] = request;
    browser.webNavigation.onDOMContentLoaded.addListener(function (details) {
        browser.pageAction.setIcon({
            tabId: details.tabId,
            path: {
                19: "icons/icon-" + request.action + "@19.png",
                38: "icons/icon-" + request.action + "@38.png"
            }
        });
        browser.pageAction.setTitle({
            tabId: details.tabId,
            title: titles[request.action]
        });
        browser.pageAction.show(details.tabId);
        browser.webNavigation.onDOMContentLoaded.removeListener(arguments.callee);
    });
}

function removeRuleListeners() {
    let listener;
    while (requestListeners.length) {
        listener = requestListeners.pop();
        browser.webRequest.onBeforeRequest.removeListener(listener);
    }
    browser.webRequest.onBeforeRequest.removeListener(requestControlListener);
}

function addRuleListeners(rules) {
    let filter, listener;
    for (let rule of rules) {
        if (!rule.active) {
            continue;
        }
        let urls = RequestControl.resolveUrls(rule.pattern);
        filter = {
            urls: urls,
            types: rule.types
        };
        listener = new RequestActionFactory(rule);
        browser.webRequest.onBeforeRequest.addListener(listener, filter);
        requestListeners.push(listener);
    }
    browser.webRequest.onBeforeRequest.addListener(requestControlListener,
        {urls: ["<all_urls>"]}, ["blocking"]);
}

function resolveControlRules(resolve, requestId) {
    let request = requests.get(requestId);

    if (request.whitelist) {
        resolve(null);
        request.action = "whitelist";
    }
    else if (request.block) {
        resolve({cancel: true});
        request.action = "block";
    }
    else {
        let requestUrl = new URL(request.url);

        if (request.redirect) {
            requestUrl = request.redirectRules.reduce(applyRedirectRules, requestUrl);
            request.action = "redirect";
        }
        if (request.filter) {
            requestUrl = applyFilterRules(requestUrl, request.filterRules);
            request.action = "filter";
        }

        if (requestUrl.href !== request.url) {
            request.redirectUrl = requestUrl.href;

            // Filter sub frame redirection requests (e.g. Google search link tracking)
            if (request.filter && request.type === "sub_frame" && !request.skipRedirectionFilter) {
                resolve({cancel: true});
                browser.tabs.update(request.tabId, {
                    url: request.redirectUrl
                });
            } else {
                resolve({redirectUrl: request.redirectUrl});
            }
        } else {
            resolve(null);
            request.action = null;
        }
    }
    if (request.action) {
        addPageActionDetails(request);
    }
    requests.delete(requestId);
}

function requestControlListener(details) {
    if (requests.has(details.requestId)) {
        return new Promise(function (resolve) {
            resolveControlRules(resolve, details.requestId);
        });
    }
    return null;
}

function init() {
    removeRuleListeners();
    addRuleListeners(myOptionsManager.options.rules);
    browser.webRequest.handlerBehaviorChanged();
}

myOptionsManager.loadOptions(init);
myOptionsManager.onChanged(init);

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Request Control background script for processing request control rules,
 * adding request listeners and keeping record of resolved requests.
 *
 * Request listener (webRequest.onBeforeListener) is added for each rule.
 * When request matches a rule it will be marked for rule processing.
 *
 * If request is marked for any rule, requestControlListener that listens for all requests calls
 * resolveControlRules to process all marked rules, and a record of the resolved request is
 * added to the records.
 */

/**
 * Options manager initialized with default options.
 * @type {OptionsManager}
 */
const myOptionsManager = new OptionsManager(RequestControl.defaultOptions);

/**
 * Initialize on rules load.
 */
myOptionsManager.loadOptions(init);

/**
 * Reload on rules change.
 */
myOptionsManager.onChanged(init);

/**
 * Init rule listeners.
 */
function init() {
    removeRuleListeners();
    addRuleListeners(myOptionsManager.options.rules);
    browser.webRequest.handlerBehaviorChanged();
}

/**
 * Array of added request listeners for each rule and request control listener.
 * @type {Array}
 */
const requestListeners = [];

/**
 * Add rule marker request listener for each active rule.
 * Add requestControlListener for listening all requests for rule processing.
 * @param rules array of rules
 */
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
        listener = new RuleMarkerFactory(rule);
        browser.webRequest.onBeforeRequest.addListener(listener, filter);
        requestListeners.push(listener);
    }
    browser.webRequest.onBeforeRequest.addListener(requestControlListener,
        {urls: ["<all_urls>"]}, ["blocking"]);
}

/**
 * Remove all set rule marker request listeners and the requestControlListener.
 */
function removeRuleListeners() {
    let listener;
    while (requestListeners.length) {
        listener = requestListeners.pop();
        browser.webRequest.onBeforeRequest.removeListener(listener);
    }
    browser.webRequest.onBeforeRequest.removeListener(requestControlListener);
}

/**
 * Listen all requests for rule processing.
 * If request has been marked, process marked rules.
 * @param details request details
 * @returns {Promise} a new promise that is resolved after processing rules, if not marked return null
 */
function requestControlListener(details) {
    if (markedRequests.has(details.requestId)) {
        return new Promise(function (resolve) {
            processMarkedRules(resolve, details.requestId);
        });
    }
    return null;
}

/**
 * Requests marked for rule processing.
 * @type {Map} requestId -> request details from onBeforeListener.
 */
const markedRequests = new Map();

/**
 * Mark request for rule processing.
 * @param details request detail
 * @returns {details} marked request details
 */
function markRequest(details) {
    if (!markedRequests.has(details.requestId)) {
        markedRequests.set(details.requestId, details);
    }
    return markedRequests.get(details.requestId);
}

/**
 * Create new rule marker based on the action of the rule.
 * @param rule
 * @returns {*} rule marker for request listener.
 */
function RuleMarkerFactory(rule) {
    switch (rule.action) {
        case "whitelist":
            return whitelistMarker;
        case "block":
            return blockMarker;
        case "redirect":
            return function (details) {
                redirectMarker(details, rule);
            };
        case "filter":
            return function (details) {
                filterMarker(details, rule);
            };
    }
}

/**
 * Mark request for whitelist rule.
 * @param details
 */
function whitelistMarker(details) {
    let request = markRequest(details);
    request.whitelist = true;
}

/**
 * Mark request for block rule.
 * @param details
 */
function blockMarker(details) {
    let request = markRequest(details);
    request.block = true;
}

/**
 * Mark request for redirect rule and
 * add rule for processing.
 * @param details
 * @param rule
 */
function redirectMarker(details, rule) {
    let request = markRequest(details);
    request.redirect = true;

    if (!request.redirectRules) {
        request.redirectRules = [rule];
    } else {
        request.redirectRules.push(rule);
    }
}

/**
 * Mark request for filter rule and
 * add rule for processing.
 * @param details
 * @param rule
 */
function filterMarker(details, rule) {
    let request = markRequest(details);
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

/**
 * Process rules marked for request. Add record of processed request.
 * Rule processing follows rule priorities described in the manual.
 * @param resolve when rules processing is finished.
 * @param requestId
 */
function processMarkedRules(resolve, requestId) {
    let request = markedRequests.get(requestId);
    markedRequests.delete(requestId);

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
            requestUrl = request.redirectRules.reduce(applyRedirectRule, requestUrl);
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
        addRecord(request);
    }
}

/**
 * Apply filter rules.
 * Parses redirection url if any of the rules is not skipping it.
 * Trims query parameters defined in rules, or all if any of the rules is configured to apply it.
 * @param requestURL
 * @param rules
 * @returns {URL}
 */
function applyFilterRules(requestURL, rules) {
    let skipRedirectionFilter = true;
    let trimAllParams = false;
    let paramsFilter = "";

    for (let rule of rules) {
        if (!rule.skipRedirectionFilter) {
            skipRedirectionFilter = false;
        }
        if (rule.trimAllParams) {
            trimAllParams = true;
        }
        if (!trimAllParams && rule.paramsFilterPattern) {
            paramsFilter += "|" + rule.paramsFilterPattern;
        }
    }

    paramsFilter = paramsFilter.substring(1);

    // redirection url filter
    if (!skipRedirectionFilter) {
        requestURL = new URL(requestURL.href.replace(redirectionUrlPattern, redirectionUrlParser));
    }

    // trim query parameters
    if (trimAllParams) {
        requestURL.search = "";
    } else if (paramsFilter.length > 0 && requestURL.search.length > 0) {
        let searchParams = requestURL.search.substring(1).split("&");
        let pattern = new RegExp("^(" + paramsFilter + ")$");
        let i = searchParams.length;
        while (i--) {
            if (pattern.test(searchParams[i].split("=")[0])) {
                searchParams.splice(i, 1);
            }
        }
        requestURL.search = searchParams.join("&");
    }
    return requestURL;
}

/**
 * Pattern for redirection url.
 * @type {RegExp}
 */
const redirectionUrlPattern = /^https?:\/\/(.+)(https?)(:\/\/|%3A\/\/|%3A%2F%2F)(.+)$/;

/**
 * Parser for redirection url.
 * @param match whole match
 * @param urlBegin begin of url before contained redirection url
 * @param p1 redirection url protocol
 * @param p2 ://
 * @param urlEnd end of url containing redirection url
 * @returns {string}
 */
function redirectionUrlParser(match, urlBegin, p1, p2, urlEnd) {
    if (p2[0] === "%") {
        p2 = decodeURIComponent(p2);
    }

    // extract redirection url from a query parameter
    if (urlBegin.endsWith("=")) {
        urlEnd = urlEnd.replace(/[&;].+/, "");
    }

    // decode encoded redirection url
    if (urlEnd.includes("%2F")) {
        urlEnd = decodeURIComponent(urlEnd);
    }

    return p1 + p2 + urlEnd;
}

/**
 * Apply redirect rule.
 * Resolve redirect instructions and parameter expansions from redirect url of rule.
 * @param requestURL
 * @param rule
 * @returns {URL}
 */
function applyRedirectRule(requestURL, rule) {
    let [instrURL, redirectUrl] = applyRedirectInstructions(requestURL, rule.redirectUrl);
    let paramsExpandedUrl = resolveParamExpansion(instrURL.href, redirectUrl);

    try {
        return new URL(paramsExpandedUrl);
    } catch (e) {
        return instrURL;
    }
}

/**
 * Pattern of redirection instruction: [parameter=value]
 * @type {RegExp}
 */
const redirectInstrPattern = /\[([a-z]+)=(.+?)]/g;

/**
 * Applies all parsed redirection instructions.
 * @param requestURL where instructions are applied.
 * @param redirectUrl where instructions are parsed.
 * @returns {[URL, String]} array containing modified URL and redirectUrl with instructions removed
 */
function applyRedirectInstructions(requestURL, redirectUrl) {
    let redirectInstrParser = function (match, param, value) {
        if (param in requestURL && typeof requestURL[param] === "string") {
            requestURL[param] = value;
        }
        return "";
    };
    return [requestURL, redirectUrl.replace(redirectInstrPattern, redirectInstrParser)];
}

/**
 * Pattern of parameter expansion {parameter[manipulation|manipulation|...|manipulation]?}
 * @type {RegExp}
 */
const paramExpanPattern = /{([a-z]+)(.*?)}/g;

/**
 * Resolve parameter expansion and apply string manipulation rules for extracted parameter values.
 * @param requestUrl string
 * @param redirectUrl string
 * @returns {URL}
 */
function resolveParamExpansion(requestUrl, redirectUrl) {
    let paramExpansionParser = function (match, param, manipulationRules) {
        let url = new URL(requestUrl);
        if (param in url && typeof url[param] === "string") {
            return applyStringManipulation(url[param], manipulationRules);
        }
        return "";
    };
    return redirectUrl.replace(paramExpanPattern, paramExpansionParser);
}

/**
 * Process string manipulation rules (substring extraction or substring replacing) recursively.
 * @param str value
 * @param rules string manipulation rules
 * @returns {string}
 */
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

/**
 * Pattern of substring replace manipulation rule. e.g {parameter/[a-z]{4}/centi} => centimeter
 * @type {RegExp}
 */
const substrReplacePattern = /^\/(.+?(?!\\).)\/([^|]*)(\|(.*))?/;

/**
 * Apply substring replace manipulation rule.
 * @param str value
 * @param match whole match
 * @param pattern regular expression pattern of string to replace.
 * @param replacement which replaces pattern.
 * @param pipe extract | char that is chaining manipulation rules.
 * @param manipulationRules trailing manipulation rules.
 * @returns {string}
 */
function replaceSubstring(str, match, pattern, replacement, pipe, manipulationRules) {
    let newStr = str.replace(new RegExp(pattern), replacement);
    return applyStringManipulation(newStr, manipulationRules);
}


/**
 * Patter of substring extraction manipulation rule. {parameter:2:-4} => ram
 * @type {RegExp}
 */
const substrExtractPattern = /^(:-?\d*)(:-?\d*)?(\|(.*))?/;

/**
 * Extract a substring.
 * @param str value
 * @param match
 * @param offset the begin of sub string extraction.
 *  Negative offset is counted from end of string.
 * @param length the length of extracted substring.
 *  Negative length reduces the length of extracted substring starting from end.
 * @param pipe extract | char that is chaining manipulation rules.
 * @param manipulationRules trailing manipulation rules.
 * @returns {string}
 */
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

/**
 * Records of resolved requests for tabs.
 * @type {Map} tabId -> array of records
 */

const records = new Map();

/**
 * Get records for current tab.
 * @returns {Promise}
 */
function getRecords() {
    return browser.tabs.query({
        currentWindow: true,
        active: true
    }).then(tabs => {
        return records.get(tabs[0].id);
    });
}

/**
 * Remove records for tab.
 * @param tabId
 */
function removeRecords(tabId) {
    records.delete(tabId);
}

/**
 * Add new record of resolved request.
 * @param request
 */
function addRecord(request) {
    let record = {
        action: request.action,
        tabId: request.tabId,
        type: request.type,
        url: request.url,
        target: request.redirectUrl,
        timestamp: request.timeStamp
    };
    let recordsForTab = records.get(request.tabId);
    if (!recordsForTab) {
        recordsForTab = [];
        records.set(request.tabId, recordsForTab);
    }
    recordsForTab.push(record);
    updateBrowserAction(record.tabId, record.action, recordsForTab.length.toString());
}

/**
 * Update browserAction icon, title and badgeText.
 * @param tabId
 * @param action for icon
 * @param badgeText number of resolved request on current web navigation cycle.
 */
function updateBrowserAction(tabId, action, badgeText) {
    browser.browserAction.setIcon({
        tabId: tabId,
        path: {
            19: "icons/icon-" + action + "@19.png",
            38: "icons/icon-" + action + "@38.png"
        }
    });
    browser.browserAction.setTitle({
        tabId: tabId,
        title: browser.i18n.getMessage("title_" + action)
    });
    browser.browserAction.setBadgeText({
        tabId: tabId,
        text: badgeText
    });
}

/**
 * Remove records on tab removal.
 */
browser.tabs.onRemoved.addListener(removeRecords);

/**
 * Remove records before starting a new top frame web navigation.
 */
browser.webNavigation.onBeforeNavigate.addListener(function (details) {
    if (details.frameId == 0) {
        removeRecords(details.tabId);
    }
});

/**
 *  Get records on message from browserAction. getRecords returns a promise
 *  that is returned as asynchronous response.
 */
browser.runtime.onMessage.addListener(getRecords);

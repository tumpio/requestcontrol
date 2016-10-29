const myOptionsManager = new OptionsManager();
const tldStarPattern = /^(.+)\.\*$/;
const redirectUrlPattern = /^https?:\/\/.+(https?)(:\/\/|%3A\/\/|%3A%2F%2F)(.+)$/;
const requestListeners = [];

function requestAction(action, redirectUrl) {
    switch (action) {
        case "filter":
            return function (request) {
                if (request.method != "GET" || request.tabId == -1) {
                    return;
                }
                let redirectUrl = parseRedirectUrl(request.url);
                if (redirectUrl.length < request.url.length) {
                    browser.webNavigation.onCommitted.addListener(showPageAction, {
                        url: [{
                            urlContains: redirectUrl
                        }]
                    });
                    browser.tabs.update(request.tabId, {
                        url: parseRedirectUrl(request.url)
                    });
                    return {
                        cancel: true
                    };
                }
            };
        case "block":
            return function (request) {
                browser.webNavigation.onCommitted.addListener(showPageAction);
                return {
                    cancel: true
                };
            };
        case "redirect":
            return function (request) {
                browser.webNavigation.onCommitted.addListener(showPageAction, {
                    url: [{
                        urlContains: redirectUrl
                    }]
                });
                return {
                    redirectUrl: redirectUrl
                };
            };
    }
}

function showPageAction(details) {
    browser.pageAction.show(details.tabId);
}

function redirectUrlReplacer(match, p1, p2, p3, offset, string) {
    if (p2[0] == "%") {
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
        if (urlParts[i].length == 0) {
            urlParts.splice(i, 1);
        }
    }
    return urlParts.join("?");
}

function resolveUrls(pattern) {
    let urls = [];
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

function addListeners() {
    let filter, listener;
    for (let rule of myOptionsManager.options.rules) {
        if (!rule.active) {
            continue;
        }
        filter = {
            urls: resolveUrls(rule.pattern),
            types: rule.types
        };
        listener = new requestAction(rule.action, rule.redirectUrl || null);
        browser.webRequest.onBeforeRequest.addListener(listener, filter, ["blocking"]);
        requestListeners.push(listener);
    }
}

function init() {
    removePreviousListeners();
    addListeners();
}

myOptionsManager.loadOptions(init);
myOptionsManager.onChanged(init);

var myOptionsManager = new OptionsManager();
const tldStarPattern = /^(\*:\/\/[^\/]+).\*\//;
const redirectUrlPattern = /https?:\/\/.+(https?)(:\/\/|%3A\/\/|%3A%2F%2F)(.+)/;

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

function redirect(request) {
    if (request.method != "GET" || request.tabId == -1) {
        return;
    }
    let redirectUrl = parseRedirectUrl(request.url);
    if (redirectUrl.length < request.url.length) {
        chrome.tabs.update(request.tabId, {url: parseRedirectUrl(request.url)});
        return {
            cancel: true
        };
    }
}

function resolveUrls(rules) {
    let urls = [];
    for (let rule of rules) {
        if (tldStarPattern.test(rule.pattern)) {
            for (let TLD of rule.TLDs) {
                urls.push(rule.pattern.replace(tldStarPattern, "$1." + TLD + "/"));
            }
        } else {
            urls.push(rule.pattern);
        }
    }
    return urls;
}

function init() {
    chrome.webRequest.onBeforeRequest.removeListener(redirect);
    chrome.webRequest.onBeforeRequest.addListener(redirect, {
        urls: resolveUrls(myOptionsManager.options.rules),
        types: [
            "main_frame",
            "sub_frame"
        ]
    }, ["blocking"]);
}

myOptionsManager.loadOptions(init);
myOptionsManager.onChanged(init);

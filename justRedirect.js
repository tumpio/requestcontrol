var myOptionsManager = new OptionsManager();
var options;
const redirectUrlPattern = /https?:\/\/.+(https?)(:\/\/|%3A\/\/|%3A%2F%2F)(.+)/;

function redirectUrlReplacer(match, p1, p2, p3, offset, string) {
    if (p2[0] == "%") {
        p2 = unescape(p2);
    }
    if (/(%26|%2F)/.test(p3)) {
        p3 = p3.replace(/&.+/, "");
    }
    return p1 + p2 + filterNonwantedQueryParams(unescape(p3));
}

function parseRedirectUrl(url) {
    return url.replace(redirectUrlPattern, redirectUrlReplacer);
}

function filterQuery(query) {
    let queryParam = query.split("=")[0];
    return !options.queryParams.includes(queryParam);
}

function filterNonwantedQueryParams(url) {
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
    if (request.method == "GET") {
        return {
            redirectUrl: parseRedirectUrl(request.url)
        };
    }
}

myOptionsManager.loadOptions().then(result => {
    options = myOptionsManager.handleLoadedOptions(result);
    chrome.webRequest.onBeforeRequest.addListener(redirect, {
        urls: options.urls,
        types: [
            "main_frame"
        ]
    }, ["blocking"]);
});

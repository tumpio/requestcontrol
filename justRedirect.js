var myOptionsManager = new OptionsManager();
const subDomains = ["com", "ad", "ae", "com.af", "com.ag", "com.ai", "al", "am", "co.ao", "com.ar", "as", "at", "com.au", "az", "ba", "com.bd", "be", "bf", "bg", "com.bh", "bi", "bj", "com.bn", "com.bo", "com.br", "bs", "bt", "co.bw", "by", "com.bz", "ca", "cd", "cf", "cg", "ch", "ci", "co.ck", "cl", "cm", "cn", "com.co", "co.cr", "com.cu", "cv", "com.cy", "cz", "de", "dj", "dk", "dm", "com.do", "dz", "com.ec", "ee", "com.eg", "es", "com.et", "fi", "com.fj", "fm", "fr", "ga", "ge", "gg", "com.gh", "com.gi", "gl", "gm", "gp", "gr", "com.gt", "gy", "com.hk", "hn", "hr", "ht", "hu", "co.id", "ie", "co.il", "im", "co.in", "iq", "is", "it", "je", "com.jm", "jo", "co.jp", "co.ke", "com.kh", "ki", "kg", "co.kr", "com.kw", "kz", "la", "com.lb", "li", "lk", "co.ls", "lt", "lu", "lv", "com.ly", "co.ma", "md", "me", "mg", "mk", "ml", "com.mm", "mn", "ms", "com.mt", "mu", "mv", "mw", "com.mx", "com.my", "co.mz", "com.na", "com.nf", "com.ng", "com.ni", "ne", "nl", "no", "com.np", "nr", "nu", "co.nz", "com.om", "com.pa", "com.pe", "com.pg", "com.ph", "com.pk", "pl", "pn", "com.pr", "ps", "pt", "com.py", "com.qa", "ro", "ru", "rw", "com.sa", "com.sb", "sc", "se", "com.sg", "sh", "si", "sk", "com.sl", "sn", "so", "sm", "sr", "st", "com.sv", "td", "tg", "co.th", "com.tj", "tk", "tl", "tm", "tn", "to", "com.tr", "tt", "com.tw", "co.tz", "com.ua", "co.ug", "co.uk", "com.uy", "co.uz", "com.vc", "co.ve", "vg", "co.vi", "com.vn", "vu", "ws", "rs", "co.za", "co.zm", "co.zw", "cat"];
const subDomainStarPattern = /^(\*:\/\/[^\/]+).\*\//;
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

function resolveSubDomainPatterns(matchPatterns) {
    let patterns = [];
    for (let pattern of matchPatterns) {
        if (subDomainStarPattern.test(pattern)) {
            for (let subDomain of subDomains) {
                patterns.push(pattern.replace(subDomainStarPattern, "$1." + subDomain + "/"));
            }
        } else {
            patterns.push(pattern);
        }
    }
    return patterns;
}

function init() {
    chrome.webRequest.onBeforeRequest.removeListener(redirect);
    chrome.webRequest.onBeforeRequest.addListener(redirect, {
        urls: resolveSubDomainPatterns(myOptionsManager.options.urls),
        types: [
            "main_frame",
            "sub_frame"
        ]
    }, ["blocking"]);
}

myOptionsManager.loadOptions(init);
myOptionsManager.onChanged(init);

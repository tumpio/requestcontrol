import {ControlRule, FILTER_ACTION} from "./base.js";
import {createRegexpPattern} from "./api.js";
import {processRedirectRules} from "./redirect.js";
import {DomainMatcher} from "./matchers.js";

export class FilterRule extends ControlRule {
    constructor(uuid, paramsFilter, removeQueryString, skipInlineUrlFilter, skipOnSameDomain, matcher) {
        super(uuid, matcher);
        this.queryParamsPattern = (paramsFilter) ? createRegexpPattern(paramsFilter.values) : "";
        this.invertQueryFilter = (paramsFilter) ? paramsFilter.invert : false;
        this.removeQueryString = removeQueryString;
        this.skipInlineUrlFilter = skipInlineUrlFilter;
        this.skipOnSameDomain = skipOnSameDomain;
    }

    apply(requestURL) {
        // Trim unwanted query parameters before parsing inline url
        if (!this.removeQueryString && this.queryParamsPattern && requestURL.search.length > 0) {
            requestURL.search = trimQueryParameters(requestURL.search, this.queryParamsPattern,
                this.invertQueryFilter);
        }
        if (!this.skipInlineUrlFilter) {
            let redirectionUrl = parseInlineUrl(requestURL.href);
            if (redirectionUrl) {
                if (this.skipOnSameDomain && DomainMatcher.testUrls(requestURL.href, redirectionUrl)) {
                    return requestURL;
                }
                requestURL.href = redirectionUrl;
            }
        }
        if (this.removeQueryString) {
            requestURL.search = "";
        } else if (this.queryParamsPattern && requestURL.search.length > 0) {
            requestURL.search = trimQueryParameters(requestURL.search, this.queryParamsPattern,
                this.invertQueryFilter);
        }
        return requestURL;
    }
}

FilterRule.prototype.priority = -2;
FilterRule.prototype.action = FILTER_ACTION;
FilterRule.prototype.resolve = processRedirectRules;

/**
 * Parser for inline redirection url.
 * @param url
 * @returns {string}
 */
export function parseInlineUrl(url) {
    let i = url.indexOf("http", 1);

    if (i < 0) {
        return null;
    }

    let inlineUrl = url.slice(i);

    // extract redirection url from a query parameter
    if (url.charAt(i - 1) === "=") {
        inlineUrl = inlineUrl.replace(/[&;].*/, "");
    }

    let j = 4;
    if (inlineUrl.charAt(j) === "s") {
        j++;
    }
    if (inlineUrl.startsWith("%3", j)) {
        inlineUrl = inlineUrl.replace(/\?.*/, "");
    }

    inlineUrl = decodeURIComponent(inlineUrl);

    if (!inlineUrl.startsWith("://", j)) {
        return null;
    }

    return inlineUrl;
}

export function trimQueryParameters(queryString, trimPattern, invert) {
    let trimmedQuery = "";
    let queries = queryString.substring(1).split("?");

    for (let query of queries) {
        let searchParams = query.split("&");
        let i = searchParams.length;
        if (invert) {
            while (i--) {
                if (!trimPattern.test(searchParams[i].split("=")[0])) {
                    searchParams.splice(i, 1);
                }
            }
        } else {
            while (i--) {
                if (trimPattern.test(searchParams[i].split("=")[0])) {
                    searchParams.splice(i, 1);
                }
            }
        }
        if (searchParams.length > 0) {
            trimmedQuery += "?" + searchParams.join("&");
        }
    }
    return trimmedQuery;
}

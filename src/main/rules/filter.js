/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createRegexpPattern } from "../api.js";
import { BaseRedirectRule } from "./redirect.js";
import { DomainMatcher } from "../matchers.js";
import { parseInlineUrl, trimQueryParameters, UrlParser } from "../url.js";

export class FilterRule extends BaseRedirectRule {
    constructor({
        uuid,
        tag,
        paramsFilter = null,
        trimAllParams = false,
        skipRedirectionFilter = false,
        skipOnSameDomain = false,
        redirectDocument = false
    } = {}, matcher) {
        super({ uuid, tag, redirectDocument }, matcher);
        this.queryParamsPattern = (paramsFilter) ? createRegexpPattern(paramsFilter.values) : null;
        this.invertQueryTrimming = (paramsFilter) ? paramsFilter.invert : false;
        this.removeQueryString = trimAllParams;
        this.skipInlineUrlParsing = skipRedirectionFilter;
        this.skipOnSameDomain = skipOnSameDomain;
    }

    apply(url) {
        let trimmedUrl = this.filterQueryParameters(url);
        if (this.skipInlineUrlParsing) {
            return trimmedUrl;
        }
        return this.filterInlineUrl(trimmedUrl);
    }

    filterQueryParameters(url) {
        if (this.removeQueryString) {
            let parser = new UrlParser(url);
            parser.search = "";
            return parser.href;
        }
        return trimQueryParameters(url, this.queryParamsPattern, this.invertQueryTrimming);
    }

    filterInlineUrl(url) {
        let inlineUrl = parseInlineUrl(url);
        if (inlineUrl == null
            || this.skipOnSameDomain && DomainMatcher.testUrls(url, inlineUrl)) {
            return url;
        }
        return inlineUrl;
    }
}

FilterRule.icon = "/icons/icon-filter.svg";
FilterRule.action = "filter";

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {ControlRule, FILTER_ACTION} from "./base.js";
import {createRegexpPattern} from "./api.js";
import {processRedirectRules} from "./redirect.js";
import {DomainMatcher} from "./matchers.js";
import {parseInlineUrl, trimQueryParameters, UrlParser} from "./url.js";

export class FilterRule extends ControlRule {
    constructor(uuid, paramsFilter, removeQueryString, skipInlineUrlFilter, skipOnSameDomain, matcher) {
        super(uuid, matcher);
        this.queryParamsPattern = (paramsFilter) ? createRegexpPattern(paramsFilter.values) : "";
        this.invertQueryFilter = (paramsFilter) ? paramsFilter.invert : false;
        this.removeQueryString = removeQueryString;
        this.skipInlineUrlFilter = skipInlineUrlFilter;
        this.skipOnSameDomain = skipOnSameDomain;
    }

    apply(url) {
        let filteredUrl = url;
        // Trim unwanted query parameters before parsing inline url
        if (!this.removeQueryString) {
            filteredUrl = trimQueryParameters(url, this.queryParamsPattern, this.invertQueryFilter);
        }
        if (!this.skipInlineUrlFilter) {
            let inlineUrl = parseInlineUrl(filteredUrl);
            if (inlineUrl != null) {
                if (this.skipOnSameDomain && DomainMatcher.testUrls(url, inlineUrl)) {
                    return filteredUrl;
                }
                filteredUrl = inlineUrl;
            }
        }
        if (this.removeQueryString) {
            let parser = new UrlParser(filteredUrl);
            parser.search = "";
            return parser.href;
        }
        return trimQueryParameters(filteredUrl, this.queryParamsPattern, this.invertQueryFilter);
    }
}

FilterRule.prototype.priority = -2;
FilterRule.prototype.action = FILTER_ACTION;
FilterRule.prototype.resolve = processRedirectRules;

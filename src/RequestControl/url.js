/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import { getDomain } from "../../lib/tldts/tldts-experimental.esm.js";

const tldtsOptions = {
    extractHostname: false,
    validateHostname: false,
    detectIp: false
};

export const libTld = {
    getDomain: function (url) {
        let hostname = extractHostname(url);
        if (isIp(hostname)) {
            return hostname;
        }
        return getDomain(hostname, tldtsOptions);
    }
};

export class UrlParser {

    constructor(url) {
        this.url = url;
    }

    get href() {
        return this.url;
    }

    set href(value) {
        this.url = value;
    }

    get protocol() {
        let { start, end } = getSchemeStartEnd(this.url);
        return this.url.slice(start, end);
    }

    set protocol(value) {
        let { start, end } = getSchemeStartEnd(this.url);
        if (value.endsWith(":"))
            this.url = this.url.slice(0, start) + value + this.url.slice(end);
        else
            this.url = this.url.slice(0, start) + value + ":" + this.url.slice(end);
    }

    get username() {
        let { start, end } = getAuthStartEnd(this.url);
        let auth = this.url.slice(start, end);
        let i = auth.indexOf(":");
        if (i === -1)
            return auth.slice(0, -1);
        else
            return auth.slice(0, i);
    }

    set username(value) {
        let { start, end } = getAuthStartEnd(this.url);
        let auth = this.url.slice(start, end);
        let newAuth = value;
        let i = auth.indexOf(":");
        if (i !== -1)
            newAuth += auth.slice(i);
        if (newAuth.endsWith("@"))
            this.url = this.url.slice(0, start) + newAuth + this.url.slice(end);
        else
            this.url = this.url.slice(0, start) + newAuth + "@" + this.url.slice(end);
    }

    get password() {
        let { start, end } = getAuthStartEnd(this.url);
        let auth = this.url.slice(start, end);
        let i = auth.indexOf(":");
        if (i === -1)
            return "";
        else
            return auth.slice(i + 1, -1);
    }

    set password(value) {
        let { start, end } = getAuthStartEnd(this.url);
        let auth = this.url.slice(start, end);
        if (auth.length > 0) {
            let [user,] = auth.slice(0, -1).split(":", 2);
            this.url = this.url.slice(0, start) + user + ":" + value + "@" + this.url.slice(end);
        }
    }

    get origin() {
        return this.protocol + "//" + this.host;
    }

    get host() {
        let { start, end } = getHostStartEnd(this.url);
        return this.url.slice(start, end);
    }

    set host(value) {
        let { start, end } = getHostStartEnd(this.url);
        this.url = this.url.slice(0, start) + value + this.url.slice(end);
    }

    get hostname() {
        return extractHostname(this.url);
    }

    set hostname(value) {
        let { start, end } = getHostnameStartEnd(this.url);
        this.url = this.url.slice(0, start) + value + this.url.slice(end);
    }

    get port() {
        let { start, end } = getPortStartEnd(this.url);
        return this.url.slice(start, end);
    }

    set port(value) {
        let { start, end } = getPortStartEnd(this.url);
        if (value.startsWith(":"))
            this.url = this.url.slice(0, start) + value + this.url.slice(end);
        else
            this.url = this.url.slice(0, start) + ":" + value + this.url.slice(end);
    }

    get pathname() {
        let { start, end } = getPathStartEnd(this.url);
        if (start === end) {
            return "/";
        } else {
            return this.url.slice(start, end);
        }
    }

    set pathname(value) {
        let { start, end } = getPathStartEnd(this.url);
        if (value.startsWith("/"))
            this.url = this.url.slice(0, start) + value + this.url.slice(end);
        else
            this.url = this.url.slice(0, start) + "/" + value + this.url.slice(end);
    }

    get search() {
        let { start, end } = getSearchStartEnd(this.url);
        return this.url.slice(start, end);
    }

    set search(value) {
        let { start, end } = getSearchStartEnd(this.url);
        if (value === "")
            this.url = this.url.slice(0, start) + this.url.slice(end);
        else if (value.startsWith("?"))
            this.url = this.url.slice(0, start) + value + this.url.slice(end);
        else
            this.url = this.url.slice(0, start) + "?" + value + this.url.slice(end);
    }

    get hash() {
        let start = getHashStart(this.url);
        return this.url.slice(start);
    }

    set hash(value) {
        let start = getHashStart(this.url);
        if (value === "")
            this.url = this.url.slice(0, start);
        else if (value.startsWith("#"))
            this.url = this.url.slice(0, start) + value;
        else
            this.url = this.url.slice(0, start) + "#" + value;
    }
}

export class QueryParser extends UrlParser {

    constructor(url) {
        super(url);
        this.query = super.search;
    }

    getKeyStart(key) {
        let start = this.query.indexOf(key);
        if (start === -1 || (start > 0 && this.query.charAt(start - 1) !== "?" && this.query.charAt(start - 1) !== "&"))
            return undefined;
        return start;
    }

    getKeyEnd(key) {
        let start = this.getKeyStart(key);
        if (typeof start === "undefined")
            return undefined;
        let end = key.length + 1;
        if (end < this.query.length && "#&?=".indexOf(this.query.charAt(end)) === -1)
            return undefined;
        return end;
    }

    getValueEnd(keyEnd) {
        let end = keyEnd + 1;
        for (; end < this.query.length; end++)
            if (this.query.charAt(end) === "&" || this.query.charAt(end) === "?"
                || this.query.charAt(end) === "#")
                break;
        return end;
    }

    getValueStartEnd(key) {
        let start = this.getKeyStart(key);
        if (typeof start === "undefined" || this.query.charAt(start + key.length) !== "=")
            return undefined;
        start += key.length + 1;
        return { start, end: this.getValueEnd(start) };
    }

    get(key) {
        let startEnd = this.getValueStartEnd(key);
        if (typeof startEnd === "undefined")
            return "";
        else
            return this.query.slice(startEnd.start, startEnd.end);
    }

    set(key, value) {
        let keyEnd = this.getKeyEnd(key);
        if (typeof keyEnd === "undefined") {
            if (this.query.length === 0 || this.query.endsWith("?") || this.query.endsWith("&"))
                this.query += key + "=" + value;
            else
                this.query += "&" + key + "=" + value;
            return;
        }
        let valueEnd = this.getValueEnd(keyEnd);
        if (valueEnd === keyEnd + 1) {
            if (this.query.charAt(keyEnd) === "=")
                this.query = this.query.slice(0, valueEnd) + value + this.query.slice(valueEnd);
            else
                this.query = this.query.slice(0, keyEnd) + "=" + value + this.query.slice(keyEnd);
        } else {
            this.query = this.query.slice(0, keyEnd) + "=" + value + this.query.slice(valueEnd);
        }
    }

    get href() {
        super.search = this.query;
        return super.href;
    }
}

export const URL_PARAMETERS = Object.getOwnPropertyNames(UrlParser.prototype).filter(x => x !== "constructor");

export function extractHostname(url) {
    let { start, end } = getHostnameStartEnd(url);
    return url.slice(start, end);
}

function getHostnameStartEnd(url) {
    let i = 0;
    let hostname_begin = 0;
    let hostname_end = url.length;
    let auth = false;
    let port = false;
    if (url.startsWith("//")) {
        i = 2;
        hostname_begin = i;
    } else {
        for (; i < url.length; i++) {
            if (url.charAt(i) === ":" &&
                url.charAt(i + 1) === "/" &&
                url.charAt(i + 2) === "/") {
                i = i + 3;
                hostname_begin = i;
                break;
            }
        }
        if (hostname_begin === 0) {
            i = 0;
        }
    }
    if (url.charAt(hostname_begin) === "[") {
        hostname_begin = i;
        for (; i < url.length; i++) {
            if (url.charAt(i) === "]") {
                hostname_end = i + 1;
                return { start: hostname_begin, end: hostname_end };
            }
        }
    }
    for (; i < url.length; i++) {
        if (url.charAt(i) === "/") {
            if (!port) {
                hostname_end = i;
            }
            break;
        } else if (url.charAt(i) === "@") {
            auth = true;
            port = false;
            hostname_begin = i + 1;
            if (hostname_end < hostname_begin) {
                hostname_end = url.length;
            }
            if (url.charAt(hostname_begin) === "[") {
                i += 1;
                hostname_begin = i;
                for (; i < url.length; i++) {
                    if (url.charAt(i) === "]") {
                        hostname_end = i + 1;
                        return { start: hostname_begin, end: hostname_end };
                    }
                }
            }
        } else if (url.charAt(i) === ":") {
            hostname_end = i;
            if (auth) {
                break;
            }
            port = true;
        }
    }
    return { start: hostname_begin, end: hostname_end };
}

function getPortStartEnd(url) {
    let { end: start } = getHostnameStartEnd(url);
    if (url.charAt(start) !== ":")
        return { start, end: start };
    let end = start + 1;
    for (; end < url.length; end++) {
        if (url.charAt(end) === "/")
            break;
    }
    return { start, end };
}

function getHostStartEnd(url) {
    let { start, end: hostnameEnd } = getHostnameStartEnd(url);
    if (url.charAt(hostnameEnd) !== ":")
        return { start, end: hostnameEnd };
    let end = start + 1;
    for (; end < url.length; end++) {
        if (url.charAt(end) === "/")
            break;
    }
    return { start, end };
}

export function getAuthStartEnd(url) {
    let { start: hostStart } = getHostnameStartEnd(url);
    if (url.charAt(hostStart - 1) !== "@")
        return { start: hostStart, end: hostStart };
    let { end: schemeEnd } = getProtocolStartEnd(url);
    return { start: schemeEnd, end: hostStart };
}

export function getPathStartEnd(url) {
    let { end: protocolEnd } = getProtocolStartEnd(url);
    let start = url.indexOf("/", protocolEnd);
    let end = url.length;
    if (start === -1) {
        return { start: end, end };
    } else {
        for (end = start + 1; end < url.length; end++) {
            if (url.charAt(end) === "?" || url.charAt(end) === "#") {
                break;
            }
        }
        return { start, end };
    }
}

export function getSchemeStartEnd(url) {
    let start = 0;
    let end = url.indexOf("://");
    if (end === -1) {
        return { start, end: start };
    } else {
        return { start, end: end + 1 };
    }
}

export function getProtocolStartEnd(url) {
    let start = 0;
    let end = url.indexOf("://");
    if (end === -1) {
        return { start, end: start };
    } else {
        return { start, end: end + 3 };
    }
}

export function getSearchStartEnd(url) {
    let start = url.indexOf("?");
    let end = getHashStart(url);
    if (start === -1) {
        return { start: end, end };
    } else {
        return { start, end };
    }
}

export function getHashStart(url) {
    let start = url.indexOf("#");
    return start !== -1 ? start : url.length;
}

export function trimQueryParameters(url, trimPattern, invert = false) {
    if (!trimPattern) {
        return url;
    }
    let parser = new UrlParser(url);
    let query = parser.search;
    if (query.length < 2) {
        return url;
    }
    let queries = query.substring(1).split("?");
    let trimmedQuery = "";
    let trimmed = false;
    for (let query of queries) {
        let searchParams = query.split("&");
        let i = searchParams.length;
        while (i--) {
            if (trimPattern.test(searchParams[i].split("=")[0]) !== invert) {
                searchParams.splice(i, 1);
                trimmed = true;
            }
        }
        if (searchParams.length > 0) {
            if (trimmed)
                trimmedQuery += "?" + searchParams.join("&");
            else
                trimmedQuery += "?" + query;
        }
    }
    if (trimmed)
        parser.search = trimmedQuery;
    return parser.href;
}

/**
 * Parser for inline redirection url.
 * @param url
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

function isProbablyIpv4(hostname) {
    let numberOfDots = 0;
    if (hostname.length < 7
        || !isDigitCode(hostname.charCodeAt(0))
        || !isDigitCode(hostname.charCodeAt(hostname.length - 1))) {
        return false;
    }
    for (let i = 1; i < hostname.length - 1; i += 1) {
        let code = hostname.charCodeAt(i);
        if (code === 46) {
            numberOfDots += 1;
        } else if (!isDigitCode(code)) {
            return false;
        }
    }
    return numberOfDots === 3;
}

function isDigitCode(c) {
    return c >= 48 && c <= 57;
}

function isProbablyIpv6(hostname) {
    return hostname.startsWith("[");
}

function isIp(hostname) {
    return isProbablyIpv6(hostname) || isProbablyIpv4(hostname);
}

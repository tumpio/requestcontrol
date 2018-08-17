import "../../lib/tldjs/tld.js"

// For unit tests under node
const tldjs = (typeof window !== "undefined") ? window.tldjs : require("tldjs");

export const libTld = tldjs.fromUserSettings({
    extractHostname: extractHostname
});

export function extractHostname(url) {
    let i = 0;
    let hostname_begin = 0;
    let hostname_end = url.length;
    let auth = false;
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
        i += 1;
        hostname_begin = i;
        for (; i < url.length; i++) {
            if (url.charAt(i) === "]") {
                hostname_end = i;
                return url.substring(hostname_begin, hostname_end);
            }
        }
    }
    for (; i < url.length; i++) {
        if (url.charAt(i) === "/") {
            hostname_end = i;
            break;
        } else if (url.charAt(i) === "@") {
            auth = true;
            hostname_begin = i + 1;
            if (hostname_end < hostname_begin) {
                hostname_end = url.length;
            }
            if (url.charAt(hostname_begin) === "[") {
                i += 2;
                hostname_begin = i;
                for (; i < url.length; i++) {
                    if (url.charAt(i) === "]") {
                        hostname_end = i;
                        return url.substring(hostname_begin, hostname_end);
                    }
                }
            }
        } else if (url.charAt(i) === ":") {
            hostname_end = i;
            if (auth) {
                break;
            }
        }
    }
    return url.substring(hostname_begin, hostname_end);
}

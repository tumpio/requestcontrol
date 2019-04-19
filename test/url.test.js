import test from "ava";
import {UrlParser, QueryParser} from "../src/RequestControl/url.js";

test("href - get", t => {
    let url = "https://domain.com";
    t.is(new UrlParser(url).href, url);
});


test("href - set", t => {
    let url = "https://foo.com";
    let url2 = "http://domain.com";
    let parser = new UrlParser(url);
    parser.href = url2;
    t.is(parser.href, url2);
});

test("protocol - get", t => {
    t.is(new UrlParser("https://domain.com").protocol, "https:");
    t.is(new UrlParser("http://domain.com").protocol, "http:");
    t.is(new UrlParser("://domain.com").protocol, ":");
    t.is(new UrlParser("domain.com").protocol, "");
});

test("protocol - set", t => {
    let url = "https://domain.com";
    let url2 = "http://domain.com";
    let parser = new UrlParser(url);
    parser.protocol = "http";
    t.is(parser.href, url2);
});

test("protocol - set with colon", t => {
    let url = "https://domain.com";
    let url2 = "data://domain.com";
    let parser = new UrlParser(url);
    parser.protocol = "data:";
    t.is(parser.href, url2);
});

test("username - get", t => {
    t.is(new UrlParser("https://domain.com").username, "");
    t.is(new UrlParser("https://user@domain.com").username, "user");
    t.is(new UrlParser("https://user:@domain.com").username, "user");
    t.is(new UrlParser("https://user:pass@domain.com").username, "user");
});

test("username - set", t => {
    let parser = new UrlParser("https://domain.com");
    parser.username = "user";
    t.is(parser.href, "https://user@domain.com");
});

test("username - set with password", t => {
    let parser = new UrlParser("https://user:pass@domain.com");
    parser.username = "other";
    t.is(parser.href, "https://other:pass@domain.com");
});

test("password - get", t => {
    t.is(new UrlParser("https://domain.com").password, "");
    t.is(new UrlParser("https://user@domain.com").password, "");
    t.is(new UrlParser("https://user:@domain.com").password, "");
    t.is(new UrlParser("https://user:pass@domain.com").password, "pass");
    t.is(new UrlParser("https://user:pass:@domain.com").password, "pass:");
});

test("password - set", t => {
    let parser = new UrlParser("https://domain.com");
    parser.password = "pass";
    t.is(parser.href, "https://domain.com");
});

test("password - set same with user", t => {
    let parser = new UrlParser("https://user@domain.com");
    parser.password = "pass";
    t.is(parser.href, "https://user:pass@domain.com");
});

test("password - set new with user", t => {
    let parser = new UrlParser("https://user:pass@domain.com");
    parser.password = "other";
    t.is(parser.href, "https://user:other@domain.com");
});

test("hostname - get", t => {
    t.is(new UrlParser("//example.com").hostname, "example.com");
    t.is(new UrlParser("http://example.com").hostname, "example.com");
    t.is(new UrlParser("http://example.com/").hostname, "example.com");
    t.is(new UrlParser("").hostname, "");
    t.is(new UrlParser("example").hostname, "example");
    t.is(new UrlParser("example.com").hostname, "example.com");
    t.is(new UrlParser("example.com:8080").hostname, "example.com");
    t.is(new UrlParser("user:pass@example.com:8080").hostname, "example.com");
    t.is(new UrlParser("example.com/").hostname, "example.com");
    t.is(new UrlParser("http://example.com/path").hostname, "example.com");
    t.is(new UrlParser("http://example.com:1234/path#asd").hostname, "example.com");
    t.is(new UrlParser("http://user:pass@example.com/path").hostname, "example.com");
    t.is(new UrlParser("http://user:pass@example.com:8080/path").hostname, "example.com");
    t.is(new UrlParser("http://user:pass@example.com:8080").hostname, "example.com");
    t.is(new UrlParser("http://user:pass@example.com:8080/").hostname, "example.com");
    t.is(new UrlParser("https://user:pass@example.com:8080/").hostname, "example.com");
    t.is(new UrlParser("https://user:pass@example.com:8080/").hostname, "example.com");
    t.is(new UrlParser("https://pass@example.com:8080/").hostname, "example.com");
    t.is(new UrlParser("https://user@example.com:8080/").hostname, "example.com");
    t.is(new UrlParser("https://user@example.com/").hostname, "example.com");
    t.is(new UrlParser("http://[2001:0db8:85a3:0000:0000:8a2e:0370:7334]").hostname,
        "[2001:0db8:85a3:0000:0000:8a2e:0370:7334]");
    t.is(new UrlParser("http://user:pass@[::1]/segment/index.html?query#frag").hostname,
        "[::1]");
    t.is(new UrlParser("http://[::1]").hostname, "[::1]");
    t.is(new UrlParser("http://[::1]:8080").hostname, "[::1]");
    t.is(new UrlParser("http://[1080::8:800:200C:417A]:100/foo").hostname,
        "[1080::8:800:200C:417A]");
    t.is(new UrlParser("http://192.168.0.1/").hostname, "192.168.0.1");
    t.is(new UrlParser("http://192.168.0.1:8080/").hostname, "192.168.0.1");
    t.is(new UrlParser("http://192.168.0.1:8080/path?asd=asd#asd").hostname, "192.168.0.1");
});

test("host - get", t => {
    t.is(new UrlParser("//example.com").host, "example.com");
    t.is(new UrlParser("http://example.com").host, "example.com");
    t.is(new UrlParser("http://example.com/").host, "example.com");
    t.is(new UrlParser("").host, "");
    t.is(new UrlParser("example").host, "example");
    t.is(new UrlParser("example.com").host, "example.com");
    t.is(new UrlParser("example.com:8080").host, "example.com:8080");
    t.is(new UrlParser("user:pass@example.com:8080").host, "example.com:8080");
    t.is(new UrlParser("example.com/").host, "example.com");
    t.is(new UrlParser("http://example.com/path").host, "example.com");
    t.is(new UrlParser("http://example.com:1234/path#asd").host, "example.com:1234");
    t.is(new UrlParser("http://user:pass@example.com/path").host, "example.com");
    t.is(new UrlParser("http://user:pass@example.com:8080/path").host, "example.com:8080");
    t.is(new UrlParser("http://user:pass@example.com:8080").host, "example.com:8080");
    t.is(new UrlParser("http://user:pass@example.com:8080/").host, "example.com:8080");
    t.is(new UrlParser("https://user:pass@example.com:8080/").host, "example.com:8080");
    t.is(new UrlParser("https://user:pass@example.com:8080/").host, "example.com:8080");
    t.is(new UrlParser("https://pass@example.com:8080/").host, "example.com:8080");
    t.is(new UrlParser("https://user@example.com:8080/").host, "example.com:8080");
    t.is(new UrlParser("https://user@example.com/").host, "example.com");
    t.is(new UrlParser("http://[2001:0db8:85a3:0000:0000:8a2e:0370:7334]").host,
        "[2001:0db8:85a3:0000:0000:8a2e:0370:7334]");
    t.is(new UrlParser("http://user:pass@[::1]/segment/index.html?query#frag").host,
        "[::1]");
    t.is(new UrlParser("http://[::1]").host, "[::1]");
    t.is(new UrlParser("http://[::1]:8080").host, "[::1]:8080");
    t.is(new UrlParser("http://[1080::8:800:200C:417A]:100/foo").host,
        "[1080::8:800:200C:417A]:100");
    t.is(new UrlParser("http://192.168.0.1/").host, "192.168.0.1");
    t.is(new UrlParser("http://192.168.0.1:8080/").host, "192.168.0.1:8080");
    t.is(new UrlParser("http://192.168.0.1:8080/path?asd=asd#asd").host, "192.168.0.1:8080");
});


test("origin - get", t => {
    t.is(new UrlParser("//example.com").origin, "//example.com");
    t.is(new UrlParser("http://example.com").origin, "http://example.com");
    t.is(new UrlParser("http://example.com/").origin, "http://example.com");
    t.is(new UrlParser("http://example.com/path").origin, "http://example.com");
    t.is(new UrlParser("http://example.com:1234/path#asd").origin, "http://example.com:1234");
    t.is(new UrlParser("http://user:pass@example.com/path").origin, "http://example.com");
    t.is(new UrlParser("http://user:pass@example.com:8080/path").origin, "http://example.com:8080");
    t.is(new UrlParser("http://user:pass@example.com:8080").origin, "http://example.com:8080");
    t.is(new UrlParser("http://user:pass@example.com:8080/").origin, "http://example.com:8080");
    t.is(new UrlParser("https://user:pass@example.com:8080/").origin, "https://example.com:8080");
    t.is(new UrlParser("https://user:pass@example.com:8080/").origin, "https://example.com:8080");
    t.is(new UrlParser("https://pass@example.com:8080/").origin, "https://example.com:8080");
    t.is(new UrlParser("https://user@example.com:8080/").origin, "https://example.com:8080");
    t.is(new UrlParser("https://user@example.com/").origin, "https://example.com");
    t.is(new UrlParser("http://[2001:0db8:85a3:0000:0000:8a2e:0370:7334]").origin,
        "http://[2001:0db8:85a3:0000:0000:8a2e:0370:7334]");
    t.is(new UrlParser("http://user:pass@[::1]/segment/index.html?query#frag").origin,
        "http://[::1]");
    t.is(new UrlParser("http://[::1]").origin, "http://[::1]");
    t.is(new UrlParser("http://[::1]:8080").origin, "http://[::1]:8080");
    t.is(new UrlParser("http://[1080::8:800:200C:417A]:100/foo").origin,
        "http://[1080::8:800:200C:417A]:100");
    t.is(new UrlParser("http://192.168.0.1/").origin, "http://192.168.0.1");
    t.is(new UrlParser("http://192.168.0.1:8080/").origin, "http://192.168.0.1:8080");
    t.is(new UrlParser("http://192.168.0.1:8080/path?asd=asd#asd").origin, "http://192.168.0.1:8080");
});

test("hostname - set", t => {
    let parser = new UrlParser("https://domain.com");
    parser.hostname = "other.com";
    t.is(parser.href, "https://other.com");
});

test("hostname - set full", t => {
    let parser = new UrlParser("https://user:pass@domain.com:8080/path?query#hash");
    parser.hostname = "other.com";
    t.is(parser.href, "https://user:pass@other.com:8080/path?query#hash");
});

test("host - set", t => {
    let parser = new UrlParser("https://domain.com");
    parser.host = "other.com";
    t.is(parser.href, "https://other.com");
});

test("host - set with port", t => {
    let parser = new UrlParser("https://user:pass@domain.com:8080/path?query#hash");
    parser.host = "other.com:1234";
    t.is(parser.href, "https://user:pass@other.com:1234/path?query#hash");
});


test("port - get", t => {
    t.is(new UrlParser("https://domain.com").port, "");
    t.is(new UrlParser("https://domain.com:8080").port, ":8080");
    t.is(new UrlParser("https://user:@domain.com:8080").port, ":8080");
    t.is(new UrlParser("https://user:pass@domain.com:8080/lkajsd?sad#asd").port, ":8080");
});

test("port - set", t => {
    let parser = new UrlParser("https://domain.com");
    parser.port = "1234";
    t.is(parser.href, "https://domain.com:1234");
});

test("port - set with colon", t => {
    let parser = new UrlParser("https://domain.com:8080/path");
    parser.port = ":1234";
    t.is(parser.href, "https://domain.com:1234/path");
});

test("path - get", t => {
    t.is(new UrlParser("https://domain.com").pathname, "/");
    t.is(new UrlParser("https://domain.com/").pathname, "/");
    t.is(new UrlParser("https://domain.com:8080/path").pathname, "/path");
    t.is(new UrlParser("https://user:@domain.com/path/path.href?foo=bar#haash").pathname, "/path/path.href");
});

test("path - set same", t => {
    let parser = new UrlParser("https://domain.com");
    parser.pathname = "path";
    t.is(parser.href, "https://domain.com/path");
});

test("path - set new", t => {
    let parser = new UrlParser("https://domain.com/foo");
    parser.pathname = "bar";
    t.is(parser.href, "https://domain.com/bar");
});

test("path - set with slash", t => {
    let parser = new UrlParser("https://domain.com:8080/foo/bar.href?query#hash");
    parser.pathname = "/index.href";
    t.is(parser.href, "https://domain.com:8080/index.href?query#hash");
});

test("search - get", t => {
    t.is(new UrlParser("https://domain.com").search, "");
    t.is(new UrlParser("https://domain.com/?").search, "?");
    t.is(new UrlParser("https://domain.com:8080/path?foo").search, "?foo");
    t.is(new UrlParser("https://domain.com:8080/path?foo?bar").search, "?foo?bar");
    t.is(new UrlParser("https://domain.com:8080/path?foo?bar#hash").search, "?foo?bar");
});

test("search - set", t => {
    let parser = new UrlParser("https://domain.com/foo");
    parser.search = "bar";
    t.is(parser.href, "https://domain.com/foo?bar");
});

test("search - set with question mark", t => {
    let parser = new UrlParser("https://domain.com/foo?query#hash");
    parser.search = "?bar";
    t.is(parser.href, "https://domain.com/foo?bar#hash");
});

test("search - set empty", t => {
    let parser = new UrlParser("https://domain.com/foo?query=bar&foo#hash");
    parser.search = "";
    t.is(parser.href, "https://domain.com/foo#hash");
});


test("hash - get", t => {
    t.is(new UrlParser("https://domain.com").hash, "");
    t.is(new UrlParser("https://domain.com/path?#").hash, "#");
    t.is(new UrlParser("https://domain.com/path?a#b").hash, "#b");
    t.is(new UrlParser("https://domain.com:8080/path?foo#hash").hash, "#hash");
});


test("hash - set", t => {
    let parser = new UrlParser("https://domain.com/foo");
    parser.hash = "bar";
    t.is(parser.href, "https://domain.com/foo#bar");
});

test("hash - set with hash", t => {
    let parser = new UrlParser("https://domain.com/foo?query#hash");
    parser.hash = "#bar";
    t.is(parser.href, "https://domain.com/foo?query#bar");
});

test("hash - set empty", t => {
    let parser = new UrlParser("https://domain.com/foo?query#hash");
    parser.hash = "";
    t.is(parser.href, "https://domain.com/foo?query");
});

test("query parser - get", t => {
    t.is(new QueryParser("https://domain.com/foo#hash").get("foo"), "");
    t.is(new QueryParser("https://domain.com/foo?#hash").get("foo"), "");
    t.is(new QueryParser("https://domain.com/foo?foo#hash").get("foo"), "");
    t.is(new QueryParser("https://domain.com/foo?geefoo=1#hash").get("foo"), "");
    t.is(new QueryParser("https://domain.com/foo?gee=faafoo#hash").get("foo"), "");
    t.is(new QueryParser("https://domain.com/foo?gee=1&feefoo=2#hash").get("foo"), "");
    t.is(new QueryParser("https://domain.com/foo?foo=bar#hash").get("foo"), "bar");
    t.is(new QueryParser("https://domain.com/foo?foo=bar&foo=foo?x=y#hash").get("foo"), "bar");
});

test("query parser - set when no query", t => {
    let parser = new QueryParser("https://domain.com/foo#hash");
    parser.set("foo", "foo");
    t.is(parser.href, "https://domain.com/foo?foo=foo#hash");
});

test("query parser - set when empty query", t => {
    let parser = new QueryParser("https://domain.com/foo?#hash");
    parser.set("foo", "foo");
    t.is(parser.href, "https://domain.com/foo?foo=foo#hash");
});

test("query parser - set when no value", t => {
    let parser = new QueryParser("https://domain.com/foo?foo#hash");
    parser.set("foo", "foo");
    t.is(parser.href, "https://domain.com/foo?foo=foo#hash");
});

test("query parser - set when empty value", t => {
    let parser = new QueryParser("https://domain.com/foo?foo=#hash");
    parser.set("foo", "foo");
    t.is(parser.href, "https://domain.com/foo?foo=foo#hash");
});

test("query parser - set when value", t => {
    let parser = new QueryParser("https://domain.com/foo?foo=bar#hash");
    parser.set("foo", "foo");
    t.is(parser.href, "https://domain.com/foo?foo=foo#hash");
});

test("query parser - set when has query parameter same begin", t => {
    let parser = new QueryParser("https://domain.com/foo?fooo=bar#hash");
    parser.set("foo", "foo");
    t.is(parser.href, "https://domain.com/foo?fooo=bar&foo=foo#hash");
});

test("query parser - set when has query parameter same end", t => {
    let parser = new QueryParser("https://domain.com/foo?afoo=bar#hash");
    parser.set("foo", "foo");
    t.is(parser.href, "https://domain.com/foo?afoo=bar&foo=foo#hash");
});

test("query parser - set when has multiple query parameters", t => {
    let parser = new QueryParser("https://domain.com/foo?afoo=1&afoo=2#hash");
    parser.set("foo", "foo");
    t.is(parser.href, "https://domain.com/foo?afoo=1&afoo=2&foo=foo#hash");
});

test("query parser - set when has multiple query parameters with value equals key", t => {
    let parser = new QueryParser("https://domain.com/foo?afoo=1&afoo=afoo#hash");
    parser.set("foo", "foo");
    t.is(parser.href, "https://domain.com/foo?afoo=1&afoo=afoo&foo=foo#hash");
});

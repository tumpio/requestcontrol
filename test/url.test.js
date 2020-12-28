import {UrlParser, QueryParser} from "../src/main/url.js";

test("href - get", () => {
    const url = "https://domain.com";
    expect(new UrlParser(url).href).toBe(url);
});


test("href - set", () => {
    const url = "https://foo.com";
    const url2 = "http://domain.com";
    const parser = new UrlParser(url);
    parser.href = url2;
    expect(parser.href).toBe(url2);
});

test("protocol - get", () => {
    expect(new UrlParser("https://domain.com").protocol).toBe("https:");
    expect(new UrlParser("http://domain.com").protocol).toBe("http:");
    expect(new UrlParser("://domain.com").protocol).toBe(":");
    expect(new UrlParser("domain.com").protocol).toBe("");
});

test("protocol - set", () => {
    const url = "https://domain.com";
    const url2 = "http://domain.com";
    const parser = new UrlParser(url);
    parser.protocol = "http";
    expect(parser.href).toBe(url2);
});

test("protocol - set with colon", () => {
    const url = "https://domain.com";
    const url2 = "data://domain.com";
    const parser = new UrlParser(url);
    parser.protocol = "data:";
    expect(parser.href).toBe(url2);
});

test("username - get", () => {
    expect(new UrlParser("https://domain.com").username).toBe("");
    expect(new UrlParser("https://user@domain.com").username).toBe("user");
    expect(new UrlParser("https://user:@domain.com").username).toBe("user");
    expect(new UrlParser("https://user:pass@domain.com").username).toBe("user");
    expect(new UrlParser("user:pass@domain.com").username).toBe("user");
});

test("username - set", () => {
    const parser = new UrlParser("https://domain.com");
    parser.username = "user";
    expect(parser.href).toBe("https://user@domain.com");
});

test("username - set with password", () => {
    const parser = new UrlParser("https://user:pass@domain.com");
    parser.username = "other";
    expect(parser.href).toBe("https://other:pass@domain.com");
});

test("password - get", () => {
    expect(new UrlParser("https://domain.com").password).toBe("");
    expect(new UrlParser("https://user@domain.com").password).toBe("");
    expect(new UrlParser("https://user:@domain.com").password).toBe("");
    expect(new UrlParser("https://user:pass@domain.com").password).toBe("pass");
    expect(new UrlParser("https://user:pass:@domain.com").password).toBe("pass:");
    expect(new UrlParser("user:pass:@domain.com").password).toBe("pass:");
});

test("password - set", () => {
    const parser = new UrlParser("https://domain.com");
    parser.password = "pass";
    expect(parser.href).toBe("https://domain.com");
});

test("password - set same with user", () => {
    const parser = new UrlParser("https://user@domain.com");
    parser.password = "pass";
    expect(parser.href).toBe("https://user:pass@domain.com");
});

test("password - set new with user", () => {
    const parser = new UrlParser("https://user:pass@domain.com");
    parser.password = "other";
    expect(parser.href).toBe("https://user:other@domain.com");
});

test("hostname - get", () => {
    expect(new UrlParser("//example.com").hostname).toBe("example.com");
    expect(new UrlParser("http://example.com").hostname).toBe("example.com");
    expect(new UrlParser("http://example.com/").hostname).toBe("example.com");
    expect(new UrlParser("").hostname).toBe("");
    expect(new UrlParser("example").hostname).toBe("example");
    expect(new UrlParser("example.com").hostname).toBe("example.com");
    expect(new UrlParser("example.com:8080").hostname).toBe("example.com");
    expect(new UrlParser("user:pass@example.com:8080").hostname).toBe("example.com");
    expect(new UrlParser("example.com/").hostname).toBe("example.com");
    expect(new UrlParser("http://example.com/path").hostname).toBe("example.com");
    expect(new UrlParser("http://example.com:1234/path#asd").hostname).toBe("example.com");
    expect(new UrlParser("http://user:pass@example.com/path").hostname).toBe("example.com");
    expect(new UrlParser("http://user:pass@example.com:8080/path").hostname).toBe("example.com");
    expect(new UrlParser("http://user:pass@example.com:8080").hostname).toBe("example.com");
    expect(new UrlParser("http://user:pass@example.com:8080/").hostname).toBe("example.com");
    expect(new UrlParser("https://user:pass@example.com:8080/").hostname).toBe("example.com");
    expect(new UrlParser("https://user:pass@example.com:8080/").hostname).toBe("example.com");
    expect(new UrlParser("https://pass@example.com:8080/").hostname).toBe("example.com");
    expect(new UrlParser("https://user@example.com:8080/").hostname).toBe("example.com");
    expect(new UrlParser("https://user@example.com/").hostname).toBe("example.com");
    expect(new UrlParser("http://[2001:0db8:85a3:0000:0000:8a2e:0370:7334]").hostname).toBe("[2001:0db8:85a3:0000:0000:8a2e:0370:7334]");
    expect(
        new UrlParser("http://user:pass@[::1]/segment/index.html?query#frag").hostname
    ).toBe("[::1]");
    expect(new UrlParser("http://[::1]").hostname).toBe("[::1]");
    expect(new UrlParser("http://[::1]:8080").hostname).toBe("[::1]");
    expect(new UrlParser("http://[1080::8:800:200C:417A]:100/foo").hostname).toBe("[1080::8:800:200C:417A]");
    expect(new UrlParser("http://192.168.0.1/").hostname).toBe("192.168.0.1");
    expect(new UrlParser("http://192.168.0.1:8080/").hostname).toBe("192.168.0.1");
    expect(new UrlParser("http://192.168.0.1:8080/path?asd=asd#asd").hostname).toBe("192.168.0.1");
});

test("host - get", () => {
    expect(new UrlParser("//example.com").host).toBe("example.com");
    expect(new UrlParser("http://example.com").host).toBe("example.com");
    expect(new UrlParser("http://example.com/").host).toBe("example.com");
    expect(new UrlParser("").host).toBe("");
    expect(new UrlParser("example").host).toBe("example");
    expect(new UrlParser("example.com").host).toBe("example.com");
    expect(new UrlParser("example.com:8080").host).toBe("example.com:8080");
    expect(new UrlParser("user:pass@example.com:8080").host).toBe("example.com:8080");
    expect(new UrlParser("example.com/").host).toBe("example.com");
    expect(new UrlParser("http://example.com/path").host).toBe("example.com");
    expect(new UrlParser("http://example.com:1234/path#asd").host).toBe("example.com:1234");
    expect(new UrlParser("http://user:pass@example.com/path").host).toBe("example.com");
    expect(new UrlParser("http://user:pass@example.com:8080/path").host).toBe("example.com:8080");
    expect(new UrlParser("http://user:pass@example.com:8080").host).toBe("example.com:8080");
    expect(new UrlParser("http://user:pass@example.com:8080/").host).toBe("example.com:8080");
    expect(new UrlParser("https://user:pass@example.com:8080/").host).toBe("example.com:8080");
    expect(new UrlParser("https://user:pass@example.com:8080/").host).toBe("example.com:8080");
    expect(new UrlParser("https://pass@example.com:8080/").host).toBe("example.com:8080");
    expect(new UrlParser("https://user@example.com:8080/").host).toBe("example.com:8080");
    expect(new UrlParser("https://user@example.com/").host).toBe("example.com");
    expect(new UrlParser("http://[2001:0db8:85a3:0000:0000:8a2e:0370:7334]").host).toBe("[2001:0db8:85a3:0000:0000:8a2e:0370:7334]");
    expect(new UrlParser("http://user:pass@[::1]/segment/index.html?query#frag").host).toBe("[::1]");
    expect(new UrlParser("http://[::1]").host).toBe("[::1]");
    expect(new UrlParser("http://[::1]:8080").host).toBe("[::1]:8080");
    expect(new UrlParser("http://[1080::8:800:200C:417A]:100/foo").host).toBe("[1080::8:800:200C:417A]:100");
    expect(new UrlParser("http://192.168.0.1/").host).toBe("192.168.0.1");
    expect(new UrlParser("http://192.168.0.1:8080/").host).toBe("192.168.0.1:8080");
    expect(new UrlParser("http://192.168.0.1:8080/path?asd=asd#asd").host).toBe("192.168.0.1:8080");
});


test("origin - get", () => {
    expect(new UrlParser("//example.com").origin).toBe("//example.com");
    expect(new UrlParser("http://example.com").origin).toBe("http://example.com");
    expect(new UrlParser("http://example.com/").origin).toBe("http://example.com");
    expect(new UrlParser("http://example.com/path").origin).toBe("http://example.com");
    expect(new UrlParser("http://example.com:1234/path#asd").origin).toBe("http://example.com:1234");
    expect(new UrlParser("http://user:pass@example.com/path").origin).toBe("http://example.com");
    expect(new UrlParser("http://user:pass@example.com:8080/path").origin).toBe("http://example.com:8080");
    expect(new UrlParser("http://user:pass@example.com:8080").origin).toBe("http://example.com:8080");
    expect(new UrlParser("http://user:pass@example.com:8080/").origin).toBe("http://example.com:8080");
    expect(new UrlParser("https://user:pass@example.com:8080/").origin).toBe("https://example.com:8080");
    expect(new UrlParser("https://user:pass@example.com:8080/").origin).toBe("https://example.com:8080");
    expect(new UrlParser("https://pass@example.com:8080/").origin).toBe("https://example.com:8080");
    expect(new UrlParser("https://user@example.com:8080/").origin).toBe("https://example.com:8080");
    expect(new UrlParser("https://user@example.com/").origin).toBe("https://example.com");
    expect(new UrlParser("http://[2001:0db8:85a3:0000:0000:8a2e:0370:7334]").origin).toBe("http://[2001:0db8:85a3:0000:0000:8a2e:0370:7334]");
    expect(
        new UrlParser("http://user:pass@[::1]/segment/index.html?query#frag").origin
    ).toBe("http://[::1]");
    expect(new UrlParser("http://[::1]").origin).toBe("http://[::1]");
    expect(new UrlParser("http://[::1]:8080").origin).toBe("http://[::1]:8080");
    expect(new UrlParser("http://[1080::8:800:200C:417A]:100/foo").origin).toBe("http://[1080::8:800:200C:417A]:100");
    expect(new UrlParser("http://192.168.0.1/").origin).toBe("http://192.168.0.1");
    expect(new UrlParser("http://192.168.0.1:8080/").origin).toBe("http://192.168.0.1:8080");
    expect(new UrlParser("http://192.168.0.1:8080/path?asd=asd#asd").origin).toBe("http://192.168.0.1:8080");
});

test("hostname - set", () => {
    const parser = new UrlParser("https://domain.com");
    parser.hostname = "other.com";
    expect(parser.href).toBe("https://other.com");
});

test("hostname - set full", () => {
    const parser = new UrlParser("https://user:pass@domain.com:8080/path?query#hash");
    parser.hostname = "other.com";
    expect(parser.href).toBe("https://user:pass@other.com:8080/path?query#hash");
});

test("host - set", () => {
    const parser = new UrlParser("https://domain.com");
    parser.host = "other.com";
    expect(parser.href).toBe("https://other.com");
});

test("host - set with port", () => {
    const parser = new UrlParser("https://user:pass@domain.com:8080/path?query#hash");
    parser.host = "other.com:1234";
    expect(parser.href).toBe("https://user:pass@other.com:1234/path?query#hash");
});


test("port - get", () => {
    expect(new UrlParser("https://domain.com").port).toBe("");
    expect(new UrlParser("https://domain.com:8080").port).toBe(":8080");
    expect(new UrlParser("https://user:@domain.com:8080").port).toBe(":8080");
    expect(new UrlParser("https://user:pass@domain.com:8080/lkajsd?sad#asd").port).toBe(":8080");
});

test("port - set", () => {
    const parser = new UrlParser("https://domain.com");
    parser.port = "1234";
    expect(parser.href).toBe("https://domain.com:1234");
});

test("port - set with colon", () => {
    const parser = new UrlParser("https://domain.com:8080/path");
    parser.port = ":1234";
    expect(parser.href).toBe("https://domain.com:1234/path");
});

test("path - get", () => {
    expect(new UrlParser("https://domain.com").pathname).toBe("/");
    expect(new UrlParser("https://domain.com/").pathname).toBe("/");
    expect(new UrlParser("https://domain.com:8080/path").pathname).toBe("/path");
    expect(
        new UrlParser("https://user:@domain.com/path/path.href?foo=bar#haash").pathname
    ).toBe("/path/path.href");
    expect(new UrlParser("user:@domain.com/path/path.href?foo=bar#haash").pathname).toBe("/path/path.href");
});

test("path - set same", () => {
    const parser = new UrlParser("https://domain.com");
    parser.pathname = "path";
    expect(parser.href).toBe("https://domain.com/path");
});

test("path - set new", () => {
    const parser = new UrlParser("https://domain.com/foo");
    parser.pathname = "bar";
    expect(parser.href).toBe("https://domain.com/bar");
});

test("path - set with slash", () => {
    const parser = new UrlParser("https://domain.com:8080/foo/bar.href?query#hash");
    parser.pathname = "/index.href";
    expect(parser.href).toBe("https://domain.com:8080/index.href?query#hash");
});

test("search - get", () => {
    expect(new UrlParser("https://domain.com").search).toBe("");
    expect(new UrlParser("https://domain.com/?").search).toBe("?");
    expect(new UrlParser("https://domain.com:8080/path?foo").search).toBe("?foo");
    expect(new UrlParser("https://domain.com:8080/path?foo?bar").search).toBe("?foo?bar");
    expect(new UrlParser("https://domain.com:8080/path?foo?bar#hash").search).toBe("?foo?bar");
});

test("search - set", () => {
    const parser = new UrlParser("https://domain.com/foo");
    parser.search = "bar";
    expect(parser.href).toBe("https://domain.com/foo?bar");
});

test("search - set with question mark", () => {
    const parser = new UrlParser("https://domain.com/foo?query#hash");
    parser.search = "?bar";
    expect(parser.href).toBe("https://domain.com/foo?bar#hash");
});

test("search - set empty", () => {
    const parser = new UrlParser("https://domain.com/foo?query=bar&foo#hash");
    parser.search = "";
    expect(parser.href).toBe("https://domain.com/foo#hash");
});


test("hash - get", () => {
    expect(new UrlParser("https://domain.com").hash).toBe("");
    expect(new UrlParser("https://domain.com/path?#").hash).toBe("#");
    expect(new UrlParser("https://domain.com/path?a#b").hash).toBe("#b");
    expect(new UrlParser("https://domain.com:8080/path?foo#hash").hash).toBe("#hash");
});


test("hash - set", () => {
    const parser = new UrlParser("https://domain.com/foo");
    parser.hash = "bar";
    expect(parser.href).toBe("https://domain.com/foo#bar");
});

test("hash - set with hash", () => {
    const parser = new UrlParser("https://domain.com/foo?query#hash");
    parser.hash = "#bar";
    expect(parser.href).toBe("https://domain.com/foo?query#bar");
});

test("hash - set empty", () => {
    const parser = new UrlParser("https://domain.com/foo?query#hash");
    parser.hash = "";
    expect(parser.href).toBe("https://domain.com/foo?query");
});

test("query parser - get", () => {
    expect(new QueryParser("https://domain.com/foo#hash").get("foo")).toBe("");
    expect(new QueryParser("https://domain.com/foo?#hash").get("foo")).toBe("");
    expect(new QueryParser("https://domain.com/foo?foo#hash").get("foo")).toBe("");
    expect(new QueryParser("https://domain.com/foo?geefoo=1#hash").get("foo")).toBe("");
    expect(new QueryParser("https://domain.com/foo?gee=faafoo#hash").get("foo")).toBe("");
    expect(new QueryParser("https://domain.com/foo?gee=1&feefoo=2#hash").get("foo")).toBe("");
    expect(new QueryParser("https://domain.com/foo?foo=bar#hash").get("foo")).toBe("bar");
    expect(
        new QueryParser("https://domain.com/foo?foo=bar&foo=foo?x=y#hash").get("foo")
    ).toBe("bar");
});

test("query parser - set when no query", () => {
    const parser = new QueryParser("https://domain.com/foo#hash");
    parser.set("foo", "foo");
    expect(parser.href).toBe("https://domain.com/foo?foo=foo#hash");
});

test("query parser - set when empty query", () => {
    const parser = new QueryParser("https://domain.com/foo?#hash");
    parser.set("foo", "foo");
    expect(parser.href).toBe("https://domain.com/foo?foo=foo#hash");
});

test("query parser - set when no value", () => {
    const parser = new QueryParser("https://domain.com/foo?foo#hash");
    parser.set("foo", "foo");
    expect(parser.href).toBe("https://domain.com/foo?foo=foo#hash");
});

test("query parser - set when empty value", () => {
    const parser = new QueryParser("https://domain.com/foo?foo=#hash");
    parser.set("foo", "foo");
    expect(parser.href).toBe("https://domain.com/foo?foo=foo#hash");
});

test("query parser - set when value", () => {
    const parser = new QueryParser("https://domain.com/foo?foo=bar#hash");
    parser.set("foo", "foo");
    expect(parser.href).toBe("https://domain.com/foo?foo=foo#hash");
});

test("query parser - set when has query parameter same begin", () => {
    const parser = new QueryParser("https://domain.com/foo?fooo=bar#hash");
    parser.set("foo", "foo");
    expect(parser.href).toBe("https://domain.com/foo?fooo=bar&foo=foo#hash");
});

test("query parser - set when has query parameter same end", () => {
    const parser = new QueryParser("https://domain.com/foo?afoo=bar#hash");
    parser.set("foo", "foo");
    expect(parser.href).toBe("https://domain.com/foo?afoo=bar&foo=foo#hash");
});

test("query parser - set when has multiple query parameters", () => {
    const parser = new QueryParser("https://domain.com/foo?afoo=1&afoo=2#hash");
    parser.set("foo", "foo");
    expect(parser.href).toBe("https://domain.com/foo?afoo=1&afoo=2&foo=foo#hash");
});

test("query parser - set when has multiple query parameters with value equals key", () => {
    const parser = new QueryParser("https://domain.com/foo?afoo=1&afoo=afoo#hash");
    parser.set("foo", "foo");
    expect(parser.href).toBe("https://domain.com/foo?afoo=1&afoo=afoo&foo=foo#hash");
});

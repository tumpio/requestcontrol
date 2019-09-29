import { RedirectRule } from "../src/main/rules/redirect";

test("Static redirection url", () => {
    const request = "https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/dp/B01GGKYQ02/ref=sr_1_1?s=amazonbasics&srs=10112675011&ie=UTF8&qid=1489067885&sr=8-1&keywords=usb-c";
    const target = "https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/dp/B01GGKYQ02/";
    const redirectRule = new RedirectRule({ redirectUrl: "https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/dp/B01GGKYQ02/" });
    expect(redirectRule.apply(request)).toBe(target);
});

test("Pattern expansion - Single", () => {
    const request = "https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/dp/B01GGKYQ02/ref=sr_1_1?s=amazonbasics&srs=10112675011&ie=UTF8&qid=1489067885&sr=8-1&keywords=usb-c";
    const target = "https://a.b/path/?s=amazonbasics&srs=10112675011&ie=UTF8&qid=1489067885&sr=8-1&keywords=usb-c";
    const redirectRule = new RedirectRule({ redirectUrl: "https://a.b/path/{search}" });
    expect(redirectRule.apply(request)).toBe(target);
});

test("Pattern expansion - Multiple", () => {
    const request = "https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/dp/B01GGKYQ02/ref=sr_1_1?s=amazonbasics&srs=10112675011&ie=UTF8&qid=1489067885&sr=8-1&keywords=usb-c";
    const target = "https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/dp/B01GGKYQ02/ref=sr_1_1?s=amazonbasics&srs=10112675011&ie=UTF8&qid=1489067885&sr=8-1&keywords=usb-c#myhash";
    const redirectRule = new RedirectRule({ redirectUrl: "{protocol}//{host}{pathname}{search}#myhash" });
    expect(redirectRule.apply(request)).toBe(target);
});

test("Pattern expansion - Parameter not found", () => {
    const request = "https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/dp/B01GGKYQ02/ref=sr_1_1?s=amazonbasics&srs=10112675011&ie=UTF8&qid=1489067885&sr=8-1&keywords=usb-c";
    const target = "https://a.b/path/{fail}";
    const redirectRule = new RedirectRule({ redirectUrl: target });
    expect(redirectRule.apply(request)).toBe(target);
});

test("Substring replace pattern", () => {
    const request = "https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/dp/B01GGKYQ02/ref=sr_1_1?s=amazonbasics&srs=10112675011&ie=UTF8&qid=1489067885&sr=8-1&keywords=usb-c";
    const target = "https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/my/path/B01GGKYQ02/ref=sr_1_1?s=amazonbasics&srs=10112675011&ie=UTF8&qid=1489067885&sr=8-1&keywords=usb-c#myhash";
    const redirectRule = new RedirectRule({ redirectUrl: "{protocol}//{host}{pathname/dp/my/path}{search}#myhash" });
    expect(redirectRule.apply(request)).toBe(target);
});

test("Substring replace pattern - regexp capture groups", () => {
    let request, target, redirectRule;
    request = "https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/dp/B01GGKYQ02/ref=sr_1_1?s=amazonbasics&srs=10112675011&ie=UTF8&qid=1489067885&sr=8-1&keywords=usb-c";
    target = "https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/foo/B01GGKYQ02/";
    redirectRule = new RedirectRule({ redirectUrl: "{href/(.*?)\\/dp\\/(.*?)\\/ref=.*/$1/foo/$2/}" });
    expect(redirectRule.apply(request)).toBe(target);
});

test("Substring replace pattern - regexp replace", () => {
    let request, target, redirectRule;
    request = "https://www.dropbox.com/s/vm2mh2lkwsug4gt/rick_morty_at.png?dl=0";
    target = "https://dl.dropboxusercontent.com/s/vm2mh2lkwsug4gt/rick_morty_at.png";
    redirectRule = new RedirectRule({ redirectUrl: "{href/^https?:\\/\\/www\\.dropbox\\.com(\\/s\\/.+\\/.+)\\?dl=\\d$/https://dl.dropboxusercontent.com$1}" });
    expect(redirectRule.apply(request)).toBe(target);
});

test("Substring replace pattern - replace all occurences", () => {
    let request, target, redirectRule;
    request = "http://foo.com/foo/foo?foo=bar#foo";
    target = "http://bar.com/bar/bar?bar=bar#bar";
    redirectRule = new RedirectRule({ redirectUrl: "{href//foo/bar}" });
    expect(redirectRule.apply(request)).toBe(target);
});

test("Substring replace pattern - replace backslash", () => {
    let request, target, redirectRule;
    request = "http:\\/\\/foo.com\\/foo\\/";
    target = "http://foo.com/foo/";
    redirectRule = new RedirectRule({ redirectUrl: "{href//\\\\+/}" });
    expect(redirectRule.apply(request)).toBe(target);
});

test("Substring replace pattern - replace all combined", () => {
    let request, target, redirectRule;
    request = "http://track.steadyhq.com/track/click/12345678/steadyhq.com?p=eyJzIjoidDJLdmg0NVV4MUJkNFh3N3lrUkR6djRMWlJNIiwidiI6MSwicCI6IntcInVcIjoxMjM0NTY3OCxcInZcIjoxLFwidXJsXCI6XCJodHRwczpcXFwvXFxcL3N0ZWFkeWhxLmNvbVxcXC9wcm9qZWN0XFxcL3Bvc3RzXFxcLzlmYjYwMWU0LWIzMjctNGY2YS01NzljLWU1NGM4NDE1YmY0YlwiLFwiaWRcIjpcIjZmOTNmMTZhYWE0NTQyYjk2M2M2NjEwOGMwZTk4ZjJcIixcInVybF9pZHNcIjpbXCI2OWExOTZiYWIzODNmN2YyZDcxMDQxMjA3MWQ5NjhmNmRiYmVlMDQ4XCJdfSJ9";
    target = "https://steadyhq.com/project/posts/9fb601e4-b327-4f6a-579c-e54c8415bf4b";
    redirectRule = new RedirectRule({ redirectUrl: "{search.p|decodeBase64|/.*\"(http.*?)\".*/$1|//\\\\+/}" });
    expect(redirectRule.apply(request)).toBe(target);
});

test("Substring replace pattern - regexp repetition quantifiers ", () => {
    let request, target, redirectRule;
    request = "https://i.imgur.com/cijC2a2l.jpg";
    target = "https://i.imgur.com/cijC2a2.jpg";
    redirectRule = new RedirectRule({ redirectUrl: "{origin}{pathname/l\\.([a-zA-Z]{3,4})$/.$1}{search}{hash}" });
    expect(redirectRule.apply(request)).toBe(target);

    request = "https://example.com/?1234";
    target = "https://example.com/";
    redirectRule = new RedirectRule({ redirectUrl: "{origin}{pathname}{search/(?:[?&]\\d{4,}?(?=$|[?#])|([?&])\\d{4,}?[?&])/$1}{hash}" });
    expect(redirectRule.apply(request)).toBe(target);
});

test("Substring extraction pattern", () => {
    let request, target, redirectRule;
    request = "https://foo.bar/path";
    target = "http://bar.com/some/new/path";
    redirectRule = new RedirectRule({ redirectUrl: "{protocol:0:4}://{host:-3}.com/some/new/path" });
    expect(redirectRule.apply(request)).toBe(target);
});

test("String manipulations combined", () => {
    let request, target, redirectRule;
    request = "http://foo.bar.co.uk/path";
    target = "https://bar.com/some/new/path";
    redirectRule = new RedirectRule({ redirectUrl: "https://{host::-3|/\\.co$/.com|:4}/some/new/path" });
    expect(redirectRule.apply(request)).toBe(target);
});

test("String manipulations combined - Bad manipulation", () => {
    let request, target, redirectRule;
    request = "http://foo.bar.co.uk/path";
    target = "https://foo.bar.com/some/new/path";
    redirectRule = new RedirectRule({ redirectUrl: "https://{host::-3|/\\.co$/.com|fail}/some/new/path" });
    expect(redirectRule.apply(request)).toBe(target);
});

test("Redirect instructions - single", () => {
    let request, target, redirectRule;
    request = "http://foo.bar.co.uk/path";
    target = "http://foo.bar.co.uk:8080/path";
    redirectRule = new RedirectRule({ redirectUrl: "[port=8080]" });
    expect(redirectRule.apply(request)).toBe(target);
});

test("Redirect instructions - multiple", () => {
    let request, target, redirectRule;
    request = "http://foo.bar.co.uk/path";
    target = "http://localhost:8080/path";
    redirectRule = new RedirectRule({ redirectUrl: "[host=localhost][port=8080]" });
    expect(redirectRule.apply(request)).toBe(target);
});

test("Redirect instructions - combined", () => {
    let request, target, redirectRule;
    request = "http://foo.bar.co.uk/path";
    target = "https://bar.com:1234/some/new/path?foo=bar#foobar";
    redirectRule = new RedirectRule({ redirectUrl: "ht[port=1234]tps://{host::-3|/\\.co$/.com|:4}/some/new/path[hash=foobar][search=foo=bar]" });
    expect(redirectRule.apply(request)).toBe(target);
});

test("Redirect instructions - combined 2", () => {
    let request, target, redirectRule;
    request = "http://foo.com/path";
    target = "https://bar.com/path#myhash=com";
    redirectRule = new RedirectRule({ redirectUrl: "[protocol=https][hash=myhash={host:-3}][host={host/foo/bar}]" });
    expect(redirectRule.apply(request)).toBe(target);
});

test("Redirect instructions - hostname", () => {
    let request, target, redirectRule;
    request = "https://en.m.wikipedia.org/wiki/Main_Page";
    target = "https://en.wikipedia.org/wiki/Main_Page";
    redirectRule = new RedirectRule({ redirectUrl: "[hostname={hostname/\\.m\\./.}]" });
    expect(redirectRule.apply(request)).toBe(target);
});

test("Redirect instructions - hostname replace pattern", () => {
    let request, target, redirectRule;
    request = "https://en.m.wikipedia.org/wiki/Main_Page";
    target = "https://en.wikipedia.org/wiki/Main_Page";
    redirectRule = new RedirectRule({ redirectUrl: "[hostname={hostname/\\.[mi]\\./.}]" });
    expect(redirectRule.apply(request)).toBe(target);
});

test("Capture Search Parameter - found", () => {
    const request = "http://go.redirectingat.com/?xs=1&id=xxxxxxx&sref=http%3A%2F%2Fwww.vulture.com%2F2018%2F05%2Fthe-end-of-nature-at-storm-king-art-center-in-new-york.html&xcust=xxxxxxxx&url=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FNathaniel_Parker_Willis";
    const target = "https://en.wikipedia.org/wiki/Nathaniel_Parker_Willis";
    const redirectRule = new RedirectRule({ redirectUrl: "{search.url|decodeURIComponent}" });
    expect(redirectRule.apply(request)).toBe(target);
});

test("Set Search Parameter", () => {
    const request = "http://example.com/?query=none";
    const target = "http://example.com/?query=set";
    const redirectRule = new RedirectRule({ redirectUrl: "[search.query=set]" });
    expect(redirectRule.apply(request)).toBe(target);
});

test("Set Search Parameter - encode", () => {
    const request = "http://example.com/?query=none";
    const target = "http://example.com/?query=http%3A%2F%2Fexample.com";
    const redirectRule = new RedirectRule({ redirectUrl: "[search.query={origin|encodeURIComponent}]" });
    expect(redirectRule.apply(request)).toBe(target);
});

test("Capture Search Parameter - not found", () => {
    const request = "http://go.redirectingat.com/?xs=1&id=xxxxxxx&sref=http%3A%2F%2Fwww.vulture.com%2F2018%2F05%2Fthe-end-of-nature-at-storm-king-art-center-in-new-york.html&xcust=xxxxxxxx&url=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FNathaniel_Parker_Willis";
    const redirectRule = new RedirectRule({ redirectUrl: "{search.foo|decodeURIComponent}" });
    expect(redirectRule.apply(request)).toBe("");
});

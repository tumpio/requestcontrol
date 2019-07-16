import test from "ava";
import {RedirectRule} from "../src/RequestControl/redirect";

test("Static redirection url", t => {
    const request = "https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/dp/B01GGKYQ02/ref=sr_1_1?s=amazonbasics&srs=10112675011&ie=UTF8&qid=1489067885&sr=8-1&keywords=usb-c";
    const target = "https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/dp/B01GGKYQ02/";
    const redirectRule = new RedirectRule(0, "https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/dp/B01GGKYQ02/");
    t.is(redirectRule.apply(request), target);
});

test("Pattern expansion - Single", t => {
    const request = "https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/dp/B01GGKYQ02/ref=sr_1_1?s=amazonbasics&srs=10112675011&ie=UTF8&qid=1489067885&sr=8-1&keywords=usb-c";
    const target = "https://a.b/path/?s=amazonbasics&srs=10112675011&ie=UTF8&qid=1489067885&sr=8-1&keywords=usb-c";
    const redirectRule = new RedirectRule(0, "https://a.b/path/{search}");
    t.is(redirectRule.apply(request), target);
});

test("Pattern expansion - Multiple", t => {
    const request = "https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/dp/B01GGKYQ02/ref=sr_1_1?s=amazonbasics&srs=10112675011&ie=UTF8&qid=1489067885&sr=8-1&keywords=usb-c";
    const target = "https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/dp/B01GGKYQ02/ref=sr_1_1?s=amazonbasics&srs=10112675011&ie=UTF8&qid=1489067885&sr=8-1&keywords=usb-c#myhash";
    const redirectRule = new RedirectRule(0, "{protocol}//{host}{pathname}{search}#myhash");
    t.is(redirectRule.apply(request), target);
});

test("Pattern expansion - Parameter not found", t => {
    const request = "https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/dp/B01GGKYQ02/ref=sr_1_1?s=amazonbasics&srs=10112675011&ie=UTF8&qid=1489067885&sr=8-1&keywords=usb-c";
    const target = "https://a.b/path/{fail}";
    const redirectRule = new RedirectRule(0, target);
    t.is(redirectRule.apply(request), target);
});

test("Substring replace pattern", t => {
    const request = "https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/dp/B01GGKYQ02/ref=sr_1_1?s=amazonbasics&srs=10112675011&ie=UTF8&qid=1489067885&sr=8-1&keywords=usb-c";
    const target = "https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/my/path/B01GGKYQ02/ref=sr_1_1?s=amazonbasics&srs=10112675011&ie=UTF8&qid=1489067885&sr=8-1&keywords=usb-c#myhash";
    const redirectRule = new RedirectRule(0, "{protocol}//{host}{pathname/dp/my/path}{search}#myhash");
    t.is(redirectRule.apply(request), target);
});

test("Substring replace pattern - regexp capture groups", t => {
    let request, target, redirectRule;
    request = "https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/dp/B01GGKYQ02/ref=sr_1_1?s=amazonbasics&srs=10112675011&ie=UTF8&qid=1489067885&sr=8-1&keywords=usb-c";
    target = "https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/foo/B01GGKYQ02/";
    redirectRule = new RedirectRule(0, "{href/(.*?)\\/dp\\/(.*?)\\/ref=.*/$1/foo/$2/}");
    t.is(redirectRule.apply(request), target);
});

test("Substring replace pattern - regexp replace", t => {
    let request, target, redirectRule;
    request = "https://www.dropbox.com/s/vm2mh2lkwsug4gt/rick_morty_at.png?dl=0";
    target = "https://dl.dropboxusercontent.com/s/vm2mh2lkwsug4gt/rick_morty_at.png";
    redirectRule = new RedirectRule(0, "{href/^https?:\\/\\/www\\.dropbox\\.com(\\/s\\/.+\\/.+)\\?dl=\\d$/https://dl.dropboxusercontent.com$1}");
    t.is(redirectRule.apply(request), target);
});

test("Substring replace pattern - replace all occurences", t => {
    let request, target, redirectRule;
    request = "http://foo.com/foo/foo?foo=bar#foo";
    target = "http://bar.com/bar/bar?bar=bar#bar";
    redirectRule = new RedirectRule(0, "{href//foo/bar}");
    t.is(redirectRule.apply(request), target);
});

test("Substring replace pattern - replace backslash", t => {
    let request, target, redirectRule;
    request = "http:\\/\\/foo.com\\/foo\\/";
    target = "http://foo.com/foo/";
    redirectRule = new RedirectRule(0, "{href//\\\\+/}");
    t.is(redirectRule.apply(request), target);
});

test("Substring replace pattern - replace all combined", t => {
    let request, target, redirectRule;
    request = "http://track.steadyhq.com/track/click/12345678/steadyhq.com?p=eyJzIjoidDJLdmg0NVV4MUJkNFh3N3lrUkR6djRMWlJNIiwidiI6MSwicCI6IntcInVcIjoxMjM0NTY3OCxcInZcIjoxLFwidXJsXCI6XCJodHRwczpcXFwvXFxcL3N0ZWFkeWhxLmNvbVxcXC9wcm9qZWN0XFxcL3Bvc3RzXFxcLzlmYjYwMWU0LWIzMjctNGY2YS01NzljLWU1NGM4NDE1YmY0YlwiLFwiaWRcIjpcIjZmOTNmMTZhYWE0NTQyYjk2M2M2NjEwOGMwZTk4ZjJcIixcInVybF9pZHNcIjpbXCI2OWExOTZiYWIzODNmN2YyZDcxMDQxMjA3MWQ5NjhmNmRiYmVlMDQ4XCJdfSJ9";
    target = "https://steadyhq.com/project/posts/9fb601e4-b327-4f6a-579c-e54c8415bf4b";
    redirectRule = new RedirectRule(0, "{search.p|decodeBase64|/.*\"(http.*?)\".*/$1|//\\\\+/}");
    t.is(redirectRule.apply(request), target);
});

test("Substring replace pattern - regexp repetition quantifiers ", t => {
    let request, target, redirectRule;
    request = "https://i.imgur.com/cijC2a2l.jpg";
    target = "https://i.imgur.com/cijC2a2.jpg";
    redirectRule = new RedirectRule(0, "{origin}{pathname/l\\.([a-zA-Z]{3,4})$/.$1}{search}{hash}");
    t.is(redirectRule.apply(request), target);

    request = "https://example.com/?1234";
    target = "https://example.com/";
    redirectRule = new RedirectRule(0, "{origin}{pathname}{search/(?:[?&]\\d{4,}?(?=$|[?#])|([?&])\\d{4,}?[?&])/$1}{hash}");
    t.is(redirectRule.apply(request), target);
});

test("Substring extraction pattern", t => {
    let request, target, redirectRule;
    request = "https://foo.bar/path";
    target = "http://bar.com/some/new/path";
    redirectRule = new RedirectRule(0, "{protocol:0:4}://{host:-3}.com/some/new/path");
    t.is(redirectRule.apply(request), target);
});

test("String manipulations combined", t => {
    let request, target, redirectRule;
    request = "http://foo.bar.co.uk/path";
    target = "https://bar.com/some/new/path";
    redirectRule = new RedirectRule(0, "https://{host::-3|/\\.co$/.com|:4}/some/new/path");
    t.is(redirectRule.apply(request), target);
});

test("String manipulations combined - Bad manipulation", t => {
    let request, target, redirectRule;
    request = "http://foo.bar.co.uk/path";
    target = "https://foo.bar.com/some/new/path";
    redirectRule = new RedirectRule(0, "https://{host::-3|/\\.co$/.com|fail}/some/new/path");
    t.is(redirectRule.apply(request), target);
});

test("Redirect instructions - single", t => {
    let request, target, redirectRule;
    request = "http://foo.bar.co.uk/path";
    target = "http://foo.bar.co.uk:8080/path";
    redirectRule = new RedirectRule(0, "[port=8080]");
    t.is(redirectRule.apply(request), target);
});

test("Redirect instructions - multiple", t => {
    let request, target, redirectRule;
    request = "http://foo.bar.co.uk/path";
    target = "http://localhost:8080/path";
    redirectRule = new RedirectRule(0, "[host=localhost][port=8080]");
    t.is(redirectRule.apply(request), target);
});

test("Redirect instructions - combined", t => {
    let request, target, redirectRule;
    request = "http://foo.bar.co.uk/path";
    target = "https://bar.com:1234/some/new/path?foo=bar#foobar";
    redirectRule = new RedirectRule(0, "ht[port=1234]tps://{host::-3|/\\.co$/.com|:4}/some/new/path[hash=foobar][search=foo=bar]");
    t.is(redirectRule.apply(request), target);
});

test("Redirect instructions - combined 2", t => {
    let request, target, redirectRule;
    request = "http://foo.com/path";
    target = "https://bar.com/path#myhash=com";
    redirectRule = new RedirectRule(0, "[protocol=https][hash=myhash={host:-3}][host={host/foo/bar}]");
    t.is(redirectRule.apply(request), target);
});

test("Redirect instructions - hostname", t => {
    let request, target, redirectRule;
    request = "https://en.m.wikipedia.org/wiki/Main_Page";
    target = "https://en.wikipedia.org/wiki/Main_Page";
    redirectRule = new RedirectRule(0, "[hostname={hostname/\\.m\\./.}]");
    t.is(redirectRule.apply(request), target);
});

test("Redirect instructions - hostname replace pattern", t => {
    let request, target, redirectRule;
    request = "https://en.m.wikipedia.org/wiki/Main_Page";
    target = "https://en.wikipedia.org/wiki/Main_Page";
    redirectRule = new RedirectRule(0, "[hostname={hostname/\\.[mi]\\./.}]");
    t.is(redirectRule.apply(request), target);
});

test("Capture Search Parameter - found", t => {
    const request = "http://go.redirectingat.com/?xs=1&id=xxxxxxx&sref=http%3A%2F%2Fwww.vulture.com%2F2018%2F05%2Fthe-end-of-nature-at-storm-king-art-center-in-new-york.html&xcust=xxxxxxxx&url=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FNathaniel_Parker_Willis";
    const target = "https://en.wikipedia.org/wiki/Nathaniel_Parker_Willis";
    const redirectRule = new RedirectRule(0, "{search.url|decodeURIComponent}");
    t.is(redirectRule.apply(request), target);
});

test("Set Search Parameter", t => {
    const request = "http://example.com/?query=none";
    const target = "http://example.com/?query=set";
    const redirectRule = new RedirectRule(0, "[search.query=set]");
    t.is(redirectRule.apply(request), target);
});

test("Set Search Parameter - encode", t => {
    const request = "http://example.com/?query=none";
    const target = "http://example.com/?query=http%3A%2F%2Fexample.com";
    const redirectRule = new RedirectRule(0, "[search.query={origin|encodeURIComponent}]");
    t.is(redirectRule.apply(request), target);
});

test("Capture Search Parameter - not found", t => {
    const request = "http://go.redirectingat.com/?xs=1&id=xxxxxxx&sref=http%3A%2F%2Fwww.vulture.com%2F2018%2F05%2Fthe-end-of-nature-at-storm-king-art-center-in-new-york.html&xcust=xxxxxxxx&url=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FNathaniel_Parker_Willis";
    const redirectRule = new RedirectRule(0, "{search.foo|decodeURIComponent}");
    t.is(redirectRule.apply(request), "");
});

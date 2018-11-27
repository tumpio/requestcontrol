import test from "ava";
import {RedirectRule} from "../src/RequestControl/redirect";

test("Decode URI Component", t => {
    const request = "http://go.redirectingat.com/?xs=1&id=xxxxxxx&sref=http%3A%2F%2Fwww.vulture.com%2F2018%2F05%2Fthe-end-of-nature-at-storm-king-art-center-in-new-york.html&xcust=xxxxxxxx&url=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FNathaniel_Parker_Willis";
    const target = "https://en.wikipedia.org/wiki/Nathaniel_Parker_Willis";
    const redirectRule = new RedirectRule(0, "{href/.*url=(.*)/$1|decodeURIComponent}");
    t.is(redirectRule.apply(request), target);
});

test("Encode URI Component", t => {
    const request = "https://en.wikipedia.org/wiki/Nathaniel_Parker_Willis";
    const target = "http://go.redirectingat.com/?xs=1&id=xxxxxxx&sref=http%3A%2F%2Fwww.vulture.com%2F2018%2F05%2Fthe-end-of-nature-at-storm-king-art-center-in-new-york.html&xcust=xxxxxxxx&url=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FNathaniel_Parker_Willis";
    const redirectRule = new RedirectRule(0, "http://go.redirectingat.com/?xs=1&id=xxxxxxx&sref=http%3A%2F%2Fwww.vulture.com%2F2018%2F05%2Fthe-end-of-nature-at-storm-king-art-center-in-new-york.html&xcust=xxxxxxxx&url={href|encodeURIComponent}");
    t.is(redirectRule.apply(request), target);
});

test("Decode URI", t => {
    const request = "https://mozilla.org/?x=%D1%88%D0%B5%D0%BB%D0%BB%D1%8B";
    const target = "https://mozilla.org/?x=шеллы";
    const redirectRule = new RedirectRule(0, "{href|decodeURI}");
    t.is(redirectRule.apply(request), target);
});

test("Encode URI", t => {
    // URL encodes given URI
    const request = "https://mozilla.org/?x=шеллы";
    const target = "https://mozilla.org/?x=%D1%88%D0%B5%D0%BB%D0%BB%D1%8B";
    const redirectRule = new RedirectRule(0, "{href|decodeUri|encodeUri}");
    t.is(redirectRule.apply(request), target);
});

test("Encode Base64", t => {
    // URL encodes given URI
    const request = "http://www.imdb.com/title/tt0137523/";
    const target = "http://base64.derefer.me/?aHR0cDovL3d3dy5pbWRiLmNvbS90aXRsZS90dDAxMzc1MjMv";
    const redirectRule = new RedirectRule(0, "http://base64.derefer.me/?{href|encodeBase64}");
    t.is(redirectRule.apply(request), target);
});

test("Decode Base64", t => {
    // URL encodes given URI
    const request = "http://base64.derefer.me/?aHR0cDovL3d3dy5pbWRiLmNvbS90aXRsZS90dDAxMzc1MjMv";
    const target = "http://www.imdb.com/title/tt0137523/";
    const redirectRule = new RedirectRule(0, "{search:1|decodeBase64}");
    t.is(redirectRule.apply(request), target);
});

test("Decode - Encode Base64", t => {
    // URL encodes given URI
    const request = "http://www.imdb.com/title/tt0137523/";
    const target = "http://www.imdb.com/title/tt0137523/a";
    const redirectRule = new RedirectRule(0, "{href|encodeBase64|decodeBase64}a");
    t.is(redirectRule.apply(request), target);
});

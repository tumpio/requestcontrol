import test from 'ava';
import {URL} from 'url';
import {RedirectRule} from '../src/RequestControl';

test('Decode URI Component', t => {
    const request = new URL('http://go.redirectingat.com/?xs=1&id=xxxxxxx&sref=http%3A%2F%2Fwww.vulture.com%2F2018%2F05%2Fthe-end-of-nature-at-storm-king-art-center-in-new-york.html&xcust=xxxxxxxx&url=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FNathaniel_Parker_Willis');
    const target = new URL("https://en.wikipedia.org/wiki/Nathaniel_Parker_Willis");
    const redirectRule = new RedirectRule(0, "{href/.*url=(.*)/$1|decodeURIComponent}");
    t.is(redirectRule.apply(request).href, target.href);
});

test('Encode URI Component', t => {
    const request = new URL('https://en.wikipedia.org/wiki/Nathaniel_Parker_Willis');
    const target = new URL("http://go.redirectingat.com/?xs=1&id=xxxxxxx&sref=http%3A%2F%2Fwww.vulture.com%2F2018%2F05%2Fthe-end-of-nature-at-storm-king-art-center-in-new-york.html&xcust=xxxxxxxx&url=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FNathaniel_Parker_Willis");
    const redirectRule = new RedirectRule(0, "http://go.redirectingat.com/?xs=1&id=xxxxxxx&sref=http%3A%2F%2Fwww.vulture.com%2F2018%2F05%2Fthe-end-of-nature-at-storm-king-art-center-in-new-york.html&xcust=xxxxxxxx&url={href|encodeURIComponent}");
    t.is(redirectRule.apply(request).href, target.href);
});

test('Decode URI', t => {
    const request = new URL('https://mozilla.org/?x=%D1%88%D0%B5%D0%BB%D0%BB%D1%8B');
    const target = new URL("https://mozilla.org/?x=шеллы");
    const redirectRule = new RedirectRule(0, "{href|decodeuri}");
    t.is(redirectRule.apply(request).href, target.href);
});

test('Encode URI', t => {
    // URL encodes given URI
    const request = new URL('https://mozilla.org/?x=шеллы');
    const target = new URL("https://mozilla.org/?x=%D1%88%D0%B5%D0%BB%D0%BB%D1%8B");
    const redirectRule = new RedirectRule(0, "{href|decodeUri|encodeUri}");
    t.is(redirectRule.apply(request).href, target.href);
});

test('Encode Base64', t => {
    // URL encodes given URI
    const request = new URL('http://www.imdb.com/title/tt0137523/');
    const target = new URL("http://base64.derefer.me/?aHR0cDovL3d3dy5pbWRiLmNvbS90aXRsZS90dDAxMzc1MjMv");
    const redirectRule = new RedirectRule(0, "http://base64.derefer.me/?{href|encodeBase64}");
    t.is(redirectRule.apply(request).href, target.href);
});

test('Decode Base64', t => {
    // URL encodes given URI
    const request = new URL('http://base64.derefer.me/?aHR0cDovL3d3dy5pbWRiLmNvbS90aXRsZS90dDAxMzc1MjMv');
    const target = new URL('http://www.imdb.com/title/tt0137523/');
    const redirectRule = new RedirectRule(0, "{search:1|decodeBase64}");
    t.is(redirectRule.apply(request).href, target.href);
});

test('Decode - Encode Base64', t => {
    // URL encodes given URI
    const request = new URL('http://www.imdb.com/title/tt0137523/');
    const target = new URL('http://www.imdb.com/title/tt0137523/a');
    const redirectRule = new RedirectRule(0, "{href|encodeBase64|decodeBase64}a");
    t.is(redirectRule.apply(request).href, target.href);
});

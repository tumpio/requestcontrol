import test from "ava";
import { createRule } from "../src/main/api";
import { RequestController } from "../src/main/control";

test.beforeEach(t => {
    t.context.controller = new RequestController(() => {}, () => Promise.resolve());
    t.context.request = {requestId: 0, url: "http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%2Fbar.com%2F"};
    t.context.blockRule = createRule({action: "block"});
    t.context.whitelistRule = createRule({action: "whitelist"});
    t.context.logRule = createRule({action: "whitelist", log: true});
    t.context.filterRule = createRule({action: "filter"});
    t.context.redirectRule = createRule({
        action: "redirect",
        redirectUrl: "https://redirect.url/"
    });
    t.context.filterParamsRule = createRule({
        "action": "filter",
        "skipRedirectionFilter": true,
        "paramsFilter": {
            "values": [
                "utm_*",
                "/./"
            ]
        }
    });
});

test.afterEach(t => {
    t.true(t.context.controller.requests.size === 0);
});

test("Resolve non-marked request", t => {
    let resolve = t.context.controller.resolve(t.context.request);
    t.falsy(resolve);
});

test("Resolve request after clear", t => {
    t.context.controller.mark(t.context.request, t.context.blockRule);
    t.is(t.context.controller.requests.size, 1);
    t.context.controller.requests.clear();
    let resolve = t.context.controller.resolve(t.context.request);
    t.falsy(resolve);
});

test("Rule creation fails", t => {
    t.throws(() => {
        createRule("no-action");
    }, Error);
});

test("Request blocked", t => {
    t.context.controller.mark(t.context.request, t.context.filterRule);
    t.context.controller.mark(t.context.request, t.context.blockRule);
    t.context.controller.mark(t.context.request, t.context.redirectRule);
    t.is(t.context.controller.requests.size, 1);
    let resolve = t.context.controller.resolve(t.context.request);
    t.true(resolve.cancel);
});

test("Request whitelisted", t => {
    t.context.controller.mark(t.context.request, t.context.filterRule);
    t.context.controller.mark(t.context.request, t.context.whitelistRule);
    t.context.controller.mark(t.context.request, t.context.blockRule);
    t.context.controller.mark(t.context.request, t.context.redirectRule);
    let resolve = t.context.controller.resolve(t.context.request);
    t.falsy(resolve);
});

test("Request whitelisted and logged", t => {
    t.context.controller.mark(t.context.request, t.context.filterRule);
    t.context.controller.mark(t.context.request, t.context.logRule);
    t.context.controller.mark(t.context.request, t.context.blockRule);
    t.context.controller.mark(t.context.request, t.context.redirectRule);
    let resolve = t.context.controller.resolve(t.context.request);
    t.falsy(resolve);
});

test("Request redirected", t => {
    t.context.controller.mark(t.context.request, t.context.redirectRule);
    let resolve = t.context.controller.resolve(t.context.request);
    t.is(resolve.redirectUrl, "https://redirect.url/");
});

test("Request filtered", t => {
    t.context.controller.mark(t.context.request, t.context.filterRule);
    let resolve = t.context.controller.resolve(t.context.request);
    t.is(resolve.redirectUrl, "http://bar.com/");
});

test("Request filtered - rules not applied", t => {
    let request = {requestId: 0, url: "http://bar.com/"};
    t.context.controller.mark(request, t.context.filterRule);
    let resolve = t.context.controller.resolve(request, t.context.callback);
    t.falsy(resolve);
});

test("Request filtered - skip redirection filter", t => {
    t.context.request.url += "&utm_source=blaa";
    t.context.controller.mark(t.context.request, t.context.filterParamsRule);
    let resolve = t.context.controller.resolve(t.context.request);
    t.is(resolve.redirectUrl, "http://foo.com/click?url=http%3A%2F%2Fbar.com%2F");
});

test("Request filtered - redirect document on other types", t => {
    t.context.request.type = "sub_frame";
    t.context.filterRule.redirectDocument = true;
    t.context.controller.mark(t.context.request, t.context.filterRule);
    let resolve = t.context.controller.resolve(t.context.request);
    t.true(resolve.cancel);
});

test("Request redirected - redirect document on other types", t => {
    t.context.request.type = "sub_frame";
    t.context.redirectRule.redirectDocument = true;
    t.context.controller.mark(t.context.request, t.context.redirectRule);
    let resolve = t.context.controller.resolve(t.context.request);
    t.true(resolve.cancel);
});

test("Request redirected - redirect rule overrides filter rule", t => {
    t.context.request.url = "http://foo.com/?utm_source=blaa";
    t.context.controller.mark(t.context.request, createRule({
        action: "redirect",
        redirectUrl: "[hostname=bar.com]"
    }));
    t.context.controller.mark(t.context.request, t.context.filterParamsRule);
    
    let resolve = t.context.controller.resolve(t.context.request);
    t.is(resolve.redirectUrl, "http://bar.com/?utm_source=blaa");
});

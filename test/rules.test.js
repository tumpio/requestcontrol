import test from "ava";
import { createRule } from "../src/RequestControl/api";
import { RequestController } from "../src/RequestControl/control";

test.beforeEach(t => {
    t.context.controller = new RequestController();
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
    t.context.call_times = 0;
    t.context.callback = function (request, action) {
        t.context.call_times++;
        t.truthy(request);
        t.truthy(action);
    };
    t.context.callback_called = function (times) {
        return t.context.call_times === times;
    };
});

test.afterEach(t => {
    t.true(t.context.controller.markedRequests.size === 0);
});

test("Resolve non-marked request", t => {
    let resolve = t.context.controller.resolve(t.context.request, t.context.callback);
    t.falsy(resolve);
    t.true(t.context.callback_called(0));
});

test("Rule creation fails", t => {
    t.throws(() => {
        createRule("no-action");
    }, Error);
    t.true(t.context.callback_called(0));
});

test("Request blocked", t => {
    t.context.controller.markRequest(t.context.request, t.context.filterRule);
    t.context.controller.markRequest(t.context.request, t.context.blockRule);
    t.context.controller.markRequest(t.context.request, t.context.redirectRule);
    t.is(t.context.controller.markedRequests.size, 1);
    let resolve = t.context.controller.resolve(t.context.request, t.context.callback);
    t.true(resolve.cancel);
    t.true(t.context.callback_called(1));
});

test("Request whitelisted", t => {
    t.context.controller.markRequest(t.context.request, t.context.filterRule);
    t.context.controller.markRequest(t.context.request, t.context.whitelistRule);
    t.context.controller.markRequest(t.context.request, t.context.blockRule);
    t.context.controller.markRequest(t.context.request, t.context.redirectRule);
    let resolve = t.context.controller.resolve(t.context.request, t.context.callback);
    t.falsy(resolve);
    t.true(t.context.callback_called(0));
});

test("Request whitelisted and logged", t => {
    t.context.controller.markRequest(t.context.request, t.context.filterRule);
    t.context.controller.markRequest(t.context.request, t.context.logRule);
    t.context.controller.markRequest(t.context.request, t.context.blockRule);
    t.context.controller.markRequest(t.context.request, t.context.redirectRule);
    let resolve = t.context.controller.resolve(t.context.request, t.context.callback);
    t.falsy(resolve);
    t.true(t.context.callback_called(1));
});

test("Request redirected", t => {
    t.context.controller.markRequest(t.context.request, t.context.redirectRule);
    let resolve = t.context.controller.resolve(t.context.request, t.context.callback);
    t.is(resolve.redirectUrl, "https://redirect.url/");
    t.true(t.context.callback_called(1));
});

test("Request filtered", t => {
    t.context.controller.markRequest(t.context.request, t.context.filterRule);
    let resolve = t.context.controller.resolve(t.context.request, t.context.callback);
    t.is(resolve.redirectUrl, "http://bar.com/");
    t.true(t.context.callback_called(1));
});

test("Request filtered - rules not applied", t => {
    let request = {requestId: 0, url: "http://bar.com/"};
    t.context.controller.markRequest(request, t.context.filterRule);
    let resolve = t.context.controller.resolve(t.context.request, t.context.callback);
    t.falsy(resolve);
    t.true(t.context.callback_called(0));
});

test("Request filtered - skip redirection filter", t => {
    t.context.request.url += "&utm_source=blaa";
    t.context.controller.markRequest(t.context.request, t.context.filterParamsRule);
    let resolve = t.context.controller.resolve(t.context.request, t.context.callback);
    t.is(resolve.redirectUrl, "http://foo.com/click?url=http%3A%2F%2Fbar.com%2F");
    t.true(t.context.callback_called(1));
});

test("Request filtered - redirect document on other types", t => {
    t.context.request.type = "sub_frame";
    t.context.filterRule.redirectDocument = true;
    t.context.controller.markRequest(t.context.request, t.context.filterRule);
    let resolve = t.context.controller.resolve(t.context.request, function (request, action, updateTab) {
        t.true(updateTab);
        t.is(request.redirectUrl, "http://bar.com/");
        t.context.call_times++;
    });
    t.true(resolve.cancel);
    t.true(t.context.callback_called(1));
});

test("Request redirected - redirect document on other types", t => {
    t.context.request.type = "sub_frame";
    t.context.redirectRule.redirectDocument = true;
    t.context.controller.markRequest(t.context.request, t.context.redirectRule);
    let resolve = t.context.controller.resolve(t.context.request, function (request, action, updateTab) {
        t.true(updateTab);
        t.is(request.redirectUrl, "https://redirect.url/");
        t.context.call_times++;
    });
    t.true(resolve.cancel);
    t.true(t.context.callback_called(1));
});

test("Request filtered - multiple rules", t => {
    t.context.request.url += decodeURIComponent("?utm_source=blaa&a=b");
    t.context.controller.markRequest(t.context.request, createRule({
        action: "redirect",
        redirectUrl: "{href/http%3A/https%3A}"
    }));
    t.context.controller.markRequest(t.context.request, t.context.filterRule);
    t.context.controller.markRequest(t.context.request, t.context.filterParamsRule);
    let resolve = t.context.controller.resolve(t.context.request, t.context.callback);
    t.is(resolve.redirectUrl, "https://bar.com/");
    t.true(t.context.callback_called(1));
});

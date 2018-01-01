import test from 'ava';
import {
    RequestControl
} from '../src/RequestControl';

test.beforeEach(t => {
    t.context.request = {url: "http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%2Fbar.com%2F"};
    t.context.blockRule = RequestControl.createRule(0, {action: "block"});
    t.context.whitelistRule = RequestControl.createRule(1, {action: "whitelist"});
    t.context.filterRule = RequestControl.createRule(2, {action: "filter"});
    t.context.redirectRule = RequestControl.createRule(3, {
        action: "redirect",
        redirectUrl: "https://redirect.url/"
    });
    t.context.filterParamsRule = RequestControl.createRule(4, {
        "action": "filter",
        "skipRedirectionFilter": true,
        "paramsFilter": {
            "values": [
                "utm_*",
                "/./"
            ]
        }
    });
    t.context.callback = function (request, action) {
        t.truthy(request);
        t.truthy(action);
    }
});


test('Rule creation fails', t => {
    t.throws(() => {
        RequestControl.createRule(0, "no-action");
    }, Error);
});

test('Request blocked', t => {
    RequestControl.markRule(t.context.request, t.context.filterRule);
    RequestControl.markRule(t.context.request, t.context.blockRule);
    RequestControl.markRule(t.context.request, t.context.redirectRule);
    let resolve = t.context.request.resolve(t.context.callback);
    t.true(resolve.cancel);
});

test('Request whitelisted', t => {
    RequestControl.markRule(t.context.request, t.context.filterRule);
    RequestControl.markRule(t.context.request, t.context.whitelistRule);
    RequestControl.markRule(t.context.request, t.context.blockRule);
    RequestControl.markRule(t.context.request, t.context.redirectRule);
    let resolve = t.context.request.resolve(t.context.callback);
    t.falsy(resolve);
});

test('Request redirected', t => {
    RequestControl.markRule(t.context.request, t.context.redirectRule);
    let resolve = t.context.request.resolve(t.context.callback);
    t.is(resolve.redirectUrl, "https://redirect.url/");
});

test('Request filtered', t => {
    RequestControl.markRule(t.context.request, t.context.filterRule);
    let resolve = t.context.request.resolve(t.context.callback);
    t.is(resolve.redirectUrl, "http://bar.com/");
});

test('Request filtered - rules not applied', t => {
    let request = {url: "http://bar.com/"};
    RequestControl.markRule(request, t.context.filterRule);
    let resolve = request.resolve(t.context.callback);
    t.falsy(resolve);
});

test('Request filtered - skip redirection filter', t => {
    t.context.request.url += "&utm_source=blaa";
    RequestControl.markRule(t.context.request, t.context.filterParamsRule);
    let resolve = t.context.request.resolve(t.context.callback);
    t.is(resolve.redirectUrl, "http://foo.com/click?url=http%3A%2F%2Fbar.com%2F");
});

test('Request filtered - block sub_frame redirection', t => {
    t.context.request.type = "sub_frame";
    RequestControl.markRule(t.context.request, t.context.filterRule);
    let resolve = t.context.request.resolve(function (request, action, updateTab) {
        t.true(updateTab);
        t.is(request.redirectUrl, "http://bar.com/");
    });
    t.true(resolve.cancel);
});

test('Request filtered - multiple rules', t => {
    t.context.request.url += decodeURIComponent("?utm_source=blaa&a=b");
    RequestControl.markRule(t.context.request, RequestControl.createRule(5, {
        action: "redirect",
        redirectUrl: "{href/http%3A/https%3A}"
    }));
    RequestControl.markRule(t.context.request, t.context.filterRule);
    RequestControl.markRule(t.context.request, t.context.filterParamsRule);
    let resolve = t.context.request.resolve(t.context.callback);
    t.is(resolve.redirectUrl, "https://bar.com/");
});
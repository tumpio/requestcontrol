import test from 'ava';
import {
    RequestControl, InvalidUrlException
} from '../src/RequestControl';

test.beforeEach(t => {
    t.context.request = {url: "http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%2Fbar.com%2F"};
    t.context.blockRule = RequestControl.createRule({action: "block"});
    t.context.whitelistRule = RequestControl.createRule({action: "whitelist"});
    t.context.logRule = RequestControl.createRule({action: "whitelist", log: true});
    t.context.filterRule = RequestControl.createRule({action: "filter"});
    t.context.redirectRule = RequestControl.createRule({
        action: "redirect",
        redirectUrl: "https://redirect.url/"
    });
    t.context.filterParamsRule = RequestControl.createRule({
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
    }
});


test('Rule creation fails', t => {
    t.throws(() => {
        RequestControl.createRule("no-action");
    }, Error);
    t.true(t.context.callback_called(0));
});

test('Request blocked', t => {
    RequestControl.markRule(t.context.request, t.context.filterRule);
    RequestControl.markRule(t.context.request, t.context.blockRule);
    RequestControl.markRule(t.context.request, t.context.redirectRule);
    let resolve = t.context.request.resolve(t.context.callback);
    t.true(resolve.cancel);
    t.true(t.context.callback_called(1));
});

test('Request whitelisted', t => {
    RequestControl.markRule(t.context.request, t.context.filterRule);
    RequestControl.markRule(t.context.request, t.context.whitelistRule);
    RequestControl.markRule(t.context.request, t.context.blockRule);
    RequestControl.markRule(t.context.request, t.context.redirectRule);
    let resolve = t.context.request.resolve(t.context.callback);
    t.falsy(resolve);
    t.true(t.context.callback_called(0));
});

test('Request whitelisted and logged', t => {
    RequestControl.markRule(t.context.request, t.context.filterRule);
    RequestControl.markRule(t.context.request, t.context.logRule);
    RequestControl.markRule(t.context.request, t.context.blockRule);
    RequestControl.markRule(t.context.request, t.context.redirectRule);
    let resolve = t.context.request.resolve(t.context.callback);
    t.falsy(resolve);
    t.true(t.context.callback_called(1));
});

test('Request redirected', t => {
    RequestControl.markRule(t.context.request, t.context.redirectRule);
    let resolve = t.context.request.resolve(t.context.callback);
    t.is(resolve.redirectUrl, "https://redirect.url/");
    t.true(t.context.callback_called(1));
});

test('Request filtered', t => {
    RequestControl.markRule(t.context.request, t.context.filterRule);
    let resolve = t.context.request.resolve(t.context.callback);
    t.is(resolve.redirectUrl, "http://bar.com/");
    t.true(t.context.callback_called(1));
});

test('Request filtered - rules not applied', t => {
    let request = {url: "http://bar.com/"};
    RequestControl.markRule(request, t.context.filterRule);
    let resolve = request.resolve(t.context.callback);
    t.falsy(resolve);
    t.true(t.context.callback_called(0));
});

test('Request filtered - skip redirection filter', t => {
    t.context.request.url += "&utm_source=blaa";
    RequestControl.markRule(t.context.request, t.context.filterParamsRule);
    let resolve = t.context.request.resolve(t.context.callback);
    t.is(resolve.redirectUrl, "http://foo.com/click?url=http%3A%2F%2Fbar.com%2F");
    t.true(t.context.callback_called(1));
});

test('Request filtered - block sub_frame redirection', t => {
    t.context.request.type = "sub_frame";
    RequestControl.markRule(t.context.request, t.context.filterRule);
    let resolve = t.context.request.resolve(function (request, action, updateTab) {
        t.true(updateTab);
        t.is(request.redirectUrl, "http://bar.com/");
        t.context.call_times++;
    });
    t.true(resolve.cancel);
    t.true(t.context.callback_called(1));
});

test('Request filtered - multiple rules', t => {
    t.context.request.url += decodeURIComponent("?utm_source=blaa&a=b");
    RequestControl.markRule(t.context.request, RequestControl.createRule({
        action: "redirect",
        redirectUrl: "{href/http%3A/https%3A}"
    }));
    RequestControl.markRule(t.context.request, t.context.filterRule);
    RequestControl.markRule(t.context.request, t.context.filterParamsRule);
    let resolve = t.context.request.resolve(t.context.callback);
    t.is(resolve.redirectUrl, "https://bar.com/");
    t.true(t.context.callback_called(1));
});

test('Error callback', t => {
    RequestControl.markRule(t.context.request, RequestControl.createRule({
        action: "redirect",
        redirectUrl: "_"
    }));
    let resolve = t.context.request.resolve(null, (request, rule, error) => {
        t.truthy(error instanceof InvalidUrlException);
        t.context.call_times++;
    });
    t.true(t.context.callback_called(1));
});
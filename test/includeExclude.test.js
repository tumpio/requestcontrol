import test from "ava";
import * as RequestControl from "../src/RequestControl/api";

test.beforeEach(t => {
    t.context.request = {url: "http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%2Fbar.com%2F"};
});

test("Include match extender - match", t => {
    let rule = RequestControl.createRule({
        action: "filter",
        pattern: {
            includes: ["cl?ck", "/a=[0-9]+/", "FOO"]
        }
    });
    t.truthy(RequestControl.markRequest(t.context.request, rule));
});

test("Include match extender - no match", t => {
    let rule = RequestControl.createRule({
        action: "filter",
        pattern: {
            includes: ["clock", "/a=[a-z]+/"]
        }
    });
    t.falsy(RequestControl.markRequest(t.context.request, rule));
});

test("Exclude match extender - match", t => {
    let rule = RequestControl.createRule({
        action: "filter",
        pattern: {
            excludes: ["cl?ck", "/a=\\d+/"]
        }
    });
    t.falsy(RequestControl.markRequest(t.context.request, rule));
});

test("Exclude match extender - no match", t => {
    let rule = RequestControl.createRule({
        action: "filter",
        pattern: {
            excludes: ["clock", "/a=[a-z]+/"]
        }
    });
    t.truthy(RequestControl.markRequest(t.context.request, rule));
});

test("Combined include, exclude - match include", t => {
    let rule = RequestControl.createRule({
        action: "filter",
        pattern: {
            includes: ["click"],
            excludes: ["clock"]
        }
    });
    t.truthy(RequestControl.markRequest(t.context.request, rule));
});

test("Combined include, exclude - no match", t => {
    let rule = RequestControl.createRule({
        action: "filter",
        pattern: {
            includes: ["clock"],
            excludes: ["clock"]
        }
    });
    t.falsy(RequestControl.markRequest(t.context.request, rule));
});

test("Combined include, exclude - match both", t => {
    let rule = RequestControl.createRule({
        action: "filter",
        pattern: {
            includes: ["click"],
            excludes: ["click"]
        }
    });
    t.falsy(RequestControl.markRequest(t.context.request, rule));
});

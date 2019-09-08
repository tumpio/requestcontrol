import test from "ava";
import * as RequestControl from "../src/RequestControl/api";
import { RequestController } from "../src/RequestControl/control";

test.beforeEach(t => {
    t.context.request = { url: "http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%2Fbar.com%2F" };
    t.context.controller = new RequestController();
});

test("Include match extender - match", t => {
    let rule = RequestControl.createRule({
        action: "filter",
        pattern: {
            includes: ["cl?ck", "/a=[0-9]+/", "FOO"]
        }
    });
    t.truthy(t.context.controller.markRequest(t.context.request, rule));
});

test("Include match extender - no match", t => {
    let rule = RequestControl.createRule({
        action: "filter",
        pattern: {
            includes: ["clock", "/a=[a-z]+/"]
        }
    });
    t.falsy(t.context.controller.markRequest(t.context.request, rule));
});

test("Exclude match extender - match", t => {
    let rule = RequestControl.createRule({
        action: "filter",
        pattern: {
            excludes: ["cl?ck", "/a=\\d+/"]
        }
    });
    t.falsy(t.context.controller.markRequest(t.context.request, rule));
});

test("Exclude match extender - no match", t => {
    let rule = RequestControl.createRule({
        action: "filter",
        pattern: {
            excludes: ["clock", "/a=[a-z]+/"]
        }
    });
    t.truthy(t.context.controller.markRequest(t.context.request, rule));
});

test("Combined include, exclude - match include", t => {
    let rule = RequestControl.createRule({
        action: "filter",
        pattern: {
            includes: ["click"],
            excludes: ["clock"]
        }
    });
    t.truthy(t.context.controller.markRequest(t.context.request, rule));
});

test("Combined include, exclude - no match", t => {
    let rule = RequestControl.createRule({
        action: "filter",
        pattern: {
            includes: ["clock"],
            excludes: ["clock"]
        }
    });
    t.falsy(t.context.controller.markRequest(t.context.request, rule));
});

test("Combined include, exclude - match both", t => {
    let rule = RequestControl.createRule({
        action: "filter",
        pattern: {
            includes: ["click"],
            excludes: ["click"]
        }
    });
    t.falsy(t.context.controller.markRequest(t.context.request, rule));
});

test("Invalid regexp - treated as literal string", t => {
    let rule = RequestControl.createRule({
        action: "filter",
        pattern: {
            excludes: ["/click\\/"]
        }
    });
    t.falsy(t.context.controller.markRequest({ url: "http://click\\/" }, rule));
});

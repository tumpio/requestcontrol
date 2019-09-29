import * as RequestControl from "../src/main/api";
import { RequestController } from "../src/main/control";

let request;
let controller;

beforeEach(() => {
    request = { url: "http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%2Fbar.com%2F" };
    controller = new RequestController();
});

test("Include match extender - match", () => {
    let rule = RequestControl.createRule({
        action: "filter",
        pattern: {
            includes: ["cl?ck", "/a=[0-9]+/", "FOO"]
        }
    });
    expect(controller.mark(request, rule)).toBeTruthy();
});

test("Include match extender - no match", () => {
    let rule = RequestControl.createRule({
        action: "filter",
        pattern: {
            includes: ["clock", "/a=[a-z]+/"]
        }
    });
    expect(controller.mark(request, rule)).toBeFalsy();
});

test("Exclude match extender - match", () => {
    let rule = RequestControl.createRule({
        action: "filter",
        pattern: {
            excludes: ["cl?ck", "/a=\\d+/"]
        }
    });
    expect(controller.mark(request, rule)).toBeFalsy();
});

test("Exclude match extender - no match", () => {
    let rule = RequestControl.createRule({
        action: "filter",
        pattern: {
            excludes: ["clock", "/a=[a-z]+/"]
        }
    });
    expect(controller.mark(request, rule)).toBeTruthy();
});

test("Combined include, exclude - match include", () => {
    let rule = RequestControl.createRule({
        action: "filter",
        pattern: {
            includes: ["click"],
            excludes: ["clock"]
        }
    });
    expect(controller.mark(request, rule)).toBeTruthy();
});

test("Combined include, exclude - no match", () => {
    let rule = RequestControl.createRule({
        action: "filter",
        pattern: {
            includes: ["clock"],
            excludes: ["clock"]
        }
    });
    expect(controller.mark(request, rule)).toBeFalsy();
});

test("Combined include, exclude - match both", () => {
    let rule = RequestControl.createRule({
        action: "filter",
        pattern: {
            includes: ["click"],
            excludes: ["click"]
        }
    });
    expect(controller.mark(request, rule)).toBeFalsy();
});

test("Invalid regexp - treated as literal string", () => {
    let rule = RequestControl.createRule({
        action: "filter",
        pattern: {
            excludes: ["/click\\/"]
        }
    });
    expect(controller.mark({ url: "http://click\\/" }, rule)).toBeFalsy();
});

import { createRule } from "../src/main/api";
import { RequestController } from "../src/main/control";

let controller;
let request;
let blockRule;
let whitelistRule;
let logRule;
let filterRule;
let redirectRule;
let filterParamsRule;
let mockNotify;
let mockUpdateTab;

beforeEach(() => {
    mockNotify = jest.fn();
    mockUpdateTab = jest.fn();
    controller = new RequestController(mockNotify, mockUpdateTab);
    request = { requestId: 0, url: "http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%2Fbar.com%2F" };
    blockRule = createRule({ action: "block" });
    whitelistRule = createRule({ action: "whitelist" });
    logRule = createRule({ action: "whitelist", log: true });
    filterRule = createRule({ action: "filter" });
    redirectRule = createRule({
        action: "redirect",
        redirectUrl: "https://redirect.url/"
    });
    filterParamsRule = createRule({
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

afterEach(() => {
    expect(controller.requests.size).toBe(0);
});

describe("Resolving non-marked requests", () => {
    afterEach(() => {
        expect(mockNotify.mock.calls.length).toBe(0);
        expect(mockUpdateTab.mock.calls.length).toBe(0);
    });

    test("Resolve non-marked request", () => {
        const resolve = controller.resolve(request);
        expect(resolve).toBeFalsy();
    });

    test("Resolve marked request after clear", () => {
        controller.mark(request, blockRule);
        expect(controller.requests.size).toBe(1);
        controller.requests.clear();
        const resolve = controller.resolve(request);
        expect(resolve).toBeFalsy();
    });
});

test("Rule creation fails", () => {
    expect(() => {
        createRule("no-action");
    }).toThrowError(Error);
});

describe("user is not notified", () => {
    afterEach(() => {
        expect(mockNotify.mock.calls.length).toBe(0);
    });

    test("when request is whitelisted", () => {
        controller.mark(request, filterRule);
        controller.mark(request, whitelistRule);
        controller.mark(request, blockRule);
        controller.mark(request, redirectRule);
        const resolve = controller.resolve(request);
        expect(resolve).toBeFalsy();
    });

    test("when request is filtered and rule is not applied", () => {
        request = { requestId: 0, url: "http://bar.com/" };
        controller.mark(request, filterRule);
        const resolve = controller.resolve(request);
        expect(resolve).toBeFalsy();
    });
});

describe("user is notified", () => {
    afterEach(() => {
        expect(mockNotify.mock.calls.length).toBe(1);
    });

    test("Request blocked", () => {
        controller.mark(request, filterRule);
        controller.mark(request, blockRule);
        controller.mark(request, redirectRule);
        expect(controller.requests.size).toBe(1);
        const resolve = controller.resolve(request);
        expect(resolve.cancel).toBe(true);
    });

    test("Request whitelisted and logged", () => {
        controller.mark(request, filterRule);
        controller.mark(request, logRule);
        controller.mark(request, blockRule);
        controller.mark(request, redirectRule);
        const resolve = controller.resolve(request);
        expect(resolve).toBeFalsy();
    });

    test("Request redirected", () => {
        controller.mark(request, redirectRule);
        const resolve = controller.resolve(request);
        expect(resolve.redirectUrl).toBe("https://redirect.url/");
    });

    test("Request filtered", () => {
        controller.mark(request, filterRule);
        const resolve = controller.resolve(request);
        expect(resolve.redirectUrl).toBe("http://bar.com/");
    });

    test("Request filtered - skip redirection filter", () => {
        request.url += "&utm_source=blaa";
        controller.mark(request, filterParamsRule);
        const resolve = controller.resolve(request);
        expect(resolve.redirectUrl).toBe("http://foo.com/click?url=http%3A%2F%2Fbar.com%2F");
    });

    test("Request redirected - redirect rule overrides filter rule", () => {
        request.url = "http://foo.com/?utm_source=blaa";
        controller.mark(request, createRule({
            action: "redirect",
            redirectUrl: "[hostname=bar.com]"
        }));
        controller.mark(request, filterParamsRule);
        const resolve = controller.resolve(request);
        expect(resolve.redirectUrl).toBe("http://bar.com/?utm_source=blaa");
    });
});

describe("redirect document on other types", () => {
    afterEach(() => {
        expect(mockUpdateTab.mock.calls.length).toBe(1);
        return mockUpdateTab().then(() => expect(mockNotify.mock.calls.length).toBe(1));
    });

    test("Request filtered", () => {
        request.type = "sub_frame";
        filterRule.redirectDocument = true;
        controller.mark(request, filterRule);
        mockUpdateTab.mockReturnValue(Promise.resolve());
        const resolve = controller.resolve(request);
        expect(resolve.cancel).toBe(true);
    });

    test("Request redirected", () => {
        request.type = "sub_frame";
        redirectRule.redirectDocument = true;
        controller.mark(request, redirectRule);
        mockUpdateTab.mockReturnValue(Promise.resolve());
        const resolve = controller.resolve(request);
        expect(resolve.cancel).toBe(true);
    });
});

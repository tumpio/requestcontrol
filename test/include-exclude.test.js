import * as RequestControl from "../src/main/api";

let request;

beforeEach(() => {
    request = { url: "http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%2Fbar.com%2F" };
});

test("Include match extender - match", () => {
    const [filter] = RequestControl.createRequestFilters({
        action: "filter",
        pattern: {
            includes: ["cl?ck", "/a=[0-9]+/", "FOO"],
        },
    });
    expect(filter.matcher.test(request)).toBeTruthy();
});

test("Include match extender - no match", () => {
    const [filter] = RequestControl.createRequestFilters({
        action: "filter",
        pattern: {
            includes: ["clock", "/a=[a-z]+/"],
        },
    });
    expect(filter.matcher.test(request)).toBeFalsy();
});

test("Exclude match extender - match", () => {
    const [filter] = RequestControl.createRequestFilters({
        action: "filter",
        pattern: {
            excludes: ["cl?ck", "/a=\\d+/"],
        },
    });
    expect(filter.matcher.test(request)).toBeFalsy();
});

test("Exclude match extender - no match", () => {
    const [filter] = RequestControl.createRequestFilters({
        action: "filter",
        pattern: {
            excludes: ["clock", "/a=[a-z]+/"],
        },
    });
    expect(filter.matcher.test(request)).toBeTruthy();
});

test("Combined include, exclude - match include", () => {
    const [filter] = RequestControl.createRequestFilters({
        action: "filter",
        pattern: {
            includes: ["click"],
            excludes: ["clock"],
        },
    });
    expect(filter.matcher.test(request)).toBeTruthy();
});

test("Combined include, exclude - no match", () => {
    const [filter] = RequestControl.createRequestFilters({
        action: "filter",
        pattern: {
            includes: ["clock"],
            excludes: ["clock"],
        },
    });
    expect(filter.matcher.test(request)).toBeFalsy();
});

test("Combined include, exclude - match both", () => {
    const [filter] = RequestControl.createRequestFilters({
        action: "filter",
        pattern: {
            includes: ["click"],
            excludes: ["click"],
        },
    });
    expect(filter.matcher.test(request)).toBeFalsy();
});

test("Invalid regexp - treated as literal string", () => {
    const [filter] = RequestControl.createRequestFilters({
        action: "filter",
        pattern: {
            excludes: ["/click\\/"],
        },
    });
    expect(filter.matcher.test({ url: "http://click\\/" })).toBeFalsy();
});

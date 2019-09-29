import {createMatchPatterns, ALL_URLS} from "../src/main/api";


test("Create match patterns", () => {
    expect(createMatchPatterns({allUrls: true})).toEqual([ALL_URLS]);
    expect(createMatchPatterns({
        scheme: "http",
        host: "example.com"
    })).toEqual(["http://example.com/"]);
    expect(createMatchPatterns({
        scheme: "http",
        host: "example.com",
        path: "some/path"
    })).toEqual(["http://example.com/some/path"]);
    expect(createMatchPatterns({
        scheme: "https",
        host: ["first.com", "second.com"],
        path: "some/path"
    }).sort()).toEqual(["https://first.com/some/path", "https://second.com/some/path"].sort());
    expect(createMatchPatterns({
        scheme: "*",
        host: ["first.com", "second.com"],
        path: ["first/path", "second/path"]
    }).sort()).toEqual(
        ["*://first.com/first/path", "*://first.com/second/path", "*://second.com/first/path",
            "*://second.com/second/path"].sort()
    );
    expect(createMatchPatterns({
        scheme: "*",
        host: ["first.com", "second.com"],
        path: ["first/path", "second/path"]
    }).sort()).toEqual(
        ["*://first.com/first/path", "*://first.com/second/path", "*://second.com/first/path",
            "*://second.com/second/path"].sort()
    );
    expect(createMatchPatterns({
        scheme: "https",
        host: ["first.com", "second.*"],
        path: "some/path",
        topLevelDomains: ["com", "org"]
    }).sort()).toEqual(["https://first.com/some/path", "https://second.com/some/path",
        "https://second.org/some/path"].sort());
    expect(createMatchPatterns({
        scheme: "*",
        host: ["first.com", "second.*"],
        path: ["first/path", "second/path"],
        topLevelDomains: ["com", "org"]
    }).sort()).toEqual(
        ["*://first.com/first/path", "*://first.com/second/path", "*://second.com/first/path",
            "*://second.com/second/path", "*://second.org/first/path",
            "*://second.org/second/path"].sort()
    );
    expect(createMatchPatterns({
        scheme: "*",
        host: ["first.com", "second.*"],
        path: ["/first/path", "second/path"],
        topLevelDomains: ["com", "org"]
    }).sort()).toEqual(
        ["*://first.com/first/path", "*://first.com/second/path", "*://second.com/first/path",
            "*://second.com/second/path", "*://second.org/first/path",
            "*://second.org/second/path"].sort()
    );
});

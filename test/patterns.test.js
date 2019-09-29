import test from "ava";
import {createMatchPatterns, ALL_URLS} from "../src/main/api";


test("Create match patterns", t => {
    t.deepEqual(createMatchPatterns({allUrls: true}), [ALL_URLS]);
    t.deepEqual(createMatchPatterns({
        scheme: "http",
        host: "example.com"
    }),
    ["http://example.com/"]);
    t.deepEqual(createMatchPatterns({
        scheme: "http",
        host: "example.com",
        path: "some/path"
    }),
    ["http://example.com/some/path"]);
    t.deepEqual(createMatchPatterns({
        scheme: "https",
        host: ["first.com", "second.com"],
        path: "some/path"
    }).sort(),
    ["https://first.com/some/path", "https://second.com/some/path"].sort());
    t.deepEqual(createMatchPatterns({
        scheme: "*",
        host: ["first.com", "second.com"],
        path: ["first/path", "second/path"]
    }).sort(),
    ["*://first.com/first/path", "*://first.com/second/path", "*://second.com/first/path",
        "*://second.com/second/path"].sort());
    t.deepEqual(createMatchPatterns({
        scheme: "*",
        host: ["first.com", "second.com"],
        path: ["first/path", "second/path"]
    }).sort(),
    ["*://first.com/first/path", "*://first.com/second/path", "*://second.com/first/path",
        "*://second.com/second/path"].sort());
    t.deepEqual(createMatchPatterns({
        scheme: "https",
        host: ["first.com", "second.*"],
        path: "some/path",
        topLevelDomains: ["com", "org"]
    }).sort(),
    ["https://first.com/some/path", "https://second.com/some/path",
        "https://second.org/some/path"].sort());
    t.deepEqual(createMatchPatterns({
        scheme: "*",
        host: ["first.com", "second.*"],
        path: ["first/path", "second/path"],
        topLevelDomains: ["com", "org"]
    }).sort(),
    ["*://first.com/first/path", "*://first.com/second/path", "*://second.com/first/path",
        "*://second.com/second/path", "*://second.org/first/path",
        "*://second.org/second/path"].sort());
    t.deepEqual(createMatchPatterns({
        scheme: "*",
        host: ["first.com", "second.*"],
        path: ["/first/path", "second/path"],
        topLevelDomains: ["com", "org"]
    }).sort(),
    ["*://first.com/first/path", "*://first.com/second/path", "*://second.com/first/path",
        "*://second.com/second/path", "*://second.org/first/path",
        "*://second.org/second/path"].sort());
});

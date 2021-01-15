import { ALL_URLS, createRequestFilters } from "../src/main/api";

test("All urls", () => {
    const filters = createRequestFilters({
        pattern: {
            allUrls: true,
        },
        action: "block",
    });
    expect(filters.length).toBe(1);
    expect(filters[0].urls.length).toBe(1);
    expect(filters[0].urls).toContain(ALL_URLS);
});

test("Any tld when all urls", () => {
    const filters = createRequestFilters({
        pattern: {
            scheme: "*",
            host: "google.*",
            path: "path",
            allUrls: true,
            anyTLD: true,
        },
        action: "block",
    });
    expect(filters.length).toBe(1);
    expect(filters[0].urls.length).toBe(1);
    expect(filters[0].urls).toContain(ALL_URLS);
});

test("Any tld - single wildcard host", () => {
    const filters = createRequestFilters({
        pattern: {
            scheme: "*",
            host: "google.*",
            path: "path",
            anyTLD: true,
        },
        action: "block",
    });
    expect(filters.length).toBe(1);
    expect(filters[0].urls.length).toBe(1);
    expect(filters[0].urls).toContain("*://*/path");
    expect(filters[0].matcher.test({ url: "https://google.com" })).toBeTruthy();
});

test("Any tld - multiple wildcard hosts", () => {
    const filters = createRequestFilters({
        pattern: {
            scheme: "*",
            host: ["google.*", "amazon.*"],
            path: "path",
            anyTLD: true,
        },
        action: "block",
    });
    expect(filters.length).toBe(1);
    expect(filters[0].urls.length).toBe(1);
    expect(filters[0].urls).toContain("*://*/path");
    expect(filters[0].matcher.test({ url: "https://google.org" })).toBeTruthy();
    expect(filters[0].matcher.test({ url: "https://amazon.null" })).toBeTruthy();
});

test("Any tld - without wildcardl", () => {
    const filters = createRequestFilters({
        pattern: {
            scheme: "*",
            host: ["google.com", "amazon.*"],
            path: "path",
            anyTLD: true,
        },
        action: "block",
    });
    expect(filters.length).toBe(2);
    expect(filters[0].urls.length).toBe(1);
    expect(filters[1].urls.length).toBe(1);
    expect(filters[0].urls).toContain("*://*/path");
    expect(filters[1].urls).toContain("*://google.com/path");
    expect(filters[0].matcher.test({ url: "https://amazon.null" })).toBeTruthy();
    expect(filters[1].matcher.test({ url: "https://google.com" })).toBeTruthy();
});

test("*.* - matches all", () => {
    const filters = createRequestFilters({
        pattern: {
            scheme: "*",
            host: "*.*",
            path: "path",
            anyTLD: true,
        },
        action: "block",
    });
    expect(filters.length).toBe(1);
    expect(filters[0].urls.length).toBe(1);
    expect(filters[0].urls).toContain("*://*/path");
    expect(filters[0].matcher.test({ url: "https://amazon.null" })).toBeTruthy();
    expect(filters[0].matcher.test({ url: "https://google.com" })).toBeTruthy();
});

test("no pattern", () => {
    const filters = createRequestFilters({
        action: "block",
    });
    expect(filters.length).toBe(0);
});

test("no data", () => {
    const filters = createRequestFilters();
    expect(filters.length).toBe(0);
});

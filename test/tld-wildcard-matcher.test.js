import { HostnameWithoutSuffixMatcher } from "../src/main/matchers";

test("Domain only", () => {
    const matcher = new HostnameWithoutSuffixMatcher("a.*");

    expect(matcher.test({ url: "https://a.com" })).toBeTruthy();
    expect(matcher.test({ url: "http://a.org" })).toBeTruthy();

    expect(matcher.test({ url: "https://a" })).toBeFalsy();
    expect(matcher.test({ url: "https://b.com" })).toBeFalsy();
    expect(matcher.test({ url: "https://a.b.com" })).toBeFalsy();
    expect(matcher.test({ url: "https://b.a.com" })).toBeFalsy();
    expect(matcher.test({ url: "https://c.b.a.com" })).toBeFalsy();
    expect(matcher.test({ url: "https://192.168.0.1" })).toBeFalsy();
});

test("With subdomain", () => {
    const matcher = new HostnameWithoutSuffixMatcher("b.a.*");

    expect(matcher.test({ url: "https://b.a.com" })).toBeTruthy();
    expect(matcher.test({ url: "http://b.a.org" })).toBeTruthy();

    expect(matcher.test({ url: "https://a.com" })).toBeFalsy();
    expect(matcher.test({ url: "http://a.org" })).toBeFalsy();

    expect(matcher.test({ url: "https://a" })).toBeFalsy();
    expect(matcher.test({ url: "https://b.com" })).toBeFalsy();
    expect(matcher.test({ url: "https://a.b.com" })).toBeFalsy();
    expect(matcher.test({ url: "https://c.b.a.com" })).toBeFalsy();
    expect(matcher.test({ url: "https://192.168.0.1" })).toBeFalsy();
});

test("With subdomain + parts", () => {
    const matcher = new HostnameWithoutSuffixMatcher("d.c.b.a.*");

    expect(matcher.test({ url: "https://d.c.b.a.com" })).toBeTruthy();
    expect(matcher.test({ url: "http://d.c.b.a.co.uk" })).toBeTruthy();

    expect(matcher.test({ url: "https://a.com" })).toBeFalsy();
    expect(matcher.test({ url: "http://b.a.org" })).toBeFalsy();
    expect(matcher.test({ url: "http://c.b.a.org" })).toBeFalsy();

    expect(matcher.test({ url: "https://a" })).toBeFalsy();
    expect(matcher.test({ url: "https://b.com" })).toBeFalsy();
    expect(matcher.test({ url: "https://a.b.com" })).toBeFalsy();
    expect(matcher.test({ url: "https://c.b.a.com" })).toBeFalsy();
    expect(matcher.test({ url: "https://192.168.0.1" })).toBeFalsy();
});

test("Subdomain wildcard", () => {
    const matcher = new HostnameWithoutSuffixMatcher("*.a.*");

    expect(matcher.test({ url: "https://a.com" })).toBeTruthy();
    expect(matcher.test({ url: "http://a.org" })).toBeTruthy();
    expect(matcher.test({ url: "https://b.a.com" })).toBeTruthy();
    expect(matcher.test({ url: "http://b.a.org" })).toBeTruthy();
    expect(matcher.test({ url: "https://c.b.a.com" })).toBeTruthy();
    expect(matcher.test({ url: "https://c.b.a.co.uk" })).toBeTruthy();

    expect(matcher.test({ url: "https://a" })).toBeFalsy();
    expect(matcher.test({ url: "https://aa.com" })).toBeFalsy();
    expect(matcher.test({ url: "https://b.com" })).toBeFalsy();
    expect(matcher.test({ url: "https://a.b.com" })).toBeFalsy();
    expect(matcher.test({ url: "https://192.168.0.1" })).toBeFalsy();
});

test("Subdomain wildcard + parts", () => {
    const matcher = new HostnameWithoutSuffixMatcher("*.b.a.*");

    expect(matcher.test({ url: "https://b.a.com" })).toBeTruthy();
    expect(matcher.test({ url: "http://b.a.org" })).toBeTruthy();
    expect(matcher.test({ url: "https://c.b.a.com" })).toBeTruthy();
    expect(matcher.test({ url: "https://c.b.a.co.uk" })).toBeTruthy();

    expect(matcher.test({ url: "https://cb.a.com" })).toBeFalsy();
    expect(matcher.test({ url: "https://cb.a.co.uk" })).toBeFalsy();

    expect(matcher.test({ url: "https://a.com" })).toBeFalsy();
    expect(matcher.test({ url: "http://a.org" })).toBeFalsy();
    expect(matcher.test({ url: "https://a" })).toBeFalsy();
    expect(matcher.test({ url: "https://b.com" })).toBeFalsy();
    expect(matcher.test({ url: "https://a.b.com" })).toBeFalsy();
    expect(matcher.test({ url: "https://192.168.0.1" })).toBeFalsy();
});

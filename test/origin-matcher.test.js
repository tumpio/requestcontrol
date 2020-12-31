import * as RequestControl from "../src/main/api";

test("Same domain - match", () => {
    const url = "http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%2Fbar.com%2F";
    const [filter] = RequestControl.createRequestFilters({
        action: "filter",
        pattern: {
            origin: "same-domain",
        },
    });
    expect(
        filter.matcher.test({
            originUrl: "http://foo.com/",
            url,
        })
    ).toBeTruthy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://foo.com:8000/path.index",
                url,
            }
        )
    ).toBeTruthy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://user@foo.com:8000/path.index",
                url,
            }
        )
    ).toBeTruthy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://user:pass@foo.com:8000/path.index",
                url,
            }
        )
    ).toBeTruthy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://192.0.0.1:8080/path.index",
                url: "http://192.0.0.1:8080",
            }
        )
    ).toBeTruthy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://mail.google.com/path.index",
                url: "http://google.com",
            }
        )
    ).toBeTruthy();
    expect(
        filter.matcher.test(
            {
                url: "http://google.com",
            }
        )
    ).toBeTruthy();
    expect(
        filter.matcher.test(
            {
                originUrl: "http://google.com",
                url: "data:image/png;base64,iVBORw0KG==",
            }
        )
    ).toBeTruthy();
});

test("Same domain - no match", () => {
    const url = "http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%2Fbar.com%2F";
    const [filter] = RequestControl.createRequestFilters({
        action: "filter",
        pattern: {
            origin: "same-domain",
        },
    });
    expect(
        filter.matcher.test(
            {
                originUrl: "http://foo.bar.com/",
                url,
            }
        )
    ).toBeFalsy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://foo2.com:8000/path.index",
                url,
            }
        )
    ).toBeFalsy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://user@ab.foo2.com:8000/path.index",
                url,
            }
        )
    ).toBeFalsy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://user:pass@foo.com.au:8000/path.index",
                url,
            }
        )
    ).toBeFalsy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://192.0.0.1:8080/path.index",
                url: "http://192.0.0.2:8080",
            }
        )
    ).toBeFalsy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://mail.google.com/path.index",
                url: "http://google.com.abc",
            }
        )
    ).toBeFalsy();
});

test("Third Party Domain - match", () => {
    const url = "http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%2Fbar.com%2F";
    const [filter] = RequestControl.createRequestFilters({
        action: "filter",
        pattern: {
            origin: "third-party-domain",
        },
    });
    expect(
        filter.matcher.test(
            {
                originUrl: "http://foo.bar.com/",
                url,
            }
        )
    ).toBeTruthy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://foo2.com:8000/path.index",
                url,
            }
        )
    ).toBeTruthy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://user@ab.foo2.com:8000/path.index",
                url,
            }
        )
    ).toBeTruthy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://user:pass@foo.com.au:8000/path.index",
                url,
            }
        )
    ).toBeTruthy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://192.0.0.1:8080/path.index",
                url: "http://192.0.0.2:8080",
            }
        )
    ).toBeTruthy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://mail.google.com/path.index",
                url: "http://google.com.abc",
            }
        )
    ).toBeTruthy();
});

test("Third Party Domain - no match", () => {
    const url = "http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%2Fbar.com%2F";
    const [filter] = RequestControl.createRequestFilters({
        action: "filter",
        pattern: {
            origin: "third-party-domain",
        },
    });
    expect(
        filter.matcher.test(
            {
                originUrl: "http://foo.com/",
                url,
            }
        )
    ).toBeFalsy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://foo.com:8000/path.index",
                url,
            }
        )
    ).toBeFalsy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://user@foo.com:8000/path.index",
                url,
            }
        )
    ).toBeFalsy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://user:pass@foo.com:8000/path.index",
                url,
            }
        )
    ).toBeFalsy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://192.0.0.1:8080/path.index",
                url: "http://192.0.0.1:8080",
            }
        )
    ).toBeFalsy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://mail.google.com/path.index",
                url: "http://google.com",
            }
        )
    ).toBeFalsy();
    expect(
        filter.matcher.test(
            {
                url: "http://google.com",
            }
        )
    ).toBeFalsy();
    expect(
        filter.matcher.test(
            {
                originUrl: "http://google.com",
                url: "data:image/png;base64,iVBORw0KG==",
            }
        )
    ).toBeFalsy();
});

test("Same origin - match", () => {
    const url = "http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%2Fbar.com%2F";
    const [filter] = RequestControl.createRequestFilters({
        action: "filter",
        pattern: {
            origin: "same-origin",
        },
    });
    expect(
        filter.matcher.test(
            {
                originUrl: "http://foo.com/",
                url,
            }
        )
    ).toBeTruthy();
    expect(
        filter.matcher.test(
            {
                originUrl: "http://foo.com/path.index",
                url,
            }
        )
    ).toBeTruthy();
    expect(
        filter.matcher.test(
            {
                originUrl: "http://user@foo.com/path.index",
                url,
            }
        )
    ).toBeTruthy();
    expect(
        filter.matcher.test(
            {
                originUrl: "http://user:pass@foo.com/path.index#hash",
                url,
            }
        )
    ).toBeTruthy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://192.0.0.1:8080/path.index",
                url: "https://192.0.0.1:8080",
            }
        )
    ).toBeTruthy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://mail.google.com/path.index",
                url: "https://mail.google.com",
            }
        )
    ).toBeTruthy();
    expect(
        filter.matcher.test(
            {
                url: "http://google.com",
            }
        )
    ).toBeTruthy();
});

test("Same origin - no match", () => {
    const url = "http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%2Fbar.com%2F";
    const [filter] = RequestControl.createRequestFilters({
        action: "filter",
        pattern: {
            origin: "same-origin",
        },
    });
    expect(
        filter.matcher.test(
            {
                originUrl: "http://foo.bar.com/",
                url,
            }
        )
    ).toBeFalsy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://foo.com/path.index",
                url,
            }
        )
    ).toBeFalsy();
    expect(
        filter.matcher.test(
            {
                originUrl: "http://user@foo.com:8000/path.index",
                url,
            }
        )
    ).toBeFalsy();
    expect(
        filter.matcher.test(
            {
                originUrl: "http://user:pass@ab.foo.com/path.index",
                url,
            }
        )
    ).toBeFalsy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://192.0.0.1:8080/path.index",
                url: "https://192.0.0.2:8080",
            }
        )
    ).toBeFalsy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://mail.google.com/path.index",
                url: "http://mail.google.com/path.index",
            }
        )
    ).toBeFalsy();
});

test("Third party origin - match", () => {
    const url = "http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%2Fbar.com%2F";
    const [filter] = RequestControl.createRequestFilters({
        action: "filter",
        pattern: {
            origin: "third-party-origin",
        },
    });
    expect(
        filter.matcher.test(
            {
                originUrl: "https://foo.com/",
                url,
            }
        )
    ).toBeTruthy();
    expect(
        filter.matcher.test(
            {
                originUrl: "http://foo.com:8080/path.index",
                url,
            }
        )
    ).toBeTruthy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://user@foo.com/path.index",
                url,
            }
        )
    ).toBeTruthy();
    expect(
        filter.matcher.test(
            {
                originUrl: "http://user:pass@foo.com:8080/path.index#hash",
                url,
            }
        )
    ).toBeTruthy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://192.0.0.1:8080/path.index",
                url: "http://192.0.0.1:8080",
            }
        )
    ).toBeTruthy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://mail.google.com/path.index",
                url: "http://ab.google.com",
            }
        )
    ).toBeTruthy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://mail.google.com/path.index",
                url: "http://google.com.au",
            }
        )
    ).toBeTruthy();
});

test("Third party origin - no match", () => {
    const url = "http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%2Fbar.com%2F";
    const [filter] = RequestControl.createRequestFilters({
        action: "filter",
        pattern: {
            origin: "third-party-origin",
        },
    });
    expect(
        filter.matcher.test(
            {
                originUrl: "http://foo.com/",
                url,
            }
        )
    ).toBeFalsy();
    expect(
        filter.matcher.test(
            {
                originUrl: "http://foo.com/path.index",
                url,
            }
        )
    ).toBeFalsy();
    expect(
        filter.matcher.test(
            {
                originUrl: "http://user@foo.com/path.index",
                url,
            }
        )
    ).toBeFalsy();
    expect(
        filter.matcher.test(
            {
                originUrl: "http://user:pass@foo.com/path.index",
                url,
            }
        )
    ).toBeFalsy();
    expect(
        filter.matcher.test(
            {
                originUrl: "https://192.0.0.1:8080/path.index",
                url: "https://192.0.0.1:8080",
            }
        )
    ).toBeFalsy();
    expect(
        filter.matcher.test(
            {
                originUrl: "http://mail.google.com/path.index",
                url: "http://mail.google.com/path.index",
            }
        )
    ).toBeFalsy();
    expect(
        filter.matcher.test(
            {
                originUrl: "http://mail.google.com:8080/path.index",
                url: "http://mail.google.com:8080/path.index",
            }
        )
    ).toBeFalsy();
    expect(
        filter.matcher.test(
            {
                url: "http://google.com",
            }
        )
    ).toBeFalsy();
});

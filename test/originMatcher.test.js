import * as RequestControl from "../src/main/api";
import { RequestController } from "../src/main/control";

let controller = () => new RequestController();
let sameDomainRule;
let sameOriginRule;
let thirdPartyDomainRule;
let thirdPartyOriginRule;

beforeEach(() => {
    sameDomainRule = RequestControl.createRule({
        action: "filter",
        pattern: {
            origin: "same-domain"
        }
    });
    thirdPartyDomainRule = RequestControl.createRule({
        action: "filter",
        pattern: {
            origin: "third-party-domain"
        }
    });
    sameOriginRule = RequestControl.createRule({
        action: "filter",
        pattern: {
            origin: "same-origin"
        }
    });
    thirdPartyOriginRule = RequestControl.createRule({
        action: "filter",
        pattern: {
            origin: "third-party-origin"
        }
    });
});

test("Same domain - match", () => {
    let url = "http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%2Fbar.com%2F";
    expect(controller().mark({
        originUrl: "http://foo.com/",
        url: url
    }, sameDomainRule)).toBeTruthy();
    expect(controller().mark({
        originUrl: "https://foo.com:8000/path.index",
        url: url
    }, sameDomainRule)).toBeTruthy();
    expect(controller().mark({
        originUrl: "https://user@foo.com:8000/path.index",
        url: url
    }, sameDomainRule)).toBeTruthy();
    expect(controller().mark({
        originUrl: "https://user:pass@foo.com:8000/path.index",
        url: url
    }, sameDomainRule)).toBeTruthy();
    expect(controller().mark({
        originUrl: "https://192.0.0.1:8080/path.index",
        url: "http://192.0.0.1:8080"
    }, sameDomainRule)).toBeTruthy();
    expect(controller().mark({
        originUrl: "https://mail.google.com/path.index",
        url: "http://google.com"
    }, sameDomainRule)).toBeTruthy();
    expect(controller().mark({
        url: "http://google.com"
    }, sameDomainRule)).toBeTruthy();
    expect(controller().mark({
        originUrl: "http://google.com",
        url: "data:image/png;base64,iVBORw0KG=="
    }, sameDomainRule)).toBeTruthy();
});

test("Same domain - no match", () => {
    let url = "http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%2Fbar.com%2F";
    expect(controller().mark({
        originUrl: "http://foo.bar.com/",
        url: url
    }, sameDomainRule)).toBeFalsy();
    expect(controller().mark({
        originUrl: "https://foo2.com:8000/path.index",
        url: url
    }, sameDomainRule)).toBeFalsy();
    expect(controller().mark({
        originUrl: "https://user@ab.foo2.com:8000/path.index",
        url: url
    }, sameDomainRule)).toBeFalsy();
    expect(controller().mark({
        originUrl: "https://user:pass@foo.com.au:8000/path.index",
        url: url
    }, sameDomainRule)).toBeFalsy();
    expect(controller().mark({
        originUrl: "https://192.0.0.1:8080/path.index",
        url: "http://192.0.0.2:8080"
    }, sameDomainRule)).toBeFalsy();
    expect(controller().mark({
        originUrl: "https://mail.google.com/path.index",
        url: "http://google.com.abc"
    }, sameDomainRule)).toBeFalsy();
});

test("Third Party Domain - match", () => {
    let url = "http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%2Fbar.com%2F";
    expect(controller().mark({
        originUrl: "http://foo.bar.com/",
        url: url
    }, thirdPartyDomainRule)).toBeTruthy();
    expect(controller().mark({
        originUrl: "https://foo2.com:8000/path.index",
        url: url
    }, thirdPartyDomainRule)).toBeTruthy();
    expect(controller().mark({
        originUrl: "https://user@ab.foo2.com:8000/path.index",
        url: url
    }, thirdPartyDomainRule)).toBeTruthy();
    expect(controller().mark({
        originUrl: "https://user:pass@foo.com.au:8000/path.index",
        url: url
    }, thirdPartyDomainRule)).toBeTruthy();
    expect(controller().mark({
        originUrl: "https://192.0.0.1:8080/path.index",
        url: "http://192.0.0.2:8080"
    }, thirdPartyDomainRule)).toBeTruthy();
    expect(controller().mark({
        originUrl: "https://mail.google.com/path.index",
        url: "http://google.com.abc"
    }, thirdPartyDomainRule)).toBeTruthy();
});


test("Third Party Domain - no match", () => {
    let url = "http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%2Fbar.com%2F";
    expect(controller().mark({
        originUrl: "http://foo.com/",
        url: url
    }, thirdPartyDomainRule)).toBeFalsy();
    expect(controller().mark({
        originUrl: "https://foo.com:8000/path.index",
        url: url
    }, thirdPartyDomainRule)).toBeFalsy();
    expect(controller().mark({
        originUrl: "https://user@foo.com:8000/path.index",
        url: url
    }, thirdPartyDomainRule)).toBeFalsy();
    expect(controller().mark({
        originUrl: "https://user:pass@foo.com:8000/path.index",
        url: url
    }, thirdPartyDomainRule)).toBeFalsy();
    expect(controller().mark({
        originUrl: "https://192.0.0.1:8080/path.index",
        url: "http://192.0.0.1:8080"
    }, thirdPartyDomainRule)).toBeFalsy();
    expect(controller().mark({
        originUrl: "https://mail.google.com/path.index",
        url: "http://google.com"
    }, thirdPartyDomainRule)).toBeFalsy();
    expect(controller().mark({
        url: "http://google.com"
    }, thirdPartyDomainRule)).toBeFalsy();
    expect(controller().mark({
        originUrl: "http://google.com",
        url: "data:image/png;base64,iVBORw0KG=="
    }, thirdPartyDomainRule)).toBeFalsy();
});

test("Same origin - match", () => {
    let url = "http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%2Fbar.com%2F";
    expect(controller().mark({
        originUrl: "http://foo.com/",
        url: url
    }, sameOriginRule)).toBeTruthy();
    expect(controller().mark({
        originUrl: "http://foo.com/path.index",
        url: url
    }, sameOriginRule)).toBeTruthy();
    expect(controller().mark({
        originUrl: "http://user@foo.com/path.index",
        url: url
    }, sameOriginRule)).toBeTruthy();
    expect(controller().mark({
        originUrl: "http://user:pass@foo.com/path.index#hash",
        url: url
    }, sameOriginRule)).toBeTruthy();
    expect(controller().mark({
        originUrl: "https://192.0.0.1:8080/path.index",
        url: "https://192.0.0.1:8080"
    }, sameOriginRule)).toBeTruthy();
    expect(controller().mark({
        originUrl: "https://mail.google.com/path.index",
        url: "https://mail.google.com"
    }, sameOriginRule)).toBeTruthy();
    expect(controller().mark({
        url: "http://google.com"
    }, sameOriginRule)).toBeTruthy();
});

test("Same origin - no match", () => {
    let url = "http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%2Fbar.com%2F";
    expect(controller().mark({
        originUrl: "http://foo.bar.com/",
        url: url
    }, sameOriginRule)).toBeFalsy();
    expect(controller().mark({
        originUrl: "https://foo.com/path.index",
        url: url
    }, sameOriginRule)).toBeFalsy();
    expect(controller().mark({
        originUrl: "http://user@foo.com:8000/path.index",
        url: url
    }, sameOriginRule)).toBeFalsy();
    expect(controller().mark({
        originUrl: "http://user:pass@ab.foo.com/path.index",
        url: url
    }, sameOriginRule)).toBeFalsy();
    expect(controller().mark({
        originUrl: "https://192.0.0.1:8080/path.index",
        url: "https://192.0.0.2:8080"
    }, sameOriginRule)).toBeFalsy();
    expect(controller().mark({
        originUrl: "https://mail.google.com/path.index",
        url: "http://mail.google.com/path.index"
    }, sameOriginRule)).toBeFalsy();
});


test("Third party origin - match", () => {
    let url = "http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%2Fbar.com%2F";
    expect(controller().mark({
        originUrl: "https://foo.com/",
        url: url
    }, thirdPartyOriginRule)).toBeTruthy();
    expect(controller().mark({
        originUrl: "http://foo.com:8080/path.index",
        url: url
    }, thirdPartyOriginRule)).toBeTruthy();
    expect(controller().mark({
        originUrl: "https://user@foo.com/path.index",
        url: url
    }, thirdPartyOriginRule)).toBeTruthy();
    expect(controller().mark({
        originUrl: "http://user:pass@foo.com:8080/path.index#hash",
        url: url
    }, thirdPartyOriginRule)).toBeTruthy();
    expect(controller().mark({
        originUrl: "https://192.0.0.1:8080/path.index",
        url: "http://192.0.0.1:8080"
    }, thirdPartyOriginRule)).toBeTruthy();
    expect(controller().mark({
        originUrl: "https://mail.google.com/path.index",
        url: "http://ab.google.com"
    }, thirdPartyOriginRule)).toBeTruthy();
    expect(controller().mark({
        originUrl: "https://mail.google.com/path.index",
        url: "http://google.com.au"
    }, thirdPartyOriginRule)).toBeTruthy();
});

test("Third party origin - no match", () => {
    let url = "http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%2Fbar.com%2F";
    expect(controller().mark({
        originUrl: "http://foo.com/",
        url: url
    }, thirdPartyOriginRule)).toBeFalsy();
    expect(controller().mark({
        originUrl: "http://foo.com/path.index",
        url: url
    }, thirdPartyOriginRule)).toBeFalsy();
    expect(controller().mark({
        originUrl: "http://user@foo.com/path.index",
        url: url
    }, thirdPartyOriginRule)).toBeFalsy();
    expect(controller().mark({
        originUrl: "http://user:pass@foo.com/path.index",
        url: url
    }, thirdPartyOriginRule)).toBeFalsy();
    expect(controller().mark({
        originUrl: "https://192.0.0.1:8080/path.index",
        url: "https://192.0.0.1:8080"
    }, thirdPartyOriginRule)).toBeFalsy();
    expect(controller().mark({
        originUrl: "http://mail.google.com/path.index",
        url: "http://mail.google.com/path.index"
    }, thirdPartyOriginRule)).toBeFalsy();
    expect(controller().mark({
        originUrl: "http://mail.google.com:8080/path.index",
        url: "http://mail.google.com:8080/path.index"
    }, thirdPartyOriginRule)).toBeFalsy();
    expect(controller().mark({
        url: "http://google.com"
    }, thirdPartyOriginRule)).toBeFalsy();
});

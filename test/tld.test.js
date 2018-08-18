import test from "ava";
import {extractHostname, libTld} from "../src/RequestControl/tld";


test("Extract hostname", t => {
    t.is(extractHostname("//example.com"), "example.com");
    t.is(extractHostname("http://example.com"), "example.com");
    t.is(extractHostname("http://example.com/"), "example.com");
    t.is(extractHostname(""), "");
    t.is(extractHostname("example"), "example");
    t.is(extractHostname("example.com"), "example.com");
    t.is(extractHostname("example.com:8080"), "example.com");
    t.is(extractHostname("user:pass@example.com:8080"), "example.com");
    t.is(extractHostname("example.com/"), "example.com");
    t.is(extractHostname("http://example.com/path"), "example.com");
    t.is(extractHostname("http://user:pass@example.com/path"), "example.com");
    t.is(extractHostname("http://user:pass@example.com:8080/path"), "example.com");
    t.is(extractHostname("http://user:pass@example.com:8080"), "example.com");
    t.is(extractHostname("http://user:pass@example.com:8080/"), "example.com");
    t.is(extractHostname("https://user:pass@example.com:8080/"), "example.com");
    t.is(extractHostname("https://user:pass@example.com:8080/"), "example.com");
    t.is(extractHostname("https://pass@example.com:8080/"), "example.com");
    t.is(extractHostname("https://user@example.com:8080/"), "example.com");
    t.is(extractHostname("https://user@example.com/"), "example.com");
    t.is(extractHostname("http://[2001:0db8:85a3:0000:0000:8a2e:0370:7334]"),
        "2001:0db8:85a3:0000:0000:8a2e:0370:7334");
    t.is(extractHostname("http://user:pass@[::1]/segment/index.html?query#frag"),
        "::1");
    t.is(extractHostname("http://[::1]"), "::1");
    t.is(extractHostname("http://[1080::8:800:200C:417A]:100/foo"),
        "1080::8:800:200C:417A");
    t.is(extractHostname("http://192.168.0.1/"), "192.168.0.1");
});

test("Get domain name", t => {
    t.is(libTld.getDomain("http://example.com"), "example.com");
    t.is(libTld.getDomain("http://nakagyo.kyoto.jp.example.nakagyo.kyoto.jp"),
        "example.nakagyo.kyoto.jp");
    t.is(libTld.getDomain("http://user:pass@nakagyo.kyoto.jp.example.nakagyo.kyoto.jp:10192/foo"),
        "example.nakagyo.kyoto.jp");
    t.is(libTld.getDomain("data:image/png;base64,iVBORw0KG=="), null);
    t.is(libTld.getDomain(""), null);
    t.is(libTld.getDomain("localhost"), null);
    t.is(libTld.getDomain("about:blank"), null);
    t.is(libTld.getDomain("192.168.0.1"), null);
    t.is(libTld.getDomain("http://192.168.0.1:8080"), null);
});

import test from "ava";
import {libTld} from "../src/main/url";

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
    t.is(libTld.getDomain("192.168.0.1"), "192.168.0.1");
    t.is(libTld.getDomain("192.168.0.f0"), "0.f0");
    t.is(libTld.getDomain("http://192.168.0.1:8080"), "192.168.0.1");
});

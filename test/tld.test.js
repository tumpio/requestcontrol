import {libTld} from "../src/main/url";

test("Get domain name", () => {
    expect(libTld.getDomain("http://example.com")).toBe("example.com");
    expect(libTld.getDomain("http://nakagyo.kyoto.jp.example.nakagyo.kyoto.jp")).toBe("example.nakagyo.kyoto.jp");
    expect(
        libTld.getDomain("http://user:pass@nakagyo.kyoto.jp.example.nakagyo.kyoto.jp:10192/foo")
    ).toBe("example.nakagyo.kyoto.jp");
    expect(libTld.getDomain("data:image/png;base64,iVBORw0KG==")).toBe(null);
    expect(libTld.getDomain("")).toBe(null);
    expect(libTld.getDomain("localhost")).toBe(null);
    expect(libTld.getDomain("about:blank")).toBe(null);
    expect(libTld.getDomain("192.168.0.1")).toBe("192.168.0.1");
    expect(libTld.getDomain("192.168.0.f0")).toBe("0.f0");
    expect(libTld.getDomain("http://192.168.0.1:8080")).toBe("192.168.0.1");
});

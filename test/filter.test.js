import test from 'ava';
import {URL} from 'url';
import {FilterRule, parseInlineUrl, trimQueryParameters} from '../src/RequestControl/filter';
import {createRegexpPattern} from "../src/RequestControl/api";

test('Filter inline url redirection', t => {
    const request = new URL('http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%2Fbar.com%2Fkodin-elektroniikka%2Fintel-core-i7-8700k-3-7-ghz-12mb-socket-1151-p41787528%3Futm_source%3Dmuropaketti%26utm_medium%3Dcpc%26utm_campaign%3Dmuropaketti');
    const target = new URL('http://bar.com/kodin-elektroniikka/intel-core-i7-8700k-3-7-ghz-12mb-socket-1151-p41787528');
    t.is(new FilterRule(0, {values: ["utm_*"]}, false, false).apply(request).href, target.href);
});

test('Skip inline url filtering', t => {
    const request = new URL('http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%bar.com%2Fkodin-elektroniikka%2Fintel-core-i7-8700k-3-7-ghz-12mb-socket-1151-p41787528%3Futm_source%3Dmuropaketti%26utm_medium%3Dcpc%26utm_campaign%3Dmuropaketti');
    const target = new URL('http://foo.com/click?p=240631&a=2314955&g=21407340');
    t.is(new FilterRule(0, {values: ["url"]}, false, true).apply(request).href, target.href);
});

test('Filter inline url redirection', t => {
    const request = new URL('http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%2Fbar.com%2Fkodin-elektroniikka%2Fintel-core-i7-8700k-3-7-ghz-12mb-socket-1151-p41787528%3Futm_source%3Dmuropaketti%26utm_medium%3Dcpc%26utm_campaign%3Dmuropaketti');
    const target = new URL('http://bar.com/kodin-elektroniikka/intel-core-i7-8700k-3-7-ghz-12mb-socket-1151-p41787528');
    t.is(new FilterRule(0, {values: ["utm_*"]}, false, false, true).apply(request).href, target.href);
});

test('Filter inline url redirection', t => {
    const request = new URL('http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%2Ffoo.com%2Fkodin-elektroniikka%2Fintel-core-i7-8700k-3-7-ghz-12mb-socket-1151-p41787528%3Futm_source%3Dmuropaketti%26utm_medium%3Dcpc%26utm_campaign%3Dmuropaketti');
    const target = new URL('http://foo.com/click?p=240631&a=2314955&g=21407340');
    t.is(new FilterRule(0, {values: ["url"]}, false, false, true).apply(request).href, target.href);
});

test('Trim query parameters', t => {
    let request, target, filterRule;

    filterRule = new FilterRule(0, {values: ["utm_*", "feature", "parameter"]}, false, true);
    request = new URL('https://www.youtube.com/watch?v=yWtFGtIlzyQ&feature=em-uploademail?parameter&utm_source&key=value?utm_medium=abc&parameter&utm_term?key=value&utm_medium=abc');
    target = new URL('https://www.youtube.com/watch?v=yWtFGtIlzyQ?key=value?key=value');
    t.is(filterRule.apply(request).href, target.href);

    filterRule = new FilterRule(0, {values: ["utm_source", "utm_medium"]}, false, true);
    request = new URL('https://www.ghacks.net/2017/04/30/firefox-nightly-marks-legacy-add-ons/?utm_source=feedburner&utm_medium=feed');
    target = new URL('https://www.ghacks.net/2017/04/30/firefox-nightly-marks-legacy-add-ons/');
    t.is(filterRule.apply(request).href, target.href);

    filterRule = new FilterRule(0, {
        values: ["ws_ab_test", "btsid", "algo_expid", "algo_pvid"]
    }, false, true);
    request = new URL('https://www.aliexpress.com/item/Xiaomi-Mini-Router-2-4GHz-5GHz-Dual-Band-Max-1167Mbps-Support-Wifi-802-11ac-Xiaomi-Mi/32773978417.html?ws_ab_test=searchweb0_0,searchweb201602_3_10152_10065_10151_10068_436_10136_10137_10157_10060_10138_10155_10062_10156_10154_10056_10055_10054_10059_10099_10103_10102_10096_10169_10147_10052_10053_10142_10107_10050_10051_9985_10084_10083_10080_10082_10081_10110_10111_10112_10113_10114_10181_10183_10182_10078_10079_10073_10070_10123-9985,searchweb201603_2,ppcSwitch_5&btsid=3f9443f8-38ad-472c-b6a6-00b8a3db74a3&algo_expid=8f505cf2-0671-4c52-b976-d7a3169da8bc-6&algo_pvid=8f505cf2-0671-4c52-b976-d7a3169da8bc');
    target = new URL('https://www.aliexpress.com/item/Xiaomi-Mini-Router-2-4GHz-5GHz-Dual-Band-Max-1167Mbps-Support-Wifi-802-11ac-Xiaomi-Mi/32773978417.html');
    t.is(filterRule.apply(request).href, target.href);

    filterRule = new FilterRule(0, {values: ["sid"]}, false, true);
    request = new URL('http://forums.mozillazine.org/viewtopic.php?sid=6fa91cda58212e7e869dc2022b9e6217&f=48&t=1920191');
    target = new URL('http://forums.mozillazine.org/viewtopic.php?f=48&t=1920191');
    t.is(filterRule.apply(request).href, target.href);
    request = new URL('http://forums.mozillazine.org/viewtopic.php?f=48&sid=6fa91cda58212e7e869dc2022b9e6217&t=1920191');
    t.is(filterRule.apply(request).href, target.href);
    request = new URL('http://forums.mozillazine.org/viewtopic.php?f=48&t=1920191&sid=6fa91cda58212e7e869dc2022b9e6217');
    t.is(filterRule.apply(request).href, target.href);
});

test('Trim query parameters (inverted)', t => {
    const request = new URL('https://www.youtube.com/watch?v=yWtFGtIlzyQ&feature=em-uploademail?parameter&utm_source&key=value?utm_medium=abc&parameter&utm_term?key=value&utm_medium=abc');
    const target = new URL('https://www.youtube.com/watch?feature=em-uploademail?parameter&utm_source?utm_medium=abc&parameter&utm_term?utm_medium=abc');
    t.is(new FilterRule(0, {
        values: ["utm_*", "feature", "parameter"],
        invert: true
    }, false, true).apply(request).href, target.href);
});

test('Remove all query parameters', t => {
    const request = new URL('https://www.youtube.com/watch?v=yWtFGtIlzyQ&feature=em-uploademail#hash');
    const target = new URL('https://www.youtube.com/watch#hash');
    t.is(new FilterRule(0, null, true, true).apply(request).href, target.href);
});

test('Filter inline url redirection - trim parameters before inline url parsing', t => {
    const request = new URL('http://go.redirectingat.com/?xs=1&id=xxxxxxx&sref=http%3A%2F%2Fwww.vulture.com%2F2018%2F05%2Fthe-end-of-nature-at-storm-king-art-center-in-new-york.html&xcust=xxxxxxxx&url=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FNathaniel_Parker_Willis');
    const target = new URL("https://en.wikipedia.org/wiki/Nathaniel_Parker_Willis");
    t.is(new FilterRule(0, {values: ["sref"]}, false, false).apply(request).href, target.href);
});

test('Inline url parsing', t => {
    t.is(parseInlineUrl("https://steamcommunity.com/linkfilter/?url=https://addons.mozilla.org/"),
        "https://addons.mozilla.org/");
    t.is(parseInlineUrl("https://outgoing.prod.mozaws.net/v1/ca408bc92003166eec54f20e68d7c771ae749b005b72d054ada33f0ef261367d/https%3A//github.com/tumpio/requestcontrol"),
        "https://github.com/tumpio/requestcontrol");
    t.is(parseInlineUrl("http://www.deviantart.com/users/outgoing?http://foobar2000.org"),
        "http://foobar2000.org");
    t.is(parseInlineUrl("https://www.site2.com/chrome/?i-would-rather-use-firefox=https%3A%2F%2Fwww.mozilla.org/"),
        "https://www.mozilla.org/");
    t.is(parseInlineUrl("https://site.com/away.php?to=https://github.com&cc_key="),
        "https://github.com");
    t.is(parseInlineUrl("https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=1&ved=0ahUKEwiGvaeL1-HTAhUBP5oKHfDoDqQQFggrMAA&url=https%3A%2F%2Faddons.mozilla.org%2F&usg=AFQjCNGoTdPVJJYDmaDkKoFSpuasv6HVCg&cad=rjt"),
        "https://addons.mozilla.org/");
    t.is(parseInlineUrl("https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.fsf.org%2Fcampaigns%2F&h=ATP1kf98S0FxqErjoW8VmdSllIp4veuH2_m1jl69sEEeLzUXbkNXrVnzRMp65r5vf21LJGTgJwR2b66m97zYJoXx951n-pr4ruS1osMvT2c9ITsplpPU37RlSqJsSgba&s=1"),
        "https://www.fsf.org/campaigns/");
    t.is(parseInlineUrl("https://out.reddit.com/t3_5pq7qd?url=https%3A%2F%2Finternethealthreport.org%2Fv01%2F&token=AQAAZV6JWHBBnIcVjV1wvxVg5gKyCQQSdUhGIvuEUmdPZhxhm8kH&app_name=reddit.com"),
        "https://internethealthreport.org/v01/");
    t.is(parseInlineUrl("http://site3.com/?r=https%3A%2F%2Fwww.yr.no%2Fplace%2FNorway%2FNordland%2FBr%C3%B8nn%C3%B8y%2FBr%C3%B8nn%C3%B8ysund%2Fhour_by_hour.html?key=ms&ww=51802"),
        "https://www.yr.no/place/Norway/Nordland/Brønnøy/Brønnøysund/hour_by_hour.html");
    t.is(parseInlineUrl("http://www.deviantart.com/users/outgoing?https://scontent.ftpa1-1.fna.fbcdn.net/v/t1.0-9/19437615_10154946431942669_5896185388243732024_n.jpg?oh=f7eb69d10ee9217944c18955d3a631ad&oe=5A0F78B4"),
        "https://scontent.ftpa1-1.fna.fbcdn.net/v/t1.0-9/19437615_10154946431942669_5896185388243732024_n.jpg?oh=f7eb69d10ee9217944c18955d3a631ad&oe=5A0F78B4");
    t.is(parseInlineUrl("http://site.com/?r=https&foo=bar%3A%2F%2Fwww.yr.no%2Fplace%2FNorway%2FNordland%2FBr%C3%B8nn%C3%B8y%2FBr%C3%B8nn%C3%B8ysund%2Fhour_by_hour.html?key=ms&ww=51802"),
        null);
    t.is(parseInlineUrl("http://site.com/?r=www.example.com"),
        null);
});

test('Query parameter trimming', t => {
    t.is(trimQueryParameters("?parameter&utm_source&key=value?utm_medium=abc&parameter&utm_term?key=value&utm_medium=abc",
        createRegexpPattern(["utm_source", "utm_medium", "utm_term", "utm_content", "utm_campaign",
            "utm_reader", "utm_place"])),
        "?parameter&key=value?parameter?key=value");
    t.is(trimQueryParameters("?parameter&utm_source&key=value?utm_medium=abc&parameter&utm_term?key=value&utm_medium=abc",
        createRegexpPattern(["utm_medium", "utm_term", "utm_content", "utm_campaign",
            "utm_reader", "utm_place"])),
        "?parameter&utm_source&key=value?parameter?key=value");
    t.is(trimQueryParameters("??utm_source&parameter&utm_source&key=value???utm_medium=abc&parameter&utm_term?key=value&utm_medium=abc",
        createRegexpPattern(["utm_source", "utm_medium", "utm_term", "utm_content", "utm_campaign",
            "utm_reader", "utm_place"])),
        "??parameter&key=value???parameter?key=value");
    t.is(trimQueryParameters("??utm_source&parameter&utm_source&key=value???utm_medium=abc&parameter&utm_term?key=value&utm_medium=abc",
        createRegexpPattern(["u?m_*"])),
        "??parameter&key=value???parameter?key=value");
    t.is(trimQueryParameters("?parameter&utm_source&key=value?utm_medium=abc&parameter&utm_term?key=value&utm_medium=abc",
        createRegexpPattern(["utm_source", "utm_medium", "utm_term", "utm_content", "utm_campaign",
            "utm_reader", "utm_place"]), true),
        "?utm_source?utm_medium=abc&utm_term?utm_medium=abc");
    t.is(trimQueryParameters("?parameter&utm_source&key=value?utm_medium=abc&parameter&utm_term?key=value&utm_medium=abc",
        createRegexpPattern(["/[parmetr]+/"]), true),
        "?parameter?parameter");
    t.is(trimQueryParameters("?parameter&utm_source&key=value?utm_medium=abc&parameter&utm_term?key=value&utm_medium=abc",
        createRegexpPattern(["/...\_.{5,}/"]), false),
        "?parameter&key=value?parameter&utm_term?key=value");
});

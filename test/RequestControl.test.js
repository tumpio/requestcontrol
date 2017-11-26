import test from 'ava';
import {RequestControl} from '../src/RequestControl';

test('Inline url parsing', t => {
    t.is(RequestControl.parseInlineUrl("https://steamcommunity.com/linkfilter/?url=https://addons.mozilla.org/"),
        "https://addons.mozilla.org/");
    t.is(RequestControl.parseInlineUrl("https://outgoing.prod.mozaws.net/v1/ca408bc92003166eec54f20e68d7c771ae749b005b72d054ada33f0ef261367d/https%3A//github.com/tumpio/requestcontrol"),
        "https://github.com/tumpio/requestcontrol");
    t.is(RequestControl.parseInlineUrl("http://www.deviantart.com/users/outgoing?http://foobar2000.org"),
        "http://foobar2000.org");
    t.is(RequestControl.parseInlineUrl("https://www.site2.com/chrome/?i-would-rather-use-firefox=https%3A%2F%2Fwww.mozilla.org/"),
        "https://www.mozilla.org/");
    t.is(RequestControl.parseInlineUrl("https://site.com/away.php?to=https://github.com&cc_key="),
        "https://github.com");
    t.is(RequestControl.parseInlineUrl("https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=1&ved=0ahUKEwiGvaeL1-HTAhUBP5oKHfDoDqQQFggrMAA&url=https%3A%2F%2Faddons.mozilla.org%2F&usg=AFQjCNGoTdPVJJYDmaDkKoFSpuasv6HVCg&cad=rjt"),
        "https://addons.mozilla.org/");
    t.is(RequestControl.parseInlineUrl("https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.fsf.org%2Fcampaigns%2F&h=ATP1kf98S0FxqErjoW8VmdSllIp4veuH2_m1jl69sEEeLzUXbkNXrVnzRMp65r5vf21LJGTgJwR2b66m97zYJoXx951n-pr4ruS1osMvT2c9ITsplpPU37RlSqJsSgba&s=1"),
        "https://www.fsf.org/campaigns/");
    t.is(RequestControl.parseInlineUrl("https://out.reddit.com/t3_5pq7qd?url=https%3A%2F%2Finternethealthreport.org%2Fv01%2F&token=AQAAZV6JWHBBnIcVjV1wvxVg5gKyCQQSdUhGIvuEUmdPZhxhm8kH&app_name=reddit.com"),
        "https://internethealthreport.org/v01/");
    t.is(RequestControl.parseInlineUrl("http://site3.com/?r=https%3A%2F%2Fwww.yr.no%2Fplace%2FNorway%2FNordland%2FBr%C3%B8nn%C3%B8y%2FBr%C3%B8nn%C3%B8ysund%2Fhour_by_hour.html?key=ms&ww=51802"),
        "https://www.yr.no/place/Norway/Nordland/Brønnøy/Brønnøysund/hour_by_hour.html");
    t.is(RequestControl.parseInlineUrl("http://www.deviantart.com/users/outgoing?https://scontent.ftpa1-1.fna.fbcdn.net/v/t1.0-9/19437615_10154946431942669_5896185388243732024_n.jpg?oh=f7eb69d10ee9217944c18955d3a631ad&oe=5A0F78B4"),
        "https://scontent.ftpa1-1.fna.fbcdn.net/v/t1.0-9/19437615_10154946431942669_5896185388243732024_n.jpg?oh=f7eb69d10ee9217944c18955d3a631ad&oe=5A0F78B4");
    t.is(RequestControl.parseInlineUrl("http://site.com/?r=https&foo=bar%3A%2F%2Fwww.yr.no%2Fplace%2FNorway%2FNordland%2FBr%C3%B8nn%C3%B8y%2FBr%C3%B8nn%C3%B8ysund%2Fhour_by_hour.html?key=ms&ww=51802"),
        null);
    t.is(RequestControl.parseInlineUrl("http://site.com/?r=www.example.com"),
        null);
});

test('Query parameter trimming', t => {
    t.is(RequestControl.trimQueryParameters("?parameter&utm_source&key=value?utm_medium=abc&parameter&utm_term?key=value&utm_medium=abc",
        RequestControl.createTrimPattern(["utm_source", "utm_medium", "utm_term", "utm_content", "utm_campaign",
            "utm_reader", "utm_place"])),
        "?parameter&key=value?parameter?key=value");
    t.is(RequestControl.trimQueryParameters("?parameter&utm_source&key=value?utm_medium=abc&parameter&utm_term?key=value&utm_medium=abc",
        RequestControl.createTrimPattern(["utm_medium", "utm_term", "utm_content", "utm_campaign",
            "utm_reader", "utm_place"])),
        "?parameter&utm_source&key=value?parameter?key=value");
    t.is(RequestControl.trimQueryParameters("??utm_source&parameter&utm_source&key=value???utm_medium=abc&parameter&utm_term?key=value&utm_medium=abc",
        RequestControl.createTrimPattern(["utm_source", "utm_medium", "utm_term", "utm_content", "utm_campaign",
            "utm_reader", "utm_place"])),
        "??parameter&key=value???parameter?key=value");
    t.is(RequestControl.trimQueryParameters("??utm_source&parameter&utm_source&key=value???utm_medium=abc&parameter&utm_term?key=value&utm_medium=abc",
        RequestControl.createTrimPattern(["utm_*"])),
        "??parameter&key=value???parameter?key=value");
    t.is(RequestControl.trimQueryParameters("?parameter&utm_source&key=value?utm_medium=abc&parameter&utm_term?key=value&utm_medium=abc",
        RequestControl.createTrimPattern(["utm_source", "utm_medium", "utm_term", "utm_content", "utm_campaign",
            "utm_reader", "utm_place"]), true),
        "?utm_source?utm_medium=abc&utm_term?utm_medium=abc");
    t.is(RequestControl.trimQueryParameters("?parameter&utm_source&key=value?utm_medium=abc&parameter&utm_term?key=value&utm_medium=abc",
        RequestControl.createTrimPattern(["/[parmetr]+/"]), true),
        "?parameter?parameter");
    t.is(RequestControl.trimQueryParameters("?parameter&utm_source&key=value?utm_medium=abc&parameter&utm_term?key=value&utm_medium=abc",
        RequestControl.createTrimPattern(["/...\_.{5,}/"]), false),
        "?parameter&key=value?parameter&utm_term?key=value");
});

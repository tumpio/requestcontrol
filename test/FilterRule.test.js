import test from 'ava';
import {URL} from 'url';
import {FilterRule} from '../src/RequestControl';

test('Filter inline url redirection', t => {
    const request = new URL('http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%2Fbar.com%2Fkodin-elektroniikka%2Fintel-core-i7-8700k-3-7-ghz-12mb-socket-1151-p41787528%3Futm_source%3Dmuropaketti%26utm_medium%3Dcpc%26utm_campaign%3Dmuropaketti');
    const target = new URL('http://bar.com/kodin-elektroniikka/intel-core-i7-8700k-3-7-ghz-12mb-socket-1151-p41787528');
    t.is(new FilterRule({values: ["utm_*"]}, false, false).apply(request).href, target.href);
});

test('Skip inline url filtering', t => {
    const request = new URL('http://foo.com/click?p=240631&a=2314955&g=21407340&url=http%3A%2F%bar.com%2Fkodin-elektroniikka%2Fintel-core-i7-8700k-3-7-ghz-12mb-socket-1151-p41787528%3Futm_source%3Dmuropaketti%26utm_medium%3Dcpc%26utm_campaign%3Dmuropaketti');
    const target = new URL('http://foo.com/click?p=240631&a=2314955&g=21407340');
    t.is(new FilterRule({values: ["url"]}, false, true).apply(request).href, target.href);
});

test('Trim query parameters', t => {
    let request, target, filterRule;

    filterRule = new FilterRule({values: ["utm_*", "feature", "parameter"]}, false, true);
    request = new URL('https://www.youtube.com/watch?v=yWtFGtIlzyQ&feature=em-uploademail?parameter&utm_source&key=value?utm_medium=abc&parameter&utm_term?key=value&utm_medium=abc');
    target = new URL('https://www.youtube.com/watch?v=yWtFGtIlzyQ?key=value?key=value');
    t.is(filterRule.apply(request).href, target.href);

    filterRule = new FilterRule({values: ["utm_source", "utm_medium"]}, false, true);
    request = new URL('https://www.ghacks.net/2017/04/30/firefox-nightly-marks-legacy-add-ons/?utm_source=feedburner&utm_medium=feed');
    target = new URL('https://www.ghacks.net/2017/04/30/firefox-nightly-marks-legacy-add-ons/');
    t.is(filterRule.apply(request).href, target.href);

    filterRule = new FilterRule({values: ["ws_ab_test", "btsid", "algo_expid", "algo_pvid"]}, false, true);
    request = new URL('https://www.aliexpress.com/item/Xiaomi-Mini-Router-2-4GHz-5GHz-Dual-Band-Max-1167Mbps-Support-Wifi-802-11ac-Xiaomi-Mi/32773978417.html?ws_ab_test=searchweb0_0,searchweb201602_3_10152_10065_10151_10068_436_10136_10137_10157_10060_10138_10155_10062_10156_10154_10056_10055_10054_10059_10099_10103_10102_10096_10169_10147_10052_10053_10142_10107_10050_10051_9985_10084_10083_10080_10082_10081_10110_10111_10112_10113_10114_10181_10183_10182_10078_10079_10073_10070_10123-9985,searchweb201603_2,ppcSwitch_5&btsid=3f9443f8-38ad-472c-b6a6-00b8a3db74a3&algo_expid=8f505cf2-0671-4c52-b976-d7a3169da8bc-6&algo_pvid=8f505cf2-0671-4c52-b976-d7a3169da8bc');
    target = new URL('https://www.aliexpress.com/item/Xiaomi-Mini-Router-2-4GHz-5GHz-Dual-Band-Max-1167Mbps-Support-Wifi-802-11ac-Xiaomi-Mi/32773978417.html');
    t.is(filterRule.apply(request).href, target.href);

    filterRule = new FilterRule({values: ["sid"]}, false, true);
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
    t.is(new FilterRule({
        values: ["utm_*", "feature", "parameter"],
        invert: true
    }, false, true).apply(request).href, target.href);
});

test('Remove all query parameters', t => {
    const request = new URL('https://www.youtube.com/watch?v=yWtFGtIlzyQ&feature=em-uploademail#hash');
    const target = new URL('https://www.youtube.com/watch#hash');
    t.is(new FilterRule(null, true, true).apply(request).href, target.href);
});

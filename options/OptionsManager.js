/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function OptionsManager() {
}

OptionsManager.prototype.defaultOptions = {
    rules: [{
        pattern: {
            scheme: "*",
            matchSubDomains: true,
            host: "deviantart.com",
            path: "outgoing?*"
        },
        types: ["main_frame"],
        action: "filter",
        active: true
    }, {
        pattern: {
            scheme: "*",
            matchSubDomains: true,
            host: "google.*",
            topLevelDomains: ["com", "ad", "ae", "com.af", "com.ag", "com.ai", "al", "am", "co.ao",
                "com.ar", "as", "at", "com.au", "az", "ba", "com.bd", "be", "bf", "bg", "com.bh", "bi",
                "bj", "com.bn", "com.bo", "com.br", "bs", "bt", "co.bw", "by", "com.bz", "ca", "cd",
                "cf", "cg", "ch", "ci", "co.ck", "cl", "cm", "cn", "com.co", "co.cr", "com.cu", "cv",
                "com.cy", "cz", "de", "dj", "dk", "dm", "com.do", "dz", "com.ec", "ee", "com.eg", "es",
                "com.et", "fi", "com.fj", "fm", "fr", "ga", "ge", "gg", "com.gh", "com.gi", "gl", "gm",
                "gp", "gr", "com.gt", "gy", "com.hk", "hn", "hr", "ht", "hu", "co.id", "ie", "co.il",
                "im", "co.in", "iq", "is", "it", "je", "com.jm", "jo", "co.jp", "co.ke", "com.kh", "ki",
                "kg", "co.kr", "com.kw", "kz", "la", "com.lb", "li", "lk", "co.ls", "lt", "lu", "lv",
                "com.ly", "co.ma", "md", "me", "mg", "mk", "ml", "com.mm", "mn", "ms", "com.mt", "mu",
                "mv", "mw", "com.mx", "com.my", "co.mz", "com.na", "com.nf", "com.ng", "com.ni", "ng",
                "ne", "nl", "no", "com.np", "nr", "nu", "co.nz", "com.om", "com.pa", "com.pe", "com.pg",
                "com.ph", "com.pk", "pl", "pn", "com.pr", "ps", "pt", "com.py", "com.qa", "ro", "ru",
                "rw", "com.sa", "com.sb", "sc", "se", "com.sg", "sh", "si", "sk", "com.sl", "sn", "so",
                "sm", "sr", "st", "com.sv", "td", "tg", "co.th", "com.tj", "tk", "tl", "tm", "tn", "to",
                "com.tr", "tt", "com.tw", "co.tz", "com.ua", "co.ug", "co.uk", "com.uy", "co.uz",
                "com.vc", "co.ve", "vg", "co.vi", "com.vn", "vu", "ws", "rs", "co.za", "co.zm", "co.zw",
                "cat"
            ],
            path: "url?*"
        },
        types: ["main_frame", "sub_frame"],
        action: "filter",
        active: true
    }, {
        pattern: {
            scheme: "*",
            matchSubDomains: false,
            host: "clk.tradedoubler.com",
            path: "*url=*"
        },
        types: ["main_frame"],
        action: "filter",
        paramsFilter: ["utm_*"],
        active: true
    }, {
        pattern: {
            scheme: "*",
            matchSubDomains: false,
            host: "outgoing.prod.mozaws.net",
            path: "*"
        },
        types: ["main_frame"],
        action: "filter",
        active: true
    }, {
        pattern: {
            scheme: "*",
            matchSubDomains: false,
            host: "out.reddit.com",
            path: "*url=*"
        },
        types: ["main_frame"],
        action: "filter",
        active: true
    }, {
        pattern: {
            scheme: "*",
            matchSubDomains: false,
            host: "steamcommunity.com",
            path: "linkfilter/?url=*"
        },
        types: ["main_frame"],
        action: "filter",
        active: true
    },],

    whitelist: [],

};

OptionsManager.prototype.saveAllOptions = function () {
    let setObject = {};
    for (let option of Object.keys(this.defaultOptions)) {
        setObject[option] = this.options[option];
    }
    return browser.storage.local.set(setObject);
};

OptionsManager.prototype.saveOption = function (option, value) {
    if (typeof value != "undefined") {
        this.options[option] = value;
    }
    let setObject = {};
    setObject[option] = this.options[option];
    return browser.storage.local.set(setObject);
};

OptionsManager.prototype.loadOptions = function (callback) {
    browser.storage.local.get(Object.keys(this.defaultOptions)).then(result => {
        this.options = {};
        for (let option of Object.keys(this.defaultOptions)) {
            this.options[option] = result[option] || cloneObject(this.defaultOptions[option]);
        }
        callback();
    });
};

OptionsManager.prototype.restoreDefault = function (option) {
    this.options[option] = cloneObject(this.defaultOptions[option]);
    return this.saveOption(option);
};

OptionsManager.prototype.update = function (changes) {
    for (let change of Object.keys(changes)) {
        this.options[change] = changes[change].newValue;
    }
};

OptionsManager.prototype.onChanged = function (callback) {
    let _self = this;
    browser.storage.onChanged.addListener(function (changes) {
        _self.update(changes);
        callback();
    });
};

function cloneObject(obj) {
    return JSON.parse(JSON.stringify(obj));
}
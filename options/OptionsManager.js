function OptionsManager() {}

OptionsManager.prototype.defaultOptions = {
    urls: [
        "*://*.deviantart.com/users/outgoing?*",
        "*://*.google.com/url?*",
        "*://clk.tradedoubler.com/*url=*",
        "*://outgoing.prod.mozaws.net/*",
        "*://out.reddit.com/*?url=*",
        "*://steamcommunity.com/linkfilter/?url=*"
    ],
    queryParams: [
        "utm_source",
        "utm_medium",
        "utm_campaign"
    ]
};

OptionsManager.prototype.saveOptions = function(options) {
    return browser.storage.local.set(options);
};

OptionsManager.prototype.loadOptions = function(callback) {
    browser.storage.local.get(Object.keys(this.defaultOptions)).then(result => {
        let options = {};
        for (let option in this.defaultOptions) {
            options[option] = result[option] || this.defaultOptions[option];
        }
        callback(options);
    });
};

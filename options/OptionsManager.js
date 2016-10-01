function OptionsManager() {
}

OptionsManager.prototype.defaultOptions = {
    urls: [
        "*://*.deviantart.com/users/outgoing?*",
        "*://*.google.*/url?*",
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

OptionsManager.prototype.saveOptions = function (options) {
    return browser.storage.local.set(options);
};

OptionsManager.prototype.loadOptions = function (callback) {
    browser.storage.local.get(Object.keys(this.defaultOptions)).then(result => {
        this.options = {};
        for (let option in this.defaultOptions) {
            this.options[option] = result[option] || this.defaultOptions[option];
        }
        callback();
    });
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

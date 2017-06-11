/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function OptionsManager(defaultOptions) {
    this.defaultOptions = defaultOptions;
}

OptionsManager.prototype.saveAllOptions = function () {
    let setObject = {};
    for (let option of Object.keys(this.defaultOptions)) {
        setObject[option] = this.options[option];
    }
    return browser.storage.local.set(setObject);
};

OptionsManager.prototype.saveOption = function (option, value) {
    if (typeof value !== "undefined") {
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
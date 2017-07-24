/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Options manager for WebExtensions local storage API
 * @param schema
 * @constructor
 */
function OptionsManager(schema) {
    this.optionsSchema = schema;
}

OptionsManager.prototype.saveAllOptions = function () {
    let setObject = {};
    for (let option of Object.keys(this.optionsSchema)) {
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
    return browser.storage.local.get(Object.keys(this.optionsSchema))
        .then(result => {
            this.options = {};
            for (let option of Object.keys(this.optionsSchema)) {
                this.options[option] = result[option];
            }
        })
        .then(callback);
};

OptionsManager.prototype.reset = function () {
    this.options = {};
    return browser.storage.local.clear();
};

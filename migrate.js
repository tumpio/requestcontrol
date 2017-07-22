/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function handleInstalled(details) {
    if (details.reason === "update") {

        if (!details.previousVersion) {
            details.previousVersion = "1.6.0";
        }

        let versions = details.previousVersion.split(".");

        // migrate from < 1.7.0
        if (Number(versions[0]) < 1 ||
            (Number(versions[0]) === 1 && Number(versions[1]) < 7) ||
            (Number(versions[0]) === 1 && Number(versions[1]) === 7) && versions[2].startsWith("0beta")) {

            let myOptionsManager = new OptionsManager(RequestControl.optionsSchema);

            myOptionsManager.loadOptions(function () {
                for (let rule of myOptionsManager.options.rules) {
                    if (rule.action === "filter" && rule.paramsFilter && !rule.paramsFilter.values) {
                        let newValue = {};
                        newValue.values = rule.paramsFilter;

                        if (newValue.values.length > 0) {
                            newValue.pattern = RequestControl.createTrimPattern(newValue.values);
                            rule.paramsFilter = newValue;
                        } else {
                            delete rule.paramsFilter;
                        }
                    }
                }
                myOptionsManager.saveAllOptions();
            });
        }
    }
}

browser.runtime.onInstalled.addListener(handleInstalled);
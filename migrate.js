/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function handleInstalled(details) {
    if (details.reason === "update") {
        let versions = details.previousVersion.split(".");

        // migrate from < 1.7.0
        if (Number(versions[0]) < 1 ||
            (Number(versions[0]) === 1 && Number(versions[1]) < 7) ||
            (Number(versions[0]) === 1 && Number(versions[1]) === 7) && versions[2].startsWith("0beta")) {

            let myOptionsManager = new OptionsManager(RequestControl.defaultOptions);

            myOptionsManager.loadOptions(function () {
                for (let rule of myOptionsManager.options.rules) {
                    if (rule.action === "filter" && rule.paramsFilter) {
                        let values = rule.paramsFilter;
                        rule.paramsFilter = {};
                        rule.paramsFilter.values = values;

                        let regexpChars = /[.+?^${}()|[\]\\]/g; // excluding * wildcard
                        let regexpParam = /^\/(.*)\/$/;

                        // construct regexp pattern of filter params
                        if (rule.paramsFilter.values.length > 0) {
                            let pattern = "";
                            for (let param of rule.paramsFilter.values) {
                                let testRegexp = param.match(regexpParam);
                                if (testRegexp) {
                                    pattern += "|" + testRegexp[1];
                                } else {
                                    pattern += "|" + param.replace(regexpChars, "\\$&").replace(/\*/g, ".*");
                                }
                            }
                            rule.paramsFilter.pattern = pattern.substring(1);
                            console.log(rule.paramsFilter);
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
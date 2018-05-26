/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function handleInstalled(details) {
    if (details.reason === "update") {

        if (!details.previousVersion) {
            details.previousVersion = "1.9.2";
        }

        let versions = details.previousVersion.split(".");

        // migrate from < 1.9.4
        if (Number(versions[0]) < 1 ||
            (Number(versions[0]) === 1 && Number(versions[1]) < 9) ||
            (Number(versions[0]) === 1 && Number(versions[1]) === 9 && Number(versions[2]) < 4)) {

            browser.storage.local.get("rules").then(options => {
                for (let rule of options.rules) {
                    if (!rule.hasOwnProperty("uuid")) {
                        rule.uuid = uuid();
                    }
                    delete rule.id;
                }
                browser.storage.local.set({rules: options.rules});
            });
        }
    }
}

browser.runtime.onInstalled.addListener(handleInstalled);
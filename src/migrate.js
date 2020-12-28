/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function handleInstalled(details) {
    if (details.reason === "update") {
        if (!details.previousVersion) {
            details.previousVersion = "1.13";
        }

        const versions = details.previousVersion.split(".");

        // migrate from < 1.14
        if (Number(versions[0]) < 1 || (Number(versions[0]) === 1 && Number(versions[1]) < 14)) {
            browser.storage.local.get("rules").then((options) => {
                for (const rule of options.rules) {
                    if (rule.uuid === "60f46cfa-b906-4a2d-ab66-8f26dc35e97f") {
                        rule.redirectDocument = true;
                    }
                }
                browser.storage.local.set({ rules: options.rules });
            });
        }
    }
}

browser.runtime.onInstalled.addListener(handleInstalled);

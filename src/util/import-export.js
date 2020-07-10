/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Export object as json file download
 */
export function exportObject(name, object, mimeType = "application/json", replacer = null, space = 2) {
    const data = JSON.stringify(object, replacer, space),
        blob = new Blob([data], { type: mimeType }),
        url = URL.createObjectURL(blob),
        link = document.createElement("a");

    document.body.appendChild(link);

    link.href = url;
    link.download = name;
    link.click();

    setTimeout(() => {
        URL.revokeObjectURL(url);
        link.remove();
    }, 0);
}

/**
 * Import json file as object
 * @param file json file
 * @returns {Promise}
 */
export function importFile(file) {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onload = function (e) {
            try {
                const json = JSON.parse(e.target.result);
                resolve(json);
            } catch (ex) {
                reject(ex);
            }
        };
        reader.onerror = function () {
            reject(new Error("FileReader error"));
        };
        reader.readAsText(file);
    });
}

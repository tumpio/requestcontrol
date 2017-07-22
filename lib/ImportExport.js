/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Export object as json file download
 * @param name file name
 * @param object object to export
 * @returns {Promise.<TResult>}
 */

function exportObject(name, object) {
    console.log(object);
    let mimeType = "application/json",
        data = JSON.stringify(object, null, 2),
        blob = new Blob([data], {type: mimeType});
    return browser.downloads.download({
        url: URL.createObjectURL(blob),
        filename: name,
        conflictAction: "overwrite",
        saveAs: true
    }).then(revokeObjectUrl);
}

/**
 * Import json file as object
 * @param file json file
 * @returns {Promise}
 */
function importFile(file) {
    let reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onload = function (e) {
            try {
                let json = JSON.parse(e.target.result);
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

function revokeObjectUrl(id) {
    browser.downloads.search({id}).then(download =>
        URL.revokeObjectURL(download.url)
    );
}


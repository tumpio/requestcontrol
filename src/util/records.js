/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const records = new Map();

export function add(tabId, record) {
    let tabRecords = records.get(tabId);
    if (!tabRecords) {
        tabRecords = [];
        records.set(tabId, tabRecords);
    }
    tabRecords.push(record);
    return tabRecords.length;
}

export function has(tabId) {
    return records.has(tabId);
}

export function keys() {
    return records.keys();
}

export function clear() {
    return records.clear();
}

export function getTabRecords() {
    return browser.tabs
        .query({
            currentWindow: true,
            active: true,
        })
        .then((tabs) => {
            return records.get(tabs[0].id);
        });
}

export function setTabRecords(tabId, tabRecords) {
    return records.set(tabId, tabRecords);
}

export function removeTabRecords(tabId) {
    records.delete(tabId);
}

export function getLastRedirectRecords(tabId, url, isServerRedirect = false, limit = 5) {
    const tabRecords = records.get(tabId);
    const lastRecord = getLastRedirectRecord(tabRecords, url, isServerRedirect, limit);

    if (!lastRecord) {
        return [];
    }
    return getLinkedRedirectRecords(lastRecord, tabRecords, limit);
}

function getLastRedirectRecord(records, url, isServerRedirect, limit) {
    let i = 0;
    while (i < limit && records.length > 0) {
        const record = records.pop();
        if (record.target === url || (isServerRedirect && record.target)) {
            return record;
        }
        i++;
    }
    return null;
}

function getLinkedRedirectRecords(record, records, limit) {
    let lastRecord = record;
    const linked = [lastRecord];
    let i = 0;
    while (i < limit && records.length > 0) {
        const record = records.pop();
        if (record.target && record.target === lastRecord.url) {
            linked.unshift(record);
            lastRecord = record;
        }
        i++;
    }
    return linked;
}

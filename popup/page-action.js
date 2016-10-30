/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var myPage;
document.addEventListener("DOMContentLoaded", function () {
    browser.runtime.getBackgroundPage().then((page) => {
        myPage = page;
        browser.tabs.query({currentWindow: true, active: true}).then((tabs) => {
            let tab = tabs[0];
            let detail = myPage.requestDetails[tab.id];
            document.getElementById("icon").src = "../icons/icon-" + detail.action + "@38.png";
            document.getElementById("title").innerHTML = myPage.titles[detail.action];
            //document.getElementById("type").innerHTML = detail.type;
            //document.getElementById("timeStamp").innerHTML = new Date(detail.timeStamp).toTimeString().split(" ")[0];
        });
    });
});
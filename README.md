## Request Control - Firefox WebExtension

### Description
Take control over your requests! Filter redirection tracking, skip confirmation pages for outgoing links or block requests entirely, and remove url parameters used in redirection tracking.

### Instructions
In the add-on's preferences create rules for requests. Set url parameters that will be omitted from filtered request url. Check the help page in add-on's preferences for further instructions.

#### Pre-defined rules include rules for

```
google.com/url
deviantart.com/users/outgoing
clk.tradedoubler.com
outgoing.prod.mozaws.net
out.reddit.com
steamcommunity.com/linkfilter
```

#### Pre-defined tracking url parameters include utm tracking parameters.</b>

```
utm_source
utm_medium
utm_campaign
```

#### Permissions required
WebExtensions use API permission management. This add-on requires permissions for the following APIs:
- webNavigation API, for setting page action (URL icon).
- webRequest API, for intercepting HTTP requests.
- webRequestBlocking, for redirecting and cancelling HTTP requests.
- storage API, for storing user configurations. 

This is my first WebExtension. From my experience I can say that WebExtensions are a limited way of creating browser extensions. You are given a basic set of APIs (access to certain capabilities of the browser) that your add-ons have to be made with. My other add-ons cannot be created as WebExtensions because there is no API for user interface modifications to customize the browser, nor API for managing search engines, nor API for creating new toolbars.

#### Lisence
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at http://mozilla.org/MPL/2.0/.
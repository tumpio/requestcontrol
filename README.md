## Request Control - Firefox WebExtension

### Description

Control your HTTP requests with Request Control Rules. Rules include request filtering (preventing redirection tracking), request blocking and request redirection.

#### Filter Requests

Skips redirection tracking. If the matched request URL contains another URL, the request is cancelled and the tab where the request was made is navigated to the contained URL. Additionally URL tracking parameters that are defined in the filtered parameters list will be removed.

#### Block Requests

Any request that matches a block rule will be cancelled before it is made.

#### Redirect Requests

Any request that matches a redirect rule will be redirected to the given redirect URL. The redirect URL supports pattern capturing to redirect based on the original request.

#### Whitelist Requests

Any request that matches a whitelist rule will be processed normally without taking any action of any other matched rules.

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

#### Lisence
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at http://mozilla.org/MPL/2.0/.
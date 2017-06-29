## Request Control - Firefox WebExtension

Control your HTTP requests with Request Control Rules. Provides frontend for Firefox [webRequest.onBeforeRequest] API
for HTTP request management.

Requests can be controlled with following rules:
<ul><li><b>Filter Requests</b>
<p>Filter requests by filtering URL redirection and trimming URL tracking parameters. </p>
</li><li><b>Block Requests</b>
<p>Block requests completely before they are made.</p></li>
<li>
<b>Redirect Requests</b>
<p>Redirect requests to manually configured redirect URL.  Redirect URL supports pattern capturing to redirect based on the original request. Read more about <a href="https://github.com/tumpio/requestcontrol/wiki/Documentation#redirect-using-pattern-capturing">Pattern Capturing</a>.</p>
</li>
<li><b>Whitelist Requests</b>
<p>Whitelisted requests proceed normally without taking actions of any other matched rules.</p></li></ul>

<strong><a  href="https://github.com/tumpio/requestcontrol/wiki/Documentation">Documentation</a></strong></br>
<strong><a  href="https://github.com/tumpio/requestcontrol/wiki/FAQ">FAQ</a></strong></br>
<strong><a  href="https://github.com/tumpio/requestcontrol">Source code</a></strong></br>
<strong><a  href="https://github.com/tumpio/requestcontrol/blob/master/LICENSE">License</a></strong></br>

#### External Libraries
Request control uses the following external libraries,
- [Bootstrap] is licensed under the MIT license.
- [tags-input] and it's fork by [@pirxpilot] are licensed under the MIT license.
- [ionicons] is licensed under the MIT license.

#### License
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at http://mozilla.org/MPL/2.0/.

#### Donate
PayPal: [![PayPal](https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=3UN97ARSMYP3U)

bitcoin:1HZp3cUWCFSoR8EfDSRopLVeEbTZiAHz2B

[webRequest.onBeforeRequest]: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/onBeforeRequest
[Bootstrap]: http://getbootstrap.com/
[tags-input]: https://github.com/developit/tags-input
[@pirxpilot]: https://github.com/pirxpilot/tags-input
[ionicons]: http://ionicons.com/

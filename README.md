## Request Control - Firefox WebExtension

Control your HTTP requests with Request Control Rules.  With Request Control rules requests can be filtered preventing redirection tracking, blocked  blocking request altogether and redirected to a custom redirect URL.

### Rules
<ul><li><b>Filter Requests</b>
Filter requests by filtering URL redirection and trimming URL tracking parameters. 
</li><li><b>Block Requests</b>
Block requests completely before they are made.</li>
<li>
<b>Redirect Requests</b>
Redirect requests to manually configured redirect URL.  Redirect URL supports pattern capturing to redirect based on the original request. Read more about <a href="https://github.com/tumpio/requestcontrol/wiki/Request-Control-Help#redirect-using-pattern-capturing">Pattern Capturing</a>.
</li>
<li><b>Whitelist Requests</b>
Whitelisted requests will proceed normally without taking actions of any other matched rules.</li></ul>

<strong><a  href="https://github.com/tumpio/requestcontrol/wiki/Request-Control-Help">Documentation</a></strong>

<strong><a  href="https://github.com/tumpio/requestcontrol/wiki/FAQ">FAQ</a></strong>

<strong><a  href="https://github.com/tumpio/requestcontrol">Source code</a></strong>

<strong><a  href="https://github.com/tumpio/requestcontrol/blob/master/LICENSE">License</a></strong>

#### API Permission requirements
WebExtensions use API permission management. This add-on requires permissions for the following APIs:
- webNavigation API, for setting page action (URL icon).
- webRequest API, for intercepting HTTP requests.
- webRequestBlocking, for redirecting and cancelling HTTP requests.
- storage API, for storing user configurations. 

#### External Libraries
Request control uses the following external libraries,
- [tags-input](https://github.com/developit/tags-input) and it's fork by [@pirxpilot](https://github.com/pirxpilot/tags-input) is licensed under the MIT license.
- [Bootstrap](http://getbootstrap.com/) is licensed under the MIT license.

#### License
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at http://mozilla.org/MPL/2.0/.
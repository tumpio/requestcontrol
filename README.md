## Request Control - Firefox extension

An extension to control HTTP requests. Provides a front-end for Firefox [webRequest.onBeforeRequest] API for
HTTP request management.

Requests can be controlled with the following rules:
<ul>
<li>
<b>Filter Request Rule</b>
<p>Filter requests by skipping URL redirection and trimming URL query parameters.</p>
</li>
<li>
<b>Redirect Request Rule</b>
<p>Redirect requests to a manually set redirect URL. Redirect rule supports redirection based on
the original request. Read more about the <a href="https://github.com/tumpio/requestcontrol/blob/master/_locales/en/manual.md#redirect-using-pattern-capturing">Pattern Capturing</a>.</p>
</li>
<li>
<b>Block Request Rule</b>
<p>Block requests before they are made.</p>
</li>
<li>
<b>Whitelist Request Rule</b>
<p>Whitelist requests to proceed normally without taking actions of any other matched rules.</p>
</li>
</ul>

<strong><a href="https://github.com/tumpio/requestcontrol/blob/master/_locales/en/manual.md">Documentation</a></strong></br>
<strong><a href="https://github.com/tumpio/requestcontrol/wiki/FAQ">FAQ</a></strong></br>
<strong><a href="https://github.com/tumpio/requestcontrol">Source code</a></strong></br>
<strong><a href="https://github.com/tumpio/requestcontrol/blob/master/LICENSE">License</a></strong></br>

### Support

* Report bugs
* Suggest new features
* Help to translate
* Contribute
* Donate

### Development
Clone repository and setup dev environment with [npm]

```
git clone https://github.com/tumpio/requestcontrol.git
cd requestcontrol
npm install
```

Run in Firefox-nightly

```
npm run start
```

Run unit tests and lint

```
npm run test ; npm run lint
```

Build extension

```
npm run build
```

#### External Libraries
Request control uses the following external libraries,
- [Bootstrap] is licensed under the MIT license.
- [tags-input] and it's fork by [@pirxpilot] are licensed under the MIT license.
- [ionicons] is licensed under the MIT license.

#### License
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at http://mozilla.org/MPL/2.0/.

[webRequest.onBeforeRequest]: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/onBeforeRequest
[Bootstrap]: http://getbootstrap.com/
[tags-input]: https://github.com/developit/tags-input
[@pirxpilot]: https://github.com/pirxpilot/tags-input
[ionicons]: http://ionicons.com/
[npm]: https://www.npmjs.com/
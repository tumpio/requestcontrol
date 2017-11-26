[![Build Status](https://travis-ci.org/tumpio/requestcontrol.svg?branch=master)](https://travis-ci.org/tumpio/requestcontrol)
[![codecov](https://codecov.io/gh/tumpio/requestcontrol/branch/master/graph/badge.svg)](https://codecov.io/gh/tumpio/requestcontrol)

## Request Control - Firefox extension

An extension to control HTTP requests. Provides a front-end for Firefox [webRequest.onBeforeRequest] API for
HTTP request management.

Requests can be controlled with the following rules:
-   ![i][1] **Filter Request Rule**

    Filter requests by skipping URL redirection and trimming URL query
    parameters.

-   ![i][2] **Redirect Request Rule**

    Redirect requests to a manually set redirect URL. Redirect rule
    supports redirection based on the original request. Read more about
    the [Pattern Capturing].

-   ![i][3] **Block Request Rule**

    Block requests before they are made.

-   ![i][4] **Whitelist Request Rule**

    Whitelist requests to proceed normally without taking actions of any
    other matched rules.

**[Manual]**  
**[FAQ]**  
**[Source code]**  
**[License]**  

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

### External Libraries
Request control uses the following external libraries,
- [Bootstrap] is licensed under the MIT license.
- [tags-input] and it's fork by [@pirxpilot] are licensed under the MIT license.
- [ionicons] is licensed under the MIT license.

### License
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at http://mozilla.org/MPL/2.0/.

[webRequest.onBeforeRequest]: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/onBeforeRequest
[Bootstrap]: http://getbootstrap.com/
[tags-input]: https://github.com/developit/tags-input
[@pirxpilot]: https://github.com/pirxpilot/tags-input
[ionicons]: http://ionicons.com/
[npm]: https://www.npmjs.com/
[Pattern Capturing]: https://github.com/tumpio/requestcontrol/blob/master/_locales/en/manual.md#redirect-using-pattern-capturing
[Manual]: https://github.com/tumpio/requestcontrol/blob/master/_locales/en/manual.md
[FAQ]: https://github.com/tumpio/requestcontrol/wiki/FAQ
[Source code]: https://github.com/tumpio/requestcontrol
[License]: https://github.com/tumpio/requestcontrol/blob/master/LICENSE
[1]: https://raw.githubusercontent.com/tumpio/requestcontrol/master/icons/icon-filter@19.png
[2]: https://raw.githubusercontent.com/tumpio/requestcontrol/master/icons/icon-redirect@19.png
[3]: https://raw.githubusercontent.com/tumpio/requestcontrol/master/icons/icon-block@19.png
[4]: https://raw.githubusercontent.com/tumpio/requestcontrol/master/icons/icon-whitelist@19.png

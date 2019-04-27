|BuildStatus| |codecov|

Request Control - Firefox extension
-----------------------------------

An extension to control HTTP requests. Provides front-end for Firefox
`webRequest.onBeforeRequest`_ API for HTTP request management.

Requests can be controlled with the following rules:

-  |if| **Filter Request Rule**

   Filter URL redirection and remove URL query parameters. 

-  |ir| **Redirect Request Rule**

   Rewrite requests with support for `Pattern Capturing`_ to redirect based on the original request.

-  |ib| **Block Request Rule**

   Block requests before they are made.

-  |iw| **Whitelist Request Rule**

   Whitelist requests without taking actions of other matched rules.

| `Manual`_
| `FAQ`_
| `Source code`_
| `License`_

Support
~~~~~~~

-  Report bugs
-  Suggest new features
-  Help to translate
-  Contribute
-  Donate

Development
~~~~~~~~~~~

Clone repository and setup development environment with `npm`_

::

    git clone https://github.com/tumpio/requestcontrol.git
    cd requestcontrol
    npm install

Run in Firefox-nightly

::

    npm start -- --firefox=nightly

Run unit tests and lint

::

    npm test ; npm run lint

Build extension

::

    npm run build

External Libraries
~~~~~~~~~~~~~~~~~~

Request control uses the following external libraries,

-  `lit`_ is licensed under the MIT license.
-  `tags-input`_ and it's fork by `@pirxpilot`_ are licensed under the MIT license.
-  `ionicons`_ is licensed under the MIT license.
-  `tldts`_ is licensed under the MIT license.

License
~~~~~~~

::

    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at http://mozilla.org/MPL/2.0/.

.. _webRequest.onBeforeRequest: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/onBeforeRequest
.. _Pattern Capturing: https://github.com/tumpio/requestcontrol/blob/master/_locales/en/manual.wiki#redirect-using-pattern-capturing
.. _Manual: https://github.com/tumpio/requestcontrol/blob/master/_locales/en/manual.wiki
.. _FAQ: https://github.com/tumpio/requestcontrol/issues?utf8=%E2%9C%93&q=label%3Aquestion+
.. _Source code: https://github.com/tumpio/requestcontrol
.. _License: https://github.com/tumpio/requestcontrol/blob/master/LICENSE
.. _npm: https://www.npmjs.com/
.. _lit: https://ajusa.github.io/lit/
.. _tags-input: https://github.com/developit/tags-input
.. _@pirxpilot: https://github.com/pirxpilot/tags-input
.. _ionicons: http://ionicons.com/
.. _tldts: https://github.com/remusao/tldts

.. |BuildStatus| image:: https://travis-ci.org/tumpio/requestcontrol.svg?branch=master
   :target: https://travis-ci.org/tumpio/requestcontrol
.. |codecov| image:: https://codecov.io/gh/tumpio/requestcontrol/branch/master/graph/badge.svg
   :target: https://codecov.io/gh/tumpio/requestcontrol
.. |if| image:: https://raw.githubusercontent.com/tumpio/requestcontrol/master/icons/icon-filter@19.png
.. |ir| image:: https://raw.githubusercontent.com/tumpio/requestcontrol/master/icons/icon-redirect@19.png
.. |ib| image:: https://raw.githubusercontent.com/tumpio/requestcontrol/master/icons/icon-block@19.png
.. |iw| image:: https://raw.githubusercontent.com/tumpio/requestcontrol/master/icons/icon-whitelist@19.png

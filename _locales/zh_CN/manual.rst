.. -*- coding: utf-8 -*-

.. _rst:

Request Control 手册
======================

Request Control 规则
--------------------

Request Control 规则由 `匹配模式`_、`类型`_ 和 `动作`_ 构成。

一个请求如果与非禁用规则的匹配模式和类型相匹配，将根据该规则拦截并采取相应动作。

匹配模式
~~~~~~~~

匹配模式用来筛选出匹配 `方案`_、`主机`_ 和 `路径`_，以及可选的
`包括和排除`_ 匹配模式的请求。

方案
^^^^^^

支持的方案是 ``http`` 和 ``https``。

+----------------+------------------------------------+
| ``http``       | 匹配一个 http 方案的请求。         |
+----------------+------------------------------------+
| ``https``      | 匹配一个 https 方案的请求。        |
+----------------+------------------------------------+
| ``http/https`` | 匹配 http 和 https 方案的请求。    |
+----------------+------------------------------------+

主机
^^^^

主机可以通过下列方式匹配一个请求的 URL 的主机（host）。

+-----------------------+-----------------------+-----------------------+
| ``www.example.com``   | 完整匹配一个主机。    |                       |
+-----------------------+-----------------------+-----------------------+
| ``*.example.com``     | 匹配指定的主机        | 将会匹配 example.com  |
|                       | 以及它的任何子域名。  | 的任何子域名          |
|                       |                       | 例如：                |
|                       |                       | **www**.example.com 和|
|                       |                       | **good**.example.com  |
+-----------------------+-----------------------+-----------------------+
| ``www.example.*``     | 匹配指定的主机        | 需将所需顶级域名      |
|                       | 配合手动列明的        | 写入到                |
|                       | 顶级域名。            | 顶级域名列表          |
|                       | （可以配合            | 框（例如 *com*、      |
|                       | （子域名              | *org*）。             |
|                       | 匹配）                |                       |
+-----------------------+-----------------------+-----------------------+
| ``*``                 | 匹配任何主机。        |                       |
+-----------------------+-----------------------+-----------------------+

路径
^^^^

Path may subsequently contain any combination of "\*" wildcard and any
of the characters that are allowed in URL path. The "\*" wildcard
matches any portion of path and it may appear more than once.

Below is examples for using path in 匹配模式s.

+-----------------------------------+-----------------------------------+
| ``*``                             | Match any path.                   |
+-----------------------------------+-----------------------------------+
| ``path/a/b/``                     | Match exact path "path/a/b/".     |
+-----------------------------------+-----------------------------------+
| ``*b*``                           | Match path that contains a        |
|                                   | component "b" somewhere in the    |
|                                   | middle.                           |
+-----------------------------------+-----------------------------------+
|                                   | Match an empty path.              |
+-----------------------------------+-----------------------------------+

包括和排除
^^^^^^^^^^^^^^^^^^^^^

A list of 匹配模式s that request URL must or must not contain. Include and exclude
匹配模式 can be defined as a string with support for wildcards "?" and "\*" (where
"?" matches any single character and "\*" matches zero or more characters),
or as a regular expression 匹配模式 ``/regexp/``.

Include and exclude 匹配模式 matching is case insensitive as opposed to `主机`_ and `路径`_
which are case sensitive.

Below is examples of using includes and excludes 匹配模式s:

+----------------------+-----------------------------------------------------------+
| ``login``            | Match urls containing "login".                            |
+----------------------+-----------------------------------------------------------+
| ``log?n``            | Matches for example urls containing "login" and "logon".  |
+----------------------+-----------------------------------------------------------+
| ``a*b``              | Match urls where "a" is followed by "b"                   |
+----------------------+-----------------------------------------------------------+
| ``/[?&]a=\d+(&|$)/`` | Match urls containing parameter "a" with digits as value. |
+----------------------+-----------------------------------------------------------+

类型
~~~~~

A type indicates the requested resource. Rule can apply from one to many
types, or any type. All the possible types are listed below.

+-----------------------------------+-----------------------------------+
| Type                              | Details                           |
+===================================+===================================+
| Document                          | Indicates a DOM document at the   |
|                                   | top-level that is retrieved       |
|                                   | directly within a browser tab.    |
|                                   | (main frame)                      |
+-----------------------------------+-----------------------------------+
| Sub document                      | Indicates a DOM document that is  |
|                                   | retrieved inside another DOM      |
|                                   | document. (sub frame)             |
+-----------------------------------+-----------------------------------+
| Stylesheet                        | Indicates a stylesheet (for       |
|                                   | example, <style> elements).       |
+-----------------------------------+-----------------------------------+
| Script                            | Indicates an executable script    |
|                                   | (such as JavaScript).             |
+-----------------------------------+-----------------------------------+
| Image                             | Indicates an image (for example,  |
|                                   | <img> elements).                  |
+-----------------------------------+-----------------------------------+
| Object                            | Indicates a generic object.       |
+-----------------------------------+-----------------------------------+
| Plugin                            | Indicates a request made by a     |
|                                   | plugin. (object_subrequest)       |
+-----------------------------------+-----------------------------------+
| XMLHttpRequest                    | Indicates an XMLHttpRequest.      |
+-----------------------------------+-----------------------------------+
| XBL                               | Indicates an XBL binding request. |
+-----------------------------------+-----------------------------------+
| XSLT                              | Indicates a style sheet           |
|                                   | transformation.                   |
+-----------------------------------+-----------------------------------+
| Ping                              | Indicates a ping triggered by a   |
|                                   | click on an <a> element using the |
|                                   | ping attribute. Only in use if    |
|                                   | browser.send_pings is enabled     |
|                                   | (default is false).               |
+-----------------------------------+-----------------------------------+
| Beacon                            | Indicates a `Beacon`_ request.    |
+-----------------------------------+-----------------------------------+
| XML DTD                           | Indicates a DTD loaded by an XML  |
|                                   | document.                         |
+-----------------------------------+-----------------------------------+
| Font                              | Indicates a font loaded via       |
|                                   | @font-face rule.                  |
+-----------------------------------+-----------------------------------+
| Media                             | Indicates a video or audio load.  |
+-----------------------------------+-----------------------------------+
| WebSocket                         | Indicates a `WebSocket`_ load.    |
+-----------------------------------+-----------------------------------+
| CSP Report                        | Indicates a `Content Security     |
|                                   | Policy`_ report.                  |
+-----------------------------------+-----------------------------------+
| Imageset                          | Indicates a request to load an    |
|                                   | <img> (with the srcset attribute) |
|                                   | or <picture>.                     |
+-----------------------------------+-----------------------------------+
| Web Manifest                      | Indicates a request to load a Web |
|                                   | manifest.                         |
+-----------------------------------+-----------------------------------+
| Other                             | Indicates a request that is not   |
|                                   | classified as being any of the    |
|                                   | above types.                      |
+-----------------------------------+-----------------------------------+

动作
~~~~~~

|image4| Filter
    Filter URL redirection and/or remove URL query parameters.

|image5| Block
    Cancel requests before they are made.

|image6| Redirect
    Redirect requests to manually configured redirect URL.

|image7| Whitelist
    Whitelist and optionally log requests.

Rule priorities
---------------

1. Whitelist rule
2. Block rule
3. Redirect rule
4. Filter rule

Whitelist rules have the highest priority and they revoke all other
rules. Next come block rules and they revoke redirect and filter rules.
Finally redirect rules will be applied before filter rules. If more than
one redirect or filter rule matches a single request they will all be
applied one by one.

Matching all URLs
-----------------

The request 匹配模式 can be set to a global 匹配模式 that matches all URLs
under the supported schemes ("http" or "https") by checking the Any URL button.

Trimming URL parameters
-----------------------

Filter rule supports URL query parameter trimming. URL query parameters
are commonly used in redirection tracking as a method to analyze the
origin of traffic. Trimmed URL parameters are defined either as literal
strings with support for "*" and "?" wildcards or using regular expression
匹配模式s.

Below is examples of parameter trimming 匹配模式s.

+------------+---------------------------------------+
| utm_source | Trim any "utm_source" param           |
+------------+---------------------------------------+
| utm\_\*    | Trim any param starting with "utm\_"  |
+------------+---------------------------------------+
| /[0-9]+/   | Trim any param containing only digits |
+------------+---------------------------------------+

Invert Trim Option
~~~~~~~~~~~~~~~~~~

Keeps only parameters that are defined in trimmed parameters list. All
other parameters will be removed.

Trim All Option
~~~~~~~~~~~~~~~

Remove all URL query parameters from filtered request.

使用匹配模式捕获来重定向
--------------------------------

Redirect rule supports redirecting requests to a manually configured URL. The redirect URL may be
parametrized using parameter expansion and redirect instructions. Parameter expansion allows to
access a set of named parameters of the original URL. Redirect instructions can be used to modify
the original request by changing the parts of the original URL (e.g. by instructing requests to
redirect to a different port).

Both methods may be combined. Redirect instructions will be parsed and applied first to the
request URL before parameter expansions.

Parameter expansion may also be used within a redirect instruction.

Parameter expansion
~~~~~~~~~~~~~~~~~~~

::

    {parameter}

Access a named parameter of the original request URL. Available named
parameters are listed at the end of this section.

Parameter expansion supports the following string manipulation formats:

子字符串替换
^^^^^^^^^^^^^^^^^^^

::

    {parameter/pattern/replacement}

Replace a matched substring in the extracted parameter. The 匹配模式 is
written in regular expression. A number of special replacement 匹配模式s
are supported, including referencing of capture groups which are described
below.

+-------+--------------------------------------------------------------+
| `$n`  | Inserts the n-th captured group counting from 1.             |
+-------+--------------------------------------------------------------+
| `$\`` | Inserts the portion of the string that precedes the matched  |
|       | substring.                                                   |
+-------+--------------------------------------------------------------+
| `$'`  | Inserts the portion of the string that follows the matched   |
|       | substring.                                                   |
+-------+--------------------------------------------------------------+
| `$&`  | Inserts the matched substring.                               |
+-------+--------------------------------------------------------------+
| `$$`  | Inserts a "$".                                               |
+-------+--------------------------------------------------------------+

子字符串提取
^^^^^^^^^^^^^^^^^^^^

::

    {parameter:offset:length}

Extract a part of the expanded parameter. Offset determines the
starting position. It begins from 0 and can be a negative value counting
from the end of the string.

解码和编码匹配模式的捕获
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

::

{parameter|encodingRule}

解码或编码匹配模式的捕获。

+--------------------+------------------------------------------------------------------------------------------------+
| encodeURI          | 编码捕获为 URI。 It does not encode the following characters: ":", "/", ";", and "?". |
+--------------------+------------------------------------------------------------------------------------------------+
| decodeURI          | Decodes an encoded URI.                                                                        |
+--------------------+------------------------------------------------------------------------------------------------+
| encodeURIComponent | 编码捕获为一个 URI 的组件。Encodes all special characters reserved for URI.      |
+--------------------+------------------------------------------------------------------------------------------------+
| decodeURIComponent | Decodes an encoded URI component.                                                              |
+--------------------+------------------------------------------------------------------------------------------------+
| encodeBase64       | 编码捕获为 Base64 字符串。                                                             |
+--------------------+------------------------------------------------------------------------------------------------+
| decodeBase64       | Decodes an encoded Base64 string.                                                              |
+--------------------+------------------------------------------------------------------------------------------------+

组合的操纵规则
^^^^^^^^^^^^^^^^^^^^^^^^^^^^

::

    {parameter(manipulation1)|(manipulation2)...|(manipulationN)}

All the string manipulation rules can be chained using a "|" pipe
character. The output is the result of the manipulations chain.

示例
^^^^^^^^

+-------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------+
| \https://{hostname}/new/path                                | Uses the hostname of the original request.                                                                                          |
+-------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------+
| \https://{hostname/([a-z]{2}) .*/$1}/new/path               | Captures a part of the hostname of the original request.                                                                            |
+-------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------+
| \https://{hostname::-3|/.co/.com}/new/path                  | Uses the hostname of the original request but manipulate its length by three cutting it from the end and replace ".co" with ".com". |
+-------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------+
| {search.url|decodeURIComponent}                             | Capture "url" search parameter and decode it.                                                                                       |
+-------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------+

重定向指令
~~~~~~~~~~~~~~~~~~~~

::

    [parameter=value]

Replace a certain part of the original request. The available named parameters are listed at the
end of this section.

The value of a redirect instruction can be parametrized using the parameter expansion described
above.

::

    [parameter={parameter<manipulations>}]

示例
^^^^^^^^

+----------------------------------------------+-----------------------------------------+
| [port=8080]                                  | Redirects the original request to       |
|                                              | a port 8080.                            |
+----------------------------------------------+-----------------------------------------+
| [port=8080][hostname=localhost]              | Redirects the original request to       |
|                                              | a port 8080 of localhost.               |
+----------------------------------------------+-----------------------------------------+
| [port=8080][hostname=localhost][hash={path}] | Redirects the original request to       |
|                                              | a port 8080 of localhost where hash     |
|                                              | is the original request's path.         |
+----------------------------------------------+-----------------------------------------+

命名参数列表
~~~~~~~~~~~~

下表列出了支持的参数名称及输出范例。

作为输入的示例地址：

::

    https://www.example.com:8080/some/path?query=value#hash

+--------------+--------------------------------------------------------------+
| 名称         | 输出                                                          |
+==============+==============================================================+
| protocol     | ``https:``                                                   |
+--------------+--------------------------------------------------------------+
| hostname     | ``www.example.com``                                          |
+--------------+--------------------------------------------------------------+
| port         | ``8080``                                                     |
+--------------+--------------------------------------------------------------+
| pathname     | ``/some/path``                                               |
+--------------+--------------------------------------------------------------+
| search       | ``?query=value``                                             |
+--------------+--------------------------------------------------------------+
| search.query | ``value``                                                    |
+--------------+--------------------------------------------------------------+
| hash         | ``#hash``                                                    |
+--------------+--------------------------------------------------------------+
| host         | ``www.example.com:8080``                                     |
+--------------+--------------------------------------------------------------+
| origin       | ``https://www.example.com:8080``                             |
+--------------+--------------------------------------------------------------+
| href         | ``https://www.example.com:8080/some/path?query=value#hash``  |
+--------------+--------------------------------------------------------------+

This manual page is build upon the material of the following MDN wiki
documents and is licenced under `CC-BY-SA 2.5`_.

1. `Match patterns`_ by `Mozilla Contributors`_
   is licensed under   `CC-BY-SA 2.5`_.
2. `webRequest.ResourceType`_ by `Mozilla
   Contributors <https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/ResourceType$history>`__
   is licensed under `CC-BY-SA 2.5`_.
3. `URL`_ by `Mozilla
   Contributors <https://developer.mozilla.org/en-US/docs/Web/API/URL$history>`__
   is licensed under `CC-BY-SA 2.5`_.
4. `nsIContentPolicy`_ by `Mozilla
   Contributors <https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIContentPolicy$history>`__
   is licensed under `CC-BY-SA 2.5`_.

.. _Beacon: https://developer.mozilla.org/en-US/docs/Web/API/Beacon_API
.. _WebSocket: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
.. _Content Security Policy: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
.. _CC-BY-SA 2.5: http://creativecommons.org/licenses/by-sa/2.5/
.. _Match patterns: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Match_patterns
.. _Mozilla Contributors: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Match_patterns$history
.. _webRequest.ResourceType: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/ResourceType
.. _URL: https://developer.mozilla.org/en-US/docs/Web/API/URL
.. _nsIContentPolicy: https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIContentPolicy

.. |image0| image:: /icons/icon-filter@19.png
.. |image1| image:: /icons/icon-block@19.png
.. |image2| image:: /icons/icon-redirect@19.png
.. |image3| image:: /icons/icon-whitelist@19.png
.. |image4| image:: /icons/icon-filter@19.png
.. |image5| image:: /icons/icon-block@19.png
.. |image6| image:: /icons/icon-redirect@19.png
.. |image7| image:: /icons/icon-whitelist@19.png

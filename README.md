Firefox webextension

### Description
Skip confirmation pages for outgoing links, annoying advertisements or other nasty page in the middle attacks and remove query parameters used for redirection tracking.

### Instructions
In the add-on's preferences define the patters for redirection url matching using the match pattern structure. Set query parameters that will be omitted from the destination url.

#### Pre-defined redirection url patters include patterns for

´´´
deviantart.com/users/outgoing
clk.tradedoubler.com
outgoing.prod.mozaws.net
steamcommunity.com/linkfilter
´´´

#### Pre-defined tracking query paramters include</b>

´´´
utm_source
utm_medium
utm_campaign
´´´

This is my first WebExtension that I have created. I wanted to try them out and see what cababilities they provide. I found out that WebExtensions are a very limited way of creating browser extensions. You are given a basic set of APIs (access to certain cabibilities of the browser) that your add-ons have to be made with. This addon was made using the three APIs, webRequest API for intercepting the HTTP requests, webRequestBlocking for redirecting the HTTP requests and storage API for storing user configurations. My other add-ons cannot be created as WebExtensions because there is no API for user interface modifications to customize the browser, and there is now API for managing search engines, and there is no API for creating new toolbars.

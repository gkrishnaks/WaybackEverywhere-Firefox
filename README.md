Wayback Everywhere
==================

* * *
Install in Firefox / Firefox for Android : https://addons.mozilla.org/en-US/firefox/addon/wayback-everywhere/ 

Install in Chrome/Chromium : Install in Chrome/Chromium : https://chrome.google.com/webstore/detail/wayback-everywhere/heienainncnjjejmamdkmbbfmblpffjj


What is Wayback Everywhere?
---------------------------
Wayback Everywhere is a browser extension/addon that allows you to automatically redirect all pages to Internet Archive's [Wayback Machine](https://web.archive.org) except the site (domains) that are in 'Excludes' List.  

Examples:

*   http://example.org  --> https://web.archive.org/web/2/https://example.org.
*   If http://gnu.org is in 'Excludes' List --> http://gnu.org  


Over time (perhaps a few days of usage..), you can build this 'Excludes' list to suit your browsing habits. More information on 'Excludes' list available here [Exclude List](#excludes-list)


Features
--------

*   **Popup menu** \- Use the Popup menu to add/remove site from Excludes list, temporarily disable WaybackEverywhere addon and open Settings and Help Pages. More information on Popup Menu available here [Popup Menu](#popup-menu)
*   **Automatic Detection of Wayback Machine Site's Error Messages** \- Addon tries to detect messages displayed by Wayback Machine and either Saves a available page to Wayback or Adds the site to Exclude list based on the error message. More information on Automatic Detection of WM Error Messages available here [Auto-detect Wayback Machine Error Messages](#auto-detect-wayback-machine-error-messages)
*   **Settings Page** \- Settings page allows you to add or remove a site from the excludes list, and also do factory reset. If you are interested, you can enable console logging from here. More information on Popup Menu available here [Settings Page](#edit-settings)



Auto-Detect Wayback Machine Error Messages
-----------------------------

*   **Save Page to Wayback Machine** \- When WaybackMachine site throws error message that says "This page is available on the web, save this page to Wayback to make it more complete", the addon automatically loads the Save page url as https://web.archive.org/save/ <URL>
*   **Auto-add to Excludes List** \- When Wayback Machine site throws error message that says it cannot load a page due to the site being excluded from Wayback Machine or if the site excluded itself from Wayback using Robots.txt file, the addon automatically detects this error message and puts the site (domainname) in Excludes list. And then it loads the live webpage. This helps the user to build her Excludes list Automatically over few days of usage.



Popup Menu
----------

Popup Menu appearance changes based on in which page you click on the Popup Menu

Any "Temporary" Exclude/Include are cleared back when the browser is closed and started again.

**When viewing an archived page**

![](images/ShowExcludes.png)

**When viewing an excluded site**

![](images/ShowIncludes.png)

**When you are on special pages**

![](images/settingspage.png)


Excludes List
-------------

*   Sites (hostnames) in the Excludes list are excluded from routing to Wayback Machine.
*   You can use popup menu buttons to add/remove from this Excludes list to suit your browsing habits
*   Temporary exclude/include 'remembers' the selection until the browser is restarted. (See Popup menu)
*   You also have the option to add or remove from Excludes list via Settings Page
*   Some Wayback Machine site's error messages like "Site excluded" - the addon can automatically detects this and adds the site (hostname) to Excludes list. This helps you in building a Excludes list without manual effort. Read more here : [Auto-detect Wayback Machine Error Messages](#auto-detect-wayback-machine-error-messages)
*   The 'Excludes' list excludes at domain level, including subdomains - for example, if we exclude _*.google.*_ \- this results in redirect rules not applying to _all_ Google sites - the ones that have 'google' in the url (i.e no redirection to wayback machine) happens across all google domains - _docs.google.com, drive.google.com, google.de, google.co.in_ and so on.
*   Now, in those domains, if there are "public pages" (like Blog posts) which do _not_ need login to view, you can use the popup menu's "Save Page Now" button to save that page alone to the wayback machine - More info on popup menu's features here [Popup Menu](#popup-menu)


Edit Settings
-------------

*   Click "Edit Settings" from Popup Menu to open Settings Page.
*   Settings page lets you view Existing Excludes list. and add or remove from excludes list manually by using the buttons provides
*   This page also lets you reset the Excludes list back to the default one provided during addon installation if the user wishes for the same. More information on the default list : [Default Excludes list provided during install](#default-excludes-list)
*   You can export and import settings from this page. More information on this here : [Export and Import Settings](#exportimport-settings)
*   Additionally, curious users may enable Logging on the checkbox provided to view system logs in Browser console.



Export/Import Settings
----------------------

*   In Settings page, you can choose to Export your settings to a .JSON file
*   You can also import your settings using a previously exported JSON file
*   Addon tries to do some validation on the imported JSON before it saves settings to Disk. But we advise not to manually edit the exported JSON before importing to avoid errors



Default Excludes List
---------------------
*   Upon install, a set of predefined rules are loaded into the Excludes List. This is to provide a starting point for the users. This list is prepared by the developer(s) of this addon on purely technical basis:
*   Some sites that are excluded from Wayback Machine - quora.com for example
*   Some sites that use robots.txt file on server to exclude themselves from Wayback Machine - smithsonianmag.com, for example
*   Some sites that may need login, as Wayback Machine archives public pages only. For example, docs.google.com or paypal.com , or some sites that host video content which may not work in Waymachine Archived version like youtube.com or vimeo.com
*   Some sites that may not work fine with Wayback Machine - ft.com for example.
*   Some URL shortener sites.
*   Some Search engines to help the user avoid seeing Wayback redirects when she searches
*   Some local address like 127.0.0 * and 192.168.* so that user can browse these without routing
P.S : There's no other agenda behind this bundled list made available during install :)


If user wishes to reset his Excludes back to the ones provided by Developer, she can do so from the Settings Page


License
-------

The WaybackEverywhere addon is licensed under GPLv3 license. Refer the full license here : [License](LICENSE.html)


\-\-\-

Wayback Everywhere - a browser addon/extension to redirect all pages to archive.org's Wayback Machine except the ones in Excludes List  

Copyright (C) 2018 Gokulakrishna K S  
This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.  
This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.  
You should have received a copy of the GNU General Public License along with this program. If not, see https://www.gnu.org/licenses/

\-\-\-

The developer of this addon/extension is _NOT_ affliated with the Internet Archive (archive.org or web.archive.org)



Privacy Policy in one line : We do not collect your data. Detailed privacy policy page : [Privacy Policy](privacy.html)



Credits and Acknowledgements
----------------------------
*   This addon is built based on the 'Redirector' addon developed by [Einar Regilsson](http://einaregilsson.com/redirector). He published its sourcecode under MIT license.
*   The developer of this addon is _NOT_ affliated to Internet Archive (archive.org) or its Wayback Machine (web.archive.org)- but I thank them for making web.archive.org a freely available resource on the internet for the benefit of general public, and the commons.
*   This addon uses the icons from https://addons.mozilla.org/en-US/firefox/addon/wayback-machine_new/. Some parts of popup.html were also taken from this addon.
*   This addon uses libraries/frameworks - AngularJS, Bootstrap (CSS and JS), FontAwesome, and JQuery. These are governed by their respective licenses. You can refer to their websites for the same.

--------
Developed by Gokulakrishna. [gokulakrishnaks@gmail.com](mailto:gokulakrishnaks@gmail.com?subject=WaybackEverywhere%20Feedback ) Twitter : [@gkrishnaks](https://twitter.com/gkrishnaks )

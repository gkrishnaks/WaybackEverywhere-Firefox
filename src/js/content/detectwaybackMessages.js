/*******************************************************************************

    Wayback Everywhere - a browser addon/extension to redirect all pages to
    archive.org's Wayback Machine except the ones in Excludes List
    Copyright (C) 2018 Gokulakrishna K S

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

    Home: https://gitlab.com/gkrishnaks/WaybackEverywhere-Firefox
*/

var $contentScript = {};
$contentScript.sendBgMessage = (type, category) => {
  chrome.runtime.sendMessage(
    {
      type: type,
      subtype: "fromContent",
      category: category
    },
    function(response) {
      // console.log('returnned to content script' + response.message);
    }
  );
};

(() => {
  let error = document.getElementById("error");

  if (error !== null) {
    let fullString = "";
    for (let i = 0; i < error.childElementCount; i++) {
      fullString = fullString + " " + error.children[i].innerText;
    }
    //console.log(fullString);
    let canSave = fullString.indexOf("Save this url in the Wayback Machine");
    let e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15;
    e1 = fullString.indexOf("Page cannot");
    e2 = fullString.indexOf("excluded from the Wayback Machine");
    e3 = fullString.indexOf("doesn't look like an valid URL");
    e4 = fullString.indexOf("Hrm");
    e5 = fullString.indexOf("Wayback Machine doesn't have that page archived");
    e6 = fullString.indexOf("Bummer");
    e7 = fullString.indexOf(
      "not available on the live web or can not be archived"
    );
    e8 = fullString.indexOf(
      "retrieve all the files we need to display that page"
    );
    e9 = fullString.indexOf("Wayback Exception");
    e10 = fullString.indexOf("unknown exception has occured");
    e11 = fullString.indexOf(
      "snapshot cannot be displayed due to an internal error"
    );
    e12 = fullString.indexOf("because of server error");
    e13 = fullString.indexOf("because page does not exist");
    e14 = fullString.indexOf(
      "This page is not available on the web because access is forbidden"
    );
    e15 = fullString.indexOf("because access is forbidden");

    //console.log(canSave, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10);
    if (canSave > -1) {
      //  console.log('detected save this page');
      $contentScript.sendBgMessage("savetoWM", "save");
    } else if (e1 > -1 || e2 > -1) {
      //  console.log('robot txt detected or page is excluded');
      $contentScript.sendBgMessage("excludethisSite", "AddtoExcludesList");
    } else if (e4 > -1 && e5 > -1) {
      //  console.log('Not other errors like robots.txt or excluded, we will try saving this page');
      $contentScript.sendBgMessage("savetoWM", "save");
    } else if (e6 > -1 && e7 > -1) {
      $contentScript.sendBgMessage("excludethisSite", "AddtoTempExcludesList");
    } else if (e8 > -1 || e9 > -1 || e10 > -1 || e11 > -1 || e12 > -1) {
      $contentScript.sendBgMessage("excludethisSite", "AddtoTempExcludesList");
    } else if (e3 > -1 || e13 > -1 || e14 > -1 || e15 > -1) {
      $contentScript.sendBgMessage("excludethisSite", "AddtoTempExcludesList");
    } else {
      //log('detected unknown error, perhaps an archived page had an id error.. Ignore');
    }
  }

  //to hide wayback hideWaybackToolbat
  // We hide for 2 cases
  // 1. In desktop firefox, when a user clicks save as pdf button. This feature not available in chrome as chrome does not provide API for printPDF.
  // 2. In Firefox Android, as there`s limited screen space,  let's hide it
  // Below is for case2, case 1 handled by hideWMtoolbar.js called from popup.js

  if (navigator.userAgent.match(/Android/i)) {
    let c = document.getElementById("wm-tb-close");
    if (c !== null) {
      c.click();
    }
  }
})();

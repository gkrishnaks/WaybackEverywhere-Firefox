/*******************************************************************************

    Wayback Everywhere - a browser addon/extension to redirect all pages to
    archive.org's Wayback Machine except the ones in Excludes List
    Copyright (C) 2018 - 2019 Gokulakrishna Sudharsan

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

//save page on an temporarily excluded page, popup buttons don't reflect that it's temp excluded.. but alert is correct. check this issue

var PopupApp = window.PopupApp || {};
PopupApp.storage = chrome.storage.local;
PopupApp.webextpagesExcluded = true;
PopupApp.issiteexcluded = true;
PopupApp.SettingsInAboutConfig = true;
PopupApp.logging = false;

PopupApp.showstat = false;
PopupApp.savecount = 0;
PopupApp.statsShown = true;
PopupApp.loadcount = 0;
PopupApp.tempIncludes = [];
PopupApp.tempExcludes = [];
//$scope.excludesList = [];
PopupApp.isLoadAllLinksEnabled = false;
PopupApp.hideIncludebutton = false;
PopupApp.appVersion = "1.0.0";
PopupApp.isDomainTempIncluded = false;
PopupApp.isDomainTempExcluded = false;
PopupApp.isDomainInExcludesList = false;
PopupApp.showRefreshAlert = false;
PopupApp.redirectslist = [];

PopupApp.log = function(msg) {
  if (PopupApp.logging) {
    console.log("WaybackEverywhere Popup: " + JSON.stringify(msg));
  }
};
PopupApp.isMobilefirefox = false;
if (navigator.userAgent.match(/Android/i)) {
  PopupApp.isMobilefirefox = true;
}

PopupApp.openUrl = url => {
  //switch to open one if we have it to minimize conflicts
  chrome.tabs.query(
    {
      currentWindow: true
    },
    function(tabs) {
      //FIREFOXBUG: Firefox chokes on url:url filter if the url is a moz-extension:// url
      //so we don't use that, doing it the more manual way instead.
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].url == url) {
          chrome.tabs.update(
            tabs[i].id,
            {
              active: true,
              url: url // to refresh the settings page to pick if something's changed in excludes
              // url:url is not required for help.html but reload doesn't harm.. :)
            },
            function(tab) {
              close();
            }
          );
          return;
        }
      }

      chrome.tabs.create({
        url: url
      });
      window.close();
    }
  );
};

//only for firefox desktop. Firefox android and chrome does not have this api
PopupApp.saveAsPDF = () => {
  //close wayback toolbar before saving as pdf, otherwise it shows up in pdf

  let executing = browser.tabs.executeScript({
    file: "/js/content/hideWMtoolbar.js"
  });
  executing.then(function() {
    browser.tabs.saveAsPDF({}).then(status => {
      PopupApp.log(status);
    });
  }, PopupApp.onError);
};

PopupApp.getPattern = () => {
  let pattern = "|*" + PopupApp.domain + "*";
  return pattern;
};

PopupApp.loadAll1pLinks = selector => {
  selector = selector.replace(/[\|&;\$%@"<>\(\)\+\^\'\*,]/g, "");
  let type = "getAllFirstPartylinks";
  if (selector.length > 0 && selector !== "Enter a selector") {
    chrome.tabs.sendMessage(
      PopupApp.tabid,
      {
        type: type
      },
      function(response) {
        //console.PopupApp.log(response.data);
        PopupApp.log(selector + " is the selector");
        PopupApp.log("list of all URLS --> " + response.data);
        chrome.runtime.sendMessage({
          type: "openAllLinks",
          subtype: "fromPopup",
          data: response.data,
          tabid: PopupApp.tabid,
          selector: selector
        });
      }
    );
  }
};

PopupApp.sendExcludeMessage = category => {
  if (PopupApp.domain.length != 0 && PopupApp.domain != "web.archive.org") {
    chrome.runtime.sendMessage(
      {
        type: "excludethisSite",
        subtype: "fromPopup",
        url: PopupApp.currentUrl,
        tabid: PopupApp.tabid,
        category: category
      },
      function(response) {
        PopupApp.log("returned to popup script " + response.message);
        window.close();
      }
    );
  }
};

// TODO : Move the below to Background script similar to AddtoExcludes

PopupApp.removeSitefromexclude = isFromClearTemps => {
  PopupApp.log(PopupApp.domain + " is to removed from excludes");
  if (PopupApp.domain.length != 0 && PopupApp.domain != "web.archive.org") {
    PopupApp.issiteexcluded = false;
    let incUrl = PopupApp.getPattern();
    //console.PopupApp.log('Remove from exclude url is ' + incUrl);
    chrome.runtime.sendMessage(
      {
        type: "getredirects"
      },
      function(response) {
        // console.PopupApp.log(response);
        PopupApp.log(JSON.stringify(response));
        PopupApp.redirectslist = [];
        PopupApp.redirectslist.push(response.redirects[0]);

        PopupApp.log(
          "exclude pattern before removing site from exclude.." +
            PopupApp.redirectslist[0].excludePattern
        );
        PopupApp.redirectslist[0].excludePattern = PopupApp.redirectslist[0].excludePattern.replaceAll(
          incUrl,
          ""
        );
        PopupApp.log(
          "exclude pattern after removing site from exclude.." +
            PopupApp.redirectslist[0].excludePattern
        );

        chrome.runtime.sendMessage(
          {
            type: "saveredirects",
            redirects: PopupApp.redirectslist
          },
          function(response) {
            // PopupApp.log('Saved ' + PopupApp.redirectslist.length + ' redirects at ' + new Date() +             '. Message from background page:' +         response.message);
            if (!isFromClearTemps) {
              let wmurl =
                "https://web.archive.org/web/2/" + PopupApp.currentUrl;
              //chrome.tabs.reload({bypassCache: true});
              //using updare instead of just a reload as it didn't seem to work in android firefox
              chrome.tabs.update(PopupApp.tabid, {
                active: true,
                url: wmurl
              });
            } else {
              chrome.tabs.update(PopupApp.tabid, { active: true });
            }
            window.close();
          }
        );
      }
    );
  }
};

PopupApp.toggleDisabled = () => {
  PopupApp.storage.set(
    {
      disabled: !PopupApp.disabled
    },
    resp => {
      PopupApp.disabled = !PopupApp.disabled;
      let data;
      if (PopupApp.disabled == true) {
        data = "Wayback Everywhere is disabled";
        console.log(data);
      } else {
        data = "Wayback Everywhere is enabled";
        console.log(data);
      }
      chrome.runtime.sendMessage({
        type: "notify",
        data: data
      });
      DOM.popupDOM.updateDOM();
    }
  );
};

/*
function addSitetoExclude() {
  sendExcludeMessage("AddtoExcludesList");
  // AddtoExcludesList AddtoTempExcludesList
} */

PopupApp.getCurrentUrl = function(update) {
  chrome.tabs.query(
    {
      active: true,
      currentWindow: true
    },
    function(tabs) {
      PopupApp.tabid = tabs[0].id;
      PopupApp.currentUrl = tabs[0].url;
      // indexReaderURL handling is for Android firefox reader mode https://gitlab.com/gkrishnaks/WaybackEverywhere-Chrome/issues/70
      let indexReaderURL = PopupApp.currentUrl.indexOf("about:reader");
      if (indexReaderURL === 0) {
        PopupApp.currentUrl = PopupApp.currentUrl.substring(17);
        PopupApp.currentUrl = decodeURIComponent(PopupApp.currentUrl);
      }
      let urlDetails = UrlHelper.getHostfromUrl(PopupApp.currentUrl);
      PopupApp.domain = urlDetails.hostname;
      if (PopupApp.currentUrl.indexOf("-extension://") < 0) {
        PopupApp.webextpagesExcluded = false;
      }

      if (PopupApp.currentUrl.indexOf("view-source:") > -1) {
        PopupApp.webextpagesExcluded = true;
      }
      if (PopupApp.currentUrl.domain == "web.archive.org") {
        PopupApp.hideIncludebutton = true;
      }
      if (PopupApp.currentUrl.indexOf("file:/") > -1) {
        PopupApp.webextpagesExcluded = true;
      }
      if (PopupApp.currentUrl.indexOf("ftp:/") > -1) {
        PopupApp.webextpagesExcluded = true;
      }
      PopupApp.settingsInAboutConfig = true;
      if (PopupApp.currentUrl.indexOf("about:") >= 0) {
        PopupApp.settingsInAboutConfig = false;
      }

      if (PopupApp.currentUrl.indexOf("chrome://") >= 0) {
        PopupApp.settingsInAboutConfig = false;
      }
      PopupApp.settingspagehide = false;
      if (PopupApp.currentUrl.indexOf("settings.html") >= 0) {
        PopupApp.settingspagehide = true;
      }

      if (PopupApp.currentUrl.indexOf("web.archive.org") < 0) {
        PopupApp.issiteexcluded = false;
      } else {
        PopupApp.issiteexcluded = true;
      }
      PopupApp.updateDetails();
    }
  );
};

PopupApp.getCurrentUrl();

PopupApp.applyTemptoPermanent = whichArray => {
  let toClear = "";
  if (whichArray === "includes") {
    toClear = "cleartempIncludes";
  } else if (whichArray === "excludes") {
    toClear = "cleartempExcludes";
  }

  chrome.runtime.sendMessage(
    {
      type: "clearTemps",
      domain: PopupApp.domain,
      subtype: "fromPopup",
      url: PopupApp.currentUrl,
      tabid: PopupApp.tabid,
      toClear: toClear
    },
    function(response) {
      if (whichArray === "includes") {
        PopupApp.removeSitefromexclude(true);
      } else {
        chrome.tabs.update(PopupApp.tabid, { active: true });
        window.close();
      }
    }
  );
};

PopupApp.updateDetails = () => {
  chrome.runtime.sendMessage(
    {
      type: "appDetails",
      subtype: "fromPopup",
      domain: PopupApp.domain
    },
    function(response) {
      // logging.enabled = response.logstatus;
      PopupApp.logging = response.logstatus;

      let count = JSON.parse(response.counts);
      PopupApp.savecount = count.waybackSavescount;
      PopupApp.loadcount = count.archivedPageLoadsCount;

      PopupApp.disabled = response.appDisabled;
      PopupApp.tempExcludes = response.tempExcludes;
      PopupApp.tempIncludes = response.tempIncludes;
      PopupApp.isLoadAllLinksEnabled = response.isLoadAllLinksEnabled;
      let domainStatus = response.domainStatus;
      if (domainStatus === "domainTempExcluded") {
        PopupApp.isDomainTempExcluded = true;
      } else if (domainStatus === "domainTempIncluded") {
        PopupApp.isDomainTempIncluded = true;
      } else if (domainStatus === "domainInExcludes") {
        PopupApp.isDomainInExcludesList = true;
      }
      if (PopupApp.domain.length !== 0) {
        PopupApp.showRefreshAlert = true;
      }
      PopupApp.appVersion = response.appVersion;
      DOM.popupDOM.updateDOM();
      PopupApp.log(PopupApp);
    }
  );
};

PopupApp.clearTempRules = whichArray => {
  let index = -1;
  if (whichArray === "tempIncludes") {
    index = PopupApp.tempIncludes.indexOf(PopupApp.getPattern());
    if (index > -1) {
      PopupApp.tempIncludes.splice(index, 1);
      PopupApp.storage.set(
        {
          tempIncludes: PopupApp.tempIncludes
        },
        function() {
          PopupApp.sendExcludeMessage("AddtoExcludesList");
        }
      );
    }
  } else if (whichArray === "tempExcludes") {
    index = PopupApp.tempExcludes.indexOf(PopupApp.getPattern());
    if (index > -1) {
      PopupApp.tempExcludes.splice(index, 1);
      PopupApp.storage.set(
        {
          tempExcludes: PopupApp.tempExcludes
        },
        function() {
          PopupApp.removeSitefromexclude(false);
        }
      );
    }
  }
};

// TODO : Move the below to Background script similar to AddtoExcludes
PopupApp.removeSitefromexcludeTemp = () => {
  if (PopupApp.domain.length != 0 && PopupApp.domain != "web.archive.org") {
    //var tempInc = [];
    PopupApp.storage.get(
      {
        tempIncludes: []
      },
      function(obj) {
        PopupApp.log("Temp includes before.." + obj.tempIncludes);
        var tempInc = obj.tempIncludes;
        tempInc.push(PopupApp.getPattern());
        PopupApp.log("Temp includes before.." + obj.tempIncludes);
        PopupApp.storage.set(
          {
            tempIncludes: tempInc
          },
          function(a) {
            PopupApp.removeSitefromexclude(false);
          }
        );
      }
    );
  }
};

String.prototype.replaceAll = function(searchStr, replaceStr) {
  var str = this;

  // escape regexp special characters in search string
  searchStr = searchStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");

  return str.replace(new RegExp(searchStr, "gi"), replaceStr);
};

PopupApp.onError = error => {
  PopupApp.log(`Error in popupApp : ${error}`);
};

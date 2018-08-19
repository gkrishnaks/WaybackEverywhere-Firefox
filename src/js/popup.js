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

var popupApp = angular.module("popupApp", []);

popupApp.config([
  "$compileProvider",
  function($compileProvider) {
    $compileProvider.imgSrcSanitizationWhitelist(
      /^\s*(https?|local|data|moz-extension|chrome-extension):/
    );
  }
]);

popupApp.controller("PopupCtrl", function PopupCtrl($scope) {
  // get the existing redirect
  $scope.redirectslist = [];
  $scope.excludethisSite = "jj";
  $scope.domain = "";
  var storage = chrome.storage.local; // TODO: Change to sync when Firefox supports it...
  $scope.webextpagesExcluded = true;
  $scope.issiteexcluded = true;
  $scope.SettingsInAboutConfig = true;
  $scope.logging = false;
  var currentUrl, tabid, url2;
  $scope.showstat = false;
  $scope.savecount = 0;
  $scope.loadcount = 0;
  $scope.tempIncludes = [];
  $scope.tempExcludes = [];
  //$scope.excludesList = [];
  $scope.isLoadAllLinksEnabled = false;
  $scope.hideIncludebutton = false;
  $scope.appVersion = "1.0.0";
  $scope.isDomainTempIncluded = false;
  $scope.isDomainTempExcluded = false;
  $scope.isDomainInExcludesList = false;
  $scope.showRefreshAlert = false;
  getCurrentUrl(updateDetails);

  function updateDetails() {
    chrome.runtime.sendMessage(
      {
        type: "appDetails",
        subtype: "fromPopup",
        domain: $scope.domain
      },
      function(response) {
        // log.enabled = response.logstatus;
        $scope.logging = response.logstatus;
        let counts = JSON.parse(response.counts);
        $scope.savecount = counts.waybackSavescount;
        $scope.loadcount = counts.archivedPageLoadsCount;
        $scope.disabled = response.appDisabled;
        $scope.tempExcludes = response.tempExcludes;
        $scope.tempIncludes = response.tempIncludes;
        let domainStatus = response.domainStatus;
        if (domainStatus === "domainTempExcluded") {
          $scope.isDomainTempExcluded = true;
        } else if (domainStatus === "domainTempIncluded") {
          $scope.isDomainTempIncluded = true;
        } else if (domainStatus === "domainInExcludes") {
          $scope.isDomainInExcludesList = true;
        }
        if ($scope.domain.length !== 0) {
          $scope.showRefreshAlert = true;
        }
        $scope.appVersion = response.appVersion;
        $scope.$apply();
      }
    );
  }

  function log(msg) {
    if ($scope.logging) {
      console.log("WaybackEverywhere Popup: " + msg);
    }
  }

  function getCurrentUrl(update) {
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true
      },
      function(tabs) {
        tabid = tabs[0].id;
        currentUrl = tabs[0].url;
        // indexReaderURL handling is for Android firefox reader mode https://gitlab.com/gkrishnaks/WaybackEverywhere-Firefox/issues/70
        let indexReaderURL = currentUrl.indexOf("about:reader");
        if (indexReaderURL === 0) {
          currentUrl = currentUrl.substring(17);
          currentUrl = decodeURIComponent(currentUrl);
        }
        url2 = currentUrl;
        let urlDetails = getHostfromUrl(url2);
        $scope.domain = urlDetails.hostname;
        if (url2.indexOf("-extension://") < 0) {
          $scope.webextpagesExcluded = false;
        }

        if (url2.indexOf("view-source:") > -1) {
          $scope.webextpagesExcluded = true;
        }
        if ($scope.domain == "web.archive.org") {
          $scope.hideIncludebutton = true;
        }
        if (url2.indexOf("file:/") > -1) {
          $scope.webextpagesExcluded = true;
        }
        if (url2.indexOf("ftp:/") > -1) {
          $scope.webextpagesExcluded = true;
        }

        if (url2.indexOf("about:") >= 0) {
          $scope.SettingsInAboutConfig = false;
        }

        if (url2.indexOf("chrome://") >= 0) {
          $scope.SettingsInAboutConfig = false;
        }
        if (url2.indexOf("settings.html") >= 0) {
          $scope.settingspagehide = true;
        }

        if (url2.indexOf("web.archive.org") < 0) {
          $scope.issiteexcluded = false;
        } else {
          $scope.issiteexcluded = true;
        }
        update();
        $scope.$apply();
      }
    );
  }

  // TO DO - need to check if site in tempExcludes or tempIncludes and show popup buttons accordingly ..  : TODO

  $scope.loadAll1pLinks = function(selector) {
    //console.log(selector);
    selector = selector.replace(/[\|&;\$%@"<>\(\)\+\^\'\*,]/g, "");
    let type = "getAllFirstPartylinks";
    if (selector.length > 0 && selector !== "Enter a selector") {
      chrome.tabs.sendMessage(
        tabid,
        {
          type: type
        },
        function(response) {
          //console.log(response.data);
          log(selector + " is the selector");
          log("list of all URLS --> " + response.data);
          chrome.runtime.sendMessage({
            type: "openAllLinks",
            subtype: "fromPopup",
            data: response.data,
            tabid: tabid,
            selector: selector
          });
        }
      );
    }
  };

  $scope.savePage = function() {
    chrome.runtime.sendMessage(
      {
        type: "savetoWM",
        subtype: "fromPopup",
        url: currentUrl,
        tabid: tabid
      },
      function(response) {
        log("returned to popup script" + response.message);
        window.close();
      }
    );
  };

  $scope.showstats = function() {
    $scope.showstat = !$scope.showstat;
  };

  var getPattern = function() {
    let pattern = "|*" + $scope.domain + "*";
    return pattern;
  };

  $scope.addSitetotempExclude = function() {
    $scope.sendExcludeMessage("AddtoTempExcludesList");
  };

  $scope.addSitetoExclude = function() {
    $scope.sendExcludeMessage("AddtoExcludesList");
    // AddtoExcludesList AddtoTempExcludesList
  };

  $scope.sendExcludeMessage = function(category) {
    if ($scope.domain.length != 0 && $scope.domain != "web.archive.org") {
      chrome.runtime.sendMessage(
        {
          type: "excludethisSite",
          subtype: "fromPopup",
          url: currentUrl,
          tabid: tabid,
          category: category
        },
        function(response) {
          log("returned to popup script " + response.message);
          window.close();
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

  // TODO : Move the below to Background script similar to AddtoExcludes
  $scope.removeSitefromexcludeTemp = function() {
    if ($scope.domain.length != 0 && $scope.domain != "web.archive.org") {
      //var tempInc = [];
      storage.get(
        {
          tempIncludes: []
        },
        function(obj) {
          log("Temp includes before.." + obj.tempIncludes);
          var tempInc = obj.tempIncludes;
          tempInc.push(getPattern());
          log("Temp includes before.." + obj.tempIncludes);
          storage.set(
            {
              tempIncludes: tempInc
            },
            function(a) {
              let k = false;
              $scope.removeSitefromexclude(k);
            }
          );
        }
      );
    }
  };

  // TODO : Move the below to Background script similar to AddtoExcludes

  $scope.removeSitefromexclude = function(isFromClearTemps) {
    log($scope.domain);
    log($scope.domain.length);
    if ($scope.domain.length != 0 && $scope.domain != "web.archive.org") {
      $scope.issiteexcluded = false;
      let incUrl = getPattern();
      //console.log('Remove from exclude url is ' + incUrl);
      chrome.runtime.sendMessage(
        {
          type: "getredirects"
        },
        function(response) {
          // console.log(response);
          log(JSON.stringify(response));

          $scope.redirectslist.push(response.redirects[0]);

          log(
            "exclude pattern before removing site from exclude.." +
              $scope.redirectslist[0].excludePattern
          );
          $scope.redirectslist[0].excludePattern = $scope.redirectslist[0].excludePattern.replaceAll(
            incUrl,
            ""
          );
          log(
            "exclude pattern after removing site from exclude.." +
              $scope.redirectslist[0].excludePattern
          );

          chrome.runtime.sendMessage(
            {
              type: "saveredirects",
              redirects: $scope.redirectslist
            },
            function(response) {
              // log('Saved ' + $scope.redirectslist.length + ' redirects at ' + new Date() +             '. Message from background page:' +         response.message);
              if (!isFromClearTemps) {
                var wmurl = "https://web.archive.org/web/2/" + currentUrl;
                //chrome.tabs.reload({bypassCache: true});
                //using updare instead of just a reload as it didn't seem to work in android firefox
                chrome.tabs.update(tabid, {
                  active: true,
                  url: wmurl
                });
              } else {
                chrome.tabs.update(tabid, { active: true });
              }
              window.close();
            }
          );
        }
      );
    }
  };

  // Getting alltabs each time and using it for openUrl seems to cause flickering effect
  // when we click popup. Moving it back inside OpenUrl function so allTabs can be
  // as and when needed

  var openUrl = function(url) {
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

  $scope.pageReload = function() {
    openUrl(currentUrl);
  };

  $scope.openHelp = function() {
    var url = chrome.extension.getURL("help.html");
    openUrl(url);
  };

  function onError(error) {
    log(`Error: ${error}`);
  }

  $scope.saveAsPDF = function() {
    //close wayback toolbar before saving as pdf, otherwise it shows up in pdf

    let executing = browser.tabs.executeScript({
      file: "/js/hideWMtoolbar.js"
    });
    executing.then(function() {
      browser.tabs.saveAsPDF({}).then(status => {
        log(status);
      });
    }, onError);
  };

  $scope.isMobilefirefox = false;
  if (navigator.userAgent.match(/Android/i)) {
    $scope.isMobilefirefox = true;
  }

  $scope.seefirstversion = function() {
    chrome.runtime.sendMessage({
      type: "seeFirstVersion",
      subtype: "fromPopup",
      url: currentUrl,
      tabid: tabid
    });
  };

  $scope.toggleDisabled = function() {
    storage.set({
      disabled: !$scope.disabled
    });
    $scope.disabled = !$scope.disabled;
    let data;
    if ($scope.disabled == true) {
      data = "Wayback Everywhere is disabled";
      log(data);
    } else {
      data = "Wayback Everywhere is enabled";
      log(data);
    }
    chrome.runtime.sendMessage({
      type: "notify",
      data: data
    });
  };

  $scope.settingspagehide = false;

  $scope.openWayBackEverywhereSettings = function() {
    var url = chrome.extension.getURL("settings.html");
    openUrl(url);
  };

  $scope.clearTempRules = function(whichArray) {
    let index = -1;
    if (whichArray === "tempIncludes") {
      index = $scope.tempIncludes.indexOf(getPattern());
      if (index > -1) {
        $scope.tempIncludes.splice(index, 1);
        storage.set(
          {
            tempIncludes: $scope.tempIncludes
          },
          function() {
            $scope.addSitetoExclude();
          }
        );
      }
    } else if (whichArray === "tempExcludes") {
      index = $scope.tempExcludes.indexOf(getPattern());
      if (index > -1) {
        $scope.tempExcludes.splice(index, 1);
        storage.set(
          {
            tempExcludes: $scope.tempExcludes
          },
          function() {
            $scope.removeSitefromexclude(false);
          }
        );
      }
    }
  };

  $scope.applyTemptoPermanent = function(whichArray) {
    let toClear = "";
    if (whichArray === "includes") {
      toClear = "cleartempIncludes";
    } else if (whichArray === "excludes") {
      toClear = "cleartempExcludes";
    }

    chrome.runtime.sendMessage(
      {
        type: "clearTemps",
        domain: $scope.domain,
        subtype: "fromPopup",
        url: currentUrl,
        tabid: tabid,
        toClear: toClear
      },
      function(response) {
        if (whichArray === "includes") {
          let isfromclear = true;
          $scope.removeSitefromexclude(isfromclear);
        } else {
          chrome.tabs.update(tabid, { active: true });
          window.close();
        }
      }
    );
  };
  // Add stuff above this line
});

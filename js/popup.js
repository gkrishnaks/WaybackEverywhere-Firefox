/*******************************************************************************

    Wayback Everywhere - a browser addon/extension to redirect all pages to
    archive.org's Wayback Machine except the ones in Excludes List
    Copyright (C) 2018 Gokulakrishna K S

    his program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

    Home: https://github.com/gkrishnaks
*/


angular.module('popupApp', []).controller('PopupCtrl', ['$scope', function($s) {
  // get the existing redirect
  $s.redirectslist = [];
  $s.excludethisSite = 'jj';
  var storage = chrome.storage.local; // TODO: Change to sync when Firefox supports it...
  $s.webextpagesExcluded = true;
  $s.issiteexcluded = true;
  $s.SettingsInAboutConfig = true;
  log.enabled = false;
  var currentUrl, tabid, url2, domain;
  $s.showstat = false;
  $s.savecount = 0;
  $s.loadcount = 0;
  var tempIncludes = [];
  var tempExcludes = [];

  getCurrentUrl(updateDetails);

  function updateDetails() {
    chrome.runtime.sendMessage({
        type: "appDetails",
      },
      function(response) {
        log.enabled = response.logstatus;
        let counts = JSON.parse(response.counts);
        // {"archivedPageLoadsCount":0,"waybackSavescount":0}
        $s.savecount = counts.waybackSavescount;
        $s.loadcount = counts.archivedPageLoadsCount;
        $s.disabled = response.appDisabled;
        tempExcludes = response.tempExcludes;
        tempIncludes = response.tempIncludes;
        //  console.log('tempExcludes is ' + tempExcludes + ' tempIncludes is ' + tempIncludes);

        $s.$apply();


      });
  }


  function log(msg) {
    if (log.enabled) {
      console.log('WaybackEverywhere Popup: ' + msg);
    }
  }

  function getCurrentUrl(update) {
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, function(tabs) {
      tabid = tabs[0].id;
      currentUrl = tabs[0].url;
      url2 = currentUrl;
      $s.domain = getHostfromUrl(url2).hostname;
      if (url2.indexOf('-extension://') < 0) {
        $s.webextpagesExcluded = false;
      }

      if (url2.indexOf('view-source:') > -1) {
        $s.webextpagesExcluded = true;

      }
      if (url2.indexOf('file:/') > -1) {
        $s.webextpagesExcluded = true;
      }
      if (url2.indexOf('ftp:/') > -1) {
        $s.webextpagesExcluded = true;
      }

      if (url2.indexOf('about:') >= 0) {
        $s.SettingsInAboutConfig = false;
      }

      if (url2.indexOf('chrome://') >= 0) {
        $s.SettingsInAboutConfig = false;

      }
      if (url2.indexOf('settings.html') > 0) {
        $s.settingspagehide = true;
      }

      if (url2.indexOf('web.archive.org') < 0) {

        $s.issiteexcluded = false;
        //  console.log('tempExcludes.length ' + tempExcludes.length);
        // if(tempExcludes.length>0){
        //TODO- need to check if site in tempExcludes or tempIncludes and show popup buttons accordingly ..  :

        //$s.isSiteInTempExcludes = checkIfSiteInTempExcludes(url2);
        //console.log('isSiteInTempExcludes ' + $s.isSiteInTempExcludes);
      } else {
        $s.issiteexcluded = true;
        // console.log('tempIncludes.length '+tempIncludes.length);
        // TODO- need to check if site in tempExcludes or tempIncludes and show popup buttons accordingly ..  :

        // if(tempIncludes.length>0){
        //  $s.isSiteInTempIncludes = checkIfSiteInTempIncludes(url2);
        //console.log('isSiteInTempIncludes ' + $s.isSiteInTempIncludes);

      }
      update();
      $s.$apply();
    });
  }

  // TO DO - need to check if site in tempExcludes or tempIncludes and show popup buttons accordingly ..  :

  /*function checkIfSiteInTempIncludes(url) {
    let incPattern = getExclPattern(url);
    $s.domain = incPattern.replaceAll('*', '').replace('|', '');
    if ($s.domain.indexOf(':') > 0) {
      $s.domain = $s.domain.split(':').shift();
    }
    console.log($s.domain + ' is the domain');
    console.log(tempIncludes + '  pattern  ' + incPattern);
    for (let i = 0; i < tempIncludes.length; i++) {
      if (tempIncludes[i] === incPattern) {
        return true;
      }
    }
  }

  function checkIfSiteInTempExcludes(url) {
    let excPattern = getExclPattern(url);
    $s.domain = excPattern.replaceAll('*', '').replace('|', '');
    if ($s.domain.indexOf(':') > 0) {
      $s.domain = $s.domain.split(':').shift();
    }
    console.log($s.domain + ' is the domain');

    console.log(tempExcludes + ' pattern ' + excPattern);

    for (let j = 0; j < tempExcludes.length; j++) {
      if (tempExcludes[j] === excPattern) {
        return true;
      }
    }
  }
*/
  $s.savePage = function() {

    chrome.runtime.sendMessage({
        type: "savetoWM",
        subtype: "fromPopup",
        url: currentUrl,
        tabid: tabid
      },
      function(response) {
        log('returned to popup script' + response.message);
        window.close();
      });

  }

  $s.showstats = function() {
    $s.showstat = !$s.showstat;

  }

  var getPattern = function() {
    let pattern = '|*' + $s.domain + '*';
    return pattern;
  }

  $s.addSitetotempExclude = function() {

    sendExcludeMessage('AddtoTempExcludesList');
  }


  $s.addSitetoExclude = function() {
    sendExcludeMessage('AddtoExcludesList');
    // AddtoExcludesList AddtoTempExcludesList
  };

  function sendExcludeMessage(category) {
    chrome.runtime.sendMessage({
        type: "excludethisSite",
        subtype: "fromPopup",
        url: currentUrl,
        tabid: tabid,
        category: category
      },
      function(response) {
        log('returned to popup script ' + response.message);
        window.close();
      });
  }

  String.prototype.replaceAll = function(searchStr, replaceStr) {
    var str = this;

    // escape regexp special characters in search string
    searchStr = searchStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

    return str.replace(new RegExp(searchStr, 'gi'), replaceStr);
  };

  // TODO : Move the below to Background script similar to AddtoExcludes
  $s.removeSitefromexcludeTemp = function() {
    var tempInc = [];
    storage.get({
      tempIncludes: []
    }, function(obj) {
      log('Temp includes before..' + obj.tempIncludes);
      tempInc = obj.tempIncludes;
      tempInc.push(getPattern());
      log('Temp includes before..' + obj.tempIncludes);
      storage.set({
        tempIncludes: tempInc
      });
      $s.removeSitefromexclude();
    });

  }

  // TODO : Move the below to Background script similar to AddtoExcludes

  $s.removeSitefromexclude = function() {
    $s.issiteexcluded = false;
    let incUrl = getPattern();
    //console.log('Remove from exclude url is ' + incUrl);
    chrome.runtime.sendMessage({
      type: "getredirects"
    }, function(response) {
      for (var i = 0; i < response.redirects.length; i++) {
        $s.redirectslist.push(response.redirects[i]);
      }
      log('exclude pattern before removing site from exclude..' + $s.redirectslist[0].excludePattern);
      $s.redirectslist[0].excludePattern = $s.redirectslist[0].excludePattern.replaceAll(incUrl, '');
      log('exclude pattern after removing site from exclude..' + $s.redirectslist[0].excludePattern);

      chrome.runtime.sendMessage({
        type: "saveredirects",
        redirects: $s.redirectslist
      }, function(response) {
        log('Saved ' + $s.redirectslist.length + ' redirects at ' + new Date() +
          '. Message from background page:' +
          response.message);
        var wmurl = 'https://web.archive.org/web/2/' + currentUrl;
        //chrome.tabs.reload({bypassCache: true});
        //using updare instead of just a reload as it didn't seem to work in android firefox - either works in desktop firefox
        chrome.tabs.update(tabid, {
          active: true,
          url: wmurl
        }); //.then(onUpdated, onupError);
        window.close();
      });
    });
  }

  // Getting alltabs each time and using it for openUrl seems to cause flickering effect
  // when we click popup. Moving it back inside OpenUrl function so allTabs can be
  // as and when needed

  var openUrl = function(url) {
    //switch to open one if we have it to minimize conflicts
    chrome.tabs.query({
      currentWindow: true
    }, function(tabs) {
      //FIREFOXBUG: Firefox chokes on url:url filter if the url is a moz-extension:// url
      //so we don't use that, doing it the more manual way instead.
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].url == url) {
          chrome.tabs.update(tabs[i].id, {
            active: true,
            url: url // to refresh the settings page to pick if something's changed in excludes
            // url:url is not required for help.html but reload doesn't harm.. :)
          }, function(tab) {
            close();
          });
          return;
        }
      };

      chrome.tabs.create({
        url: url
      });
      window.close();
    });
  };


  $s.openHelp = function() {
    var url = chrome.extension.getURL('help.html');
    openUrl(url);

  };
  /*
    storage.get({
      disabled: false
    }, function(obj) {
      $s.disabled = obj.disabled;
      $s.$apply();
    });*/

  $s.toggleDisabled = function() {

    storage.set({
      disabled: !$s.disabled
    });
    $s.disabled = !$s.disabled;
    let data;
    if ($s.disabled == true) {
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

  $s.settingspagehide = false;
  $s.openWayBackEverywhereSettings = function() {
    var url = chrome.extension.getURL('settings.html');
    openUrl(url);


  };
}]);
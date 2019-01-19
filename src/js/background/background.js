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

//This is the  background script. It is responsible for actually redirecting requests,
//as well as   monitoring changes  in the redirects and the disabled status and reacting to them.
function subscribeListeners() {
  chrome.runtime.onInstalled.addListener(onInstalledfn);
  chrome.runtime.onStartup.addListener(handleStartup);
  chrome.storage.onChanged.addListener(monitorChanges);
  chrome.tabs.onUpdated.addListener(tabsUpdatedListner);
  chrome.runtime.onMessage.addListener(MessageHandler);
  chrome.tabs.onActivated.addListener(tabOnActivatedListener);
  chrome.webRequest.onBeforeSendHeaders.addListener(
    headerHandler,
    {
      urls: ["https://web.archive.org/save/*"]
    },
    ["requestHeaders", "blocking"]
  );
}
subscribeListeners();

var STORAGE = chrome.storage.local;

var justUpdatedReader = {};
var commonExtensions = [];
//var excludesList = [];
function log(msg) {
  if (log.enabled) {
    console.log("WaybackEverywhere: " + msg + " at " + new Date());
  }
}
var appDisabled = false;
var tempExcludes = [];
var tempIncludes = [];
var isLoadAllLinksEnabled = false;

/*
-- This is probably not needed as temps are cleared on app-restart
 -- we can listen for changes in stored values of these 2 arrays and store to variables to be sent to popup

STORAGE.get({
    tempExcludes: [],tempIncludes: []
    },function(response){
      tempExcludes = response.tempExcludes; //.join("").replace("|","").replace("*","").split("*|*");
      log("tempExcludes to be sent to popup.js will be .." + tempExcludes);
      tempIncludes = response.tempIncludes; //.join("").replace("|","").replace("*","").split("*|*");
      log("tempIncludes to be sent to popup.js will be .." + tempIncludes);
    });  */

// headerHandler - Make this as browser's UserAgent for "Save" requests - "WaybackEverywhere"
// Wayback Machine Team requested for an unique useragent so that they can audit "save page" requests
// that are sent from this extension/addon - https://github.com/gkrishnaks/WaybackEverywhere-Firefox/issues/4

function headerHandler(details) {
  let headers = details.requestHeaders;
  let blockingResponse = {};
  for (let i = 0, l = headers.length; i < l; ++i) {
    if (headers[i].name.toLowerCase() === "user-agent") {
      headers[i].value =
        "Save Page Request from WaybackEverywhere Browser Extension";
    }
    if (headers[i].name.toLowerCase() === "cookie") {
      headers[i].value = "";
    }
  }
  blockingResponse.requestHeaders = headers;
  log(JSON.stringify(blockingResponse));
  return blockingResponse;
}

function tabsUpdatedListner(tabId, changeInfo, tab) {
  //Issue #1 fix https://github.com/gkrishnaks/WaybackEverywhere-Firefox/issues/1
  if (
    tab.url.indexOf("about:add") < 0 &&
    tab.url.indexOf("about:conf") < 0 &&
    tab.url.indexOf("about:pref") < 0 &&
    tab.url.indexOf("file://") < 0 &&
    tab.url.indexOf("ftp:/") < 0 &&
    tab.url.indexOf("about:debug") < 0 &&
    tab.url.indexOf("about:log") < 0 &&
    tab.url.indexOf("about:fir") < 0 &&
    tab.url.indexOf("about:down") < 0 &&
    tab.url.indexOf("about:mem") < 0
  ) {
    chrome.pageAction.show(tabId);
  } else {
    chrome.pageAction.hide(tabId);
  }

  if (
    tab.url.indexOf("web.archive.org/web/") > -1 &&
    changeInfo.isArticle &&
    isReaderModeEnabled
  ) {
    // without this check, user will not be able to exit reader mode
    //as it will keep toggling back to Reader mode whem user tries to exit, since page loads again resulting in onUpdated
    if (
      justUpdatedReader[tabId] === undefined ||
      justUpdatedReader[tabId] !== tab.url
    ) {
      log("Toggling reader mode in tab " + tabId + " url: " + tab.url);
      chrome.tabs.toggleReaderMode(tabId);
      justUpdatedReader[tabId] = tab.url;
    } else {
      log(
        "Did not toggle to Readermode. This case is possible when user tries to manually exit reader mode - we need to let the user do that. Otherwise, firefox will keep toggling back to readermode"
      );
    }
  }
}

function handleRemoved(tabId, removeInfo) {
  // in android, until Mozilla enables reader mode api for android firefox, this is not needed.
  // but hasOwnProperty will return false always if object does not have any property
  // so we can leave it as such below
  if (justUpdatedReader.hasOwnProperty(tabId)) {
    log(
      "cleared the value from justUpdatedReader list of URLs upon closing tab " +
        tabId +
        " -> " +
        justUpdatedReader[tabId]
    );
    delete justUpdatedReader[tabId];
  }
}

/*
chrome.pageAction.onClicked.addListener(function(tab) {

  chrome.pageAction.setPopup({
    tabId: tab.id,
    popup: "popup.html"
  });
});*/

function tabOnActivatedListener(tab) {
  let currentUrl;
  // As per documentation, URL may not be available this 'tab' object, so we use tabs.query to find current url in activated tab..
  //Issue #1 fix https://github.com/gkrishnaks/WaybackEverywhere-Firefox/issues/1
  chrome.tabs.query(
    {
      active: true,
      currentWindow: true
    },
    function(tabs) {
      currentUrl = tabs[0].url;
      log("switched to tab " + tab.tabId + " which has url as " + currentUrl);
      if (
        currentUrl.indexOf("about:add") < 0 &&
        currentUrl.indexOf("about:conf") < 0 &&
        currentUrl.indexOf("about:pref") < 0 &&
        currentUrl.indexOf("file://") < 0 &&
        currentUrl.indexOf("ftp:/") < 0 &&
        currentUrl.indexOf("about:debug") < 0 &&
        currentUrl.indexOf("about:log") < 0 &&
        currentUrl.indexOf("about:fir") < 0 &&
        currentUrl.indexOf("about:down") < 0 &&
        currentUrl.indexOf("about:mem") < 0
      ) {
        chrome.pageAction.show(tab.tabId);
        // Until issue #2 is resolved, we use pageaction instrad of browseraction Popup
        // https://github.com/gkrishnaks/WaybackEverywhere-Firefox/issues/2
      } else {
        chrome.pageAction.hide(tab.tabId);
      }
    }
  );
}

log.enabled = false;

function loadInitialdata(type) {
  let STORAGE = chrome.storage.local;

  let initialsettings;
  let jsonUrl = "settings/setting.json";
  let absUrl = chrome.extension.getURL(jsonUrl);
  let readworker = new Worker(
    chrome.extension.getURL("js/background/readData.js")
  );
  readworker.postMessage([absUrl, "json", type]);
  readworker.onmessage = function(e) {
    initialsettings = e.data.workerResult.redirects;
    var isReset = e.data.type;
    log(JSON.stringify(initialsettings));
    log(JSON.stringify(e.data.workerResult.filters));
    commonExtensions = e.data.workerResult.commonExtensions;
    readworker.terminate();
    STORAGE.set(
      {
        redirects: initialsettings,
        filters: e.data.workerResult.filters,
        commonExtensions: commonExtensions
      },
      function() {
        if (isReset == "doFullReset") {
          log("full reset completed, refrreshing tab to show changes");
          chrome.tabs.reload({
            bypassCache: true
          });
        }
      }
    );
  };
}

var addSitetoExclude = function(request, sender, sendResponse) {
  let redirectslist = [];
  log("addSitetoExclude request is " + JSON.stringify(request));
  chrome.storage.local.get(
    {
      redirects: []
    },
    function(response) {
      for (let i = 0; i < response.redirects.length; i++) {
        redirectslist.push(response.redirects[i]);
      }
      let url1 = "";

      let tabid = "";
      let activetab = false;

      if (request.subtype == "fromPopup") {
        tabid = request.tabid;
        url1 = request.url;
        activetab = true;
      } else {
        tabid = sender.tab.id;
        url1 = sender.tab.url;
      }

      log("tabid is.." + tabid);
      let obj = UrlHelper.getHostfromUrl(url1);
      log(
        obj.hostname +
          " and outputurl " +
          obj.url +
          " received from parseUrl.js for input Url " +
          url1
      );

      //check if already exists in ExcludePattern
      let array = redirectslist[0].excludePattern.split("*|*");
      let lastIndex = array.length - 1;
      array[lastIndex] = array[lastIndex].replace("*", "");

      let alreadyExistsinExcludes = false;
      if (array.indexOf(obj.hostname) > -1) {
        alreadyExistsinExcludes = true;
      }

      // Fix for https://github.com/gkrishnaks/WaybackEverywhere-Firefox/issues/13
      // t.co seems to be the only hostname that causes problems with other sites that has "somenamet.com" in url where "t.co" gets a match against t.co

      if (
        !alreadyExistsinExcludes &&
        obj.hostname.length > 0 &&
        "t.co" != obj.hostname &&
        "web.archive.org" != obj.hostname
      ) {
        log(
          "need to exclude this site" +
            obj.hostname +
            "and previous exclude pattern is " +
            redirectslist[0].excludePattern
        );
        redirectslist[0].excludePattern =
          redirectslist[0].excludePattern + "|*" + obj.hostname + "*";
        log("Now the new redirects is" + JSON.stringify(redirectslist));

        chrome.storage.local.set(
          {
            redirects: redirectslist
          },
          function(a) {
            log("Finished saving redirects to storage from url");
            log("Need to reload page with excluded url.. " + obj.url);
            tabsUpdates(obj.url, activetab, tabid);
          }
        );
      } else {
        log(
          "domainname already exists in excludes list, just loading live page"
        );
        tabsUpdates(obj.url, activetab, tabid);
      }
      // Check if it's a temporary exclude request and put in temp exclude list too
      if (request.category == "AddtoTempExcludesList") {
        checkTempExcludes(obj.hostname, tempExcludes);
      } else {
        //request.category is 'AddtoExcludesList'
        // remove this domain from tempIncludes if it exists as wayback machine cannot archive these sites
        let index = tempIncludes.indexOf("|*" + obj.hostname + "*");
        if (index > -1 && request.subtype !== "fromPopup") {
          tempIncludes.splice(index, 1);
          STORAGE.set({ tempIncludes: tempIncludes });
        }
      }
      sendResponse({
        message: "site  excluded"
      });
    }
  );
};

function tabsUpdates(url, activetab, tabid) {
  chrome.tabs.update(tabid, {
    active: activetab,
    url: url
  });
}

function checkTempExcludes(domain, tempExcludes) {
  // Check and add TempExcludes if Category is AddtoTempExcludesList
  log("Temp excludes before.." + tempExcludes);
  let temp = [];
  let tempExc = tempExcludes;
  if (tempExc !== null && tempExc !== undefined) {
    temp = tempExcludes.map(function(item, index) {
      item = item.replaceAll("*", "");
      item = item.replaceAll("|", "");
      return item;
    });
    if (temp.indexOf(domain) > -1) {
      log(
        domain +
          " already exists in tempexcludes, just calling addsitetoexclude without saving"
      );
      return;
    }
    tempExc.push("|*" + domain + "*");
    log(
      domain +
        " does not exist in tempexcludes, saving to storage tempExcludes" +
        tempExc
    );

    STORAGE.set({
      tempExcludes: tempExc
    });
  }
}

//Redirects partitioned by request type, so we have to run through
//the minimum number of redirects for each request.
var partitionedRedirects = {};

//Cache of urls that have just been redirected to. They will not be redirected again, to
//stop recursive redirects, and endless redirect chains.
//Key is url, value is timestamp of redirect.
var ignoreNextRequest = {};

//url => { timestamp:ms, count:1...n};
var justRedirected = {};
var redirectThreshold = 3;

var counts = {
  archivedPageLoadsCount: 0,
  waybackSavescount: 0
};
var oldcounts = {
  archivedPageLoadsCount: 0,
  waybackSavescount: 0
};

var filters = [];

STORAGE.get({ filters: [] }, function(obj) {
  log("filters from storage is .. " + JSON.stringify(obj.filters));
  filters = obj.filters;
});

function storeCountstoStorage() {
  var countsChanged = false;
  if (oldcounts.archivedPageLoadsCount < counts.archivedPageLoadsCount) {
    oldcounts.archivedPageLoadsCount = counts.archivedPageLoadsCount;
    countsChanged = true;
  }
  if (oldcounts.waybackSavescount < counts.waybackSavescount) {
    oldcounts.waybackSavescount = counts.waybackSavescount;
    countsChanged = true;
  }
  //  log(JSON.stringify(oldcounts));
  log("Setting counts to storage as " + JSON.stringify(oldcounts));
  if (countsChanged) {
    STORAGE.set({
      counts: oldcounts
    });
  }
}

setInterval(storeCountstoStorage, 240000);
// 4 minutes once, write counts to disk
// Not a critical value, does not matter if user closes browser before an interval

setInterval(clearJustSaved, 240000);
// 4 Minutes once, clear JustSaved based on time.

function clearJustSaved() {
  for (let j = 0; j < justSaved.length; j++) {
    if (Date.now() - Number(justSaved[j].split("==WBE==")[1]) >= 240000) {
      justSaved.splice(j, 1);
      // Do not 'break' here, just clear out all old links in justSaved.
    }
  }
  for (let m = 0; m < justreloaded.length; m++) {
    if (Date.now() - Number(justreloaded[m].split("==WBE==")[1]) >= 240000) {
      justreloaded.splice(m, 1);
      // Do not 'break' here, just clear out all old links in justreloaded.
    }
  }
}

function cleanUrlsOnFilters(url) {
  if (filters.length > 0) {
    let index = -1;
    for (let i = 0; i < filters.length; i++) {
      index = url.indexOf(filters[i]);
      if (index > -1) {
        url = url.substring(0, index);
      }
    }
    log("cleaned url is " + url);
  }
  return url;
}
//This is the actual function that gets called for each request and must
//decide whether or not we want to redirect.
function checkRedirects(details) {
  //We only allow GET request to be redirected, don't want to accidentally redirect
  //sensitive POST parameters
  if (details.method != "GET") {
    return {};
  }
  //log(JSON.stringify(details));

  // Once wayback redirect url is loaded, we can just return it except when it's in exclude pattern.
  // this is for issue https://github.com/gkrishnaks/WaybackEverywhere-Firefox/issues/7
  // When already in archived page, Wayback Machine appends web.archive.org/web/2/ to all URLs in the page
  // For example, when viewing archived site, there's a github link - and if github is in Excludes list,
  // Using this, we load live page of github since it's in excludes list.
  // we may add a switch to Settings page to disable this behaviour at a later time if needed.

  // Need to use once we make Excludepattern array of hosts instead of regex
  //if(excludePatterns.indexOf(host))

  //Return save page requests right away
  if (details.url.indexOf("web.archive.org/save") > -1) {
    return {};
  }

  let urlDetails = UrlHelper.getHostfromUrl(details.url);

  if (urlDetails.hostname.length === 0) {
    //UrlHelper.getHostfromUrl will return empty hostname if you try to load archived version of Wayback Machine itself.
    return {};
  }

  if (details.url.indexOf("web.archive.org/web") > -1) {
    // If user tries to click on login, register, or forgot password page, URL might have the words which we can identify and add the site to temporary excludes. Temporary excludes are cleared upon browser restart.
    if (
      urlDetails.url.indexOf("/login") > -1 ||
      urlDetails.url.indexOf("/signin") > -1 ||
      urlDetails.url.indexOf("login.htm") > -1 ||
      urlDetails.url.indexOf("login.php") > -1 ||
      urlDetails.url.indexOf("signin.php") > -1 ||
      urlDetails.url.indexOf("signin.htm") > -1 ||
      urlDetails.url.indexOf("login.asp") > -1 ||
      urlDetails.url.indexOf("login.asp") > -1 ||
      urlDetails.url.indexOf("/join") > -1 ||
      urlDetails.url.indexOf("signup.html") > -1 ||
      urlDetails.url.indexOf("signup.php") > -1 ||
      urlDetails.url.indexOf("signup.asp") > -1 ||
      urlDetails.url.indexOf("/profile/create") > -1 ||
      urlDetails.url.indexOf("/password_reset") > -1 ||
      urlDetails.url.indexOf("/password") > -1 ||
      urlDetails.url.indexOf("/resetpassword") > -1 ||
      urlDetails.url.indexOf("/forgotpassword") > -1 ||
      urlDetails.url.indexOf("/forgot_password") > -1 ||
      urlDetails.url.indexOf("/recoverpassword") > -1 ||
      urlDetails.url.indexOf("/register") > -1 ||
      urlDetails.url.indexOf("register.html") > -1 ||
      urlDetails.url.indexOf("register.asp") > -1 ||
      urlDetails.url.indexOf("register.php") > -1 ||
      urlDetails.url.indexOf("/myaccount") > -1 ||
      urlDetails.url.indexOf("/sign_in") > -1 ||
      urlDetails.url.indexOf("/sign_up") > -1 ||
      urlDetails.url.indexOf("/recover_password") > -1 ||
      urlDetails.url.indexOf("/owa") > -1 ||
      urlDetails.url.indexOf("/Outlook") > -1 ||
      urlDetails.url.indexOf("/outlook") > -1 ||
      urlDetails.url.indexOf("/unsubscribe") > -1 ||
      urlDetails.url.indexOf("/Unsubscribe") > -1 ||
      urlDetails.url.indexOf("/mail") > -1 ||
      urlDetails.url.indexOf("/webmail") > -1 ||
      urlDetails.url.indexOf("/myaccount") > -1 ||
      urlDetails.url.indexOf("/MyAccount") > -1 ||
      urlDetails.url.indexOf("/account") > -1 ||
      urlDetails.url.indexOf("/Account") > -1
    ) {
      log(
        "Loginfound or signup found in URL. Adding site to excludes " +
          urlDetails.hostname +
          " when you tried to load" +
          details.url
      );
      let request = {};
      request.subtype = "fromContent";
      request.category = "excludethisSite";
      let sender = { tab: {} };
      sender.tab = {};
      sender.tab.id = details.tabId;
      sender.tab.url = details.url;
      let sendResponse = function(obj) {};
      addSitetoExclude(request, sender, sendResponse);
      return { cancel: true };
    }
  }
  let ambiguousExcludes = [
    "t.co",
    "g.co",
    "ft.com",
    "cnet.co",
    "vine.co",
    "ted.com",
    "f-st.co"
  ];
  //since "t.co" shoterner matches with sites that have "..t.com" in the url as we use RegExp
  //As t.co is the most common for links clicked from tweets - let's check and return t.co without further processing
  // https://github.com/gkrishnaks/WaybackEverywhere-Firefox/issues/13

  // Made the below a loop now after ft.com matched against sites that have ft.com in the URL..
  // https://github.com/gkrishnaks/WaybackEverywhere-Firefox/issues/22

  for (let i = 0; i < ambiguousExcludes.length; i++) {
    if (urlDetails.hostname == ambiguousExcludes[i]) {
      //We need this if condition to avoid infinite redirects of t.co url into itself.
      //That is, if web.archive.org is prefixed to t.co, just load t.co live url so that this shortener can expand to actual URL
      //If web.archive.org is NOT prefixed, just return as it can continue to expand to live URL which will get redirected to WM later.
      if (
        details.url.replace("#close", "") !=
        urlDetails.url.replace("#close", "")
      ) {
        return { redirectUrl: urlDetails.url };
      }
      return {};
    }
  }

  // https://github.com/gkrishnaks/WaybackEverywhere-Firefox/issues/20
  // Issue happens when a blog redirects to medium globalidentify for some reason
  // .. as we don't have medium in Excludes list - since medium.com articles work fine with Wayback machine
  // .. just programatically add these redirect blogs to excludes list and load live page.
  // ,, do this programatically instead of adding to settings.json, so that user can keep building her Excludes list using this too.
  // Example :
  // https://medium.com/m/global-identity?redirectUrl=https://blog.mapbox.com/hd-vector-maps-open-standard-335a49a45210

  if (
    urlDetails.hostname == "medium.com" &&
    urlDetails.url.indexOf("global-identity?redirect") > -1 &&
    details.url.indexOf("web.archive.org") > -1
  ) {
    let request = {};
    request.subtype = "fromContent";
    request.category = "addtoExclude";
    let sender = { tab: {} };
    sender.tab = {};
    sender.tab.id = details.tabId;
    let index = urlDetails.url.indexOf("redirectUrl=") + 12;
    sender.tab.url =
      "https://web.archive.org/web/2/" +
      decodeURIComponent(urlDetails.url.substring(index));
    let sendResponse = function() {};
    addSitetoExclude(request, sender, sendResponse);
    return { cancel: true };
  }

  if (details.url.indexOf("web.archive.org/web") > -1) {
    // #23 - https://github.com/gkrishnaks/WaybackEverywhere-Firefox/issues/23
    // Load live url when url ends with common file extensions so that user can download a file easily
    // example.com/path/to/dir/file.zip
    if (commonExtensions.length > 0) {
      let isDownloadlink = false;

      let liveURL = urlDetails.url.toLowerCase();
      if (liveURL.endsWith("#close")) {
        liveURL = liveURL.split("#close")[0];
      }
      let index = liveURL.indexOf("?");
      if (index > -1) {
        liveURL = liveURL.substring(0, index);
        //index = -1;
      }
      if (liveURL.endsWith("/")) {
        liveURL = liveURL.substring(0, liveURL.length - 1);
      }
      index = liveURL.indexOf("#");
      if (index > -1) {
        liveURL = liveURL.substring(0, index);
      }

      for (let j = 0; j < commonExtensions.length; j++) {
        if (liveURL.endsWith(commonExtensions[j])) {
          isDownloadlink = true;
          break;
        }
      }
      if (isDownloadlink) {
        return { redirectUrl: urlDetails.url };
      }
    }

    // Issue 12   https://github.com/gkrishnaks/WaybackEverywhere-Firefox/issues/12
    let isJustSaved = false;
    let toSaveurl = urlDetails.url.replace("#close", "");
    for (let k = 0; k < justSaved.length; k++) {
      if (justSaved[k].indexOf(toSaveurl) > -1) {
        isJustSaved = true;
        break;
      }
    }
    if (isJustSaved) {
      log("this page is in justSaved, so loading archived version");
      return {};
    }
    log(
      "Checking if this is in Excludes so that we can return live page url ..  " +
        urlDetails.url
    );
    if (!!excludePatterns) {
      let shouldExclude = excludePatterns.test(urlDetails.hostname);
      excludePatterns.lastIndex = 0;
      if (tempIncludes.length == 0) {
        if (shouldExclude) {
          return { redirectUrl: urlDetails.url };
        }
        return {};
      } else {
        if (tempIncludes.indexOf(urlDetails.hostname) > -1) {
          return {};
        }
        if (shouldExclude) {
          return {
            redirectUrl: urlDetails.url
          };
        }
      }
    }
    return {};
  }

  log(" Checking: " + details.type + ": " + details.url);

  var list = partitionedRedirects[details.type];
  log(list);
  if (!list) {
    log("No list for type: " + details.type);
    return {};
  }

  var timestamp = ignoreNextRequest[details.url];
  if (timestamp) {
    log(
      " Ignoring " +
        details.url +
        ", was just redirected " +
        (new Date().getTime() - timestamp) +
        "ms ago"
    );
    delete ignoreNextRequest[details.url];
    return {};
  }

  for (var i = 0; i < list.length; i++) {
    var r = list[i];
    log("calling getMatch with .." + details.url);
    var result = r.getMatch(details.url);
    /* wmAvailabilityCheck( details.url,function onSuccess(wayback_url,url){
      log('wayback wmAvailabilityCheck passed ->  wayback_url = ' + wayback_url + ' url ' + url)
    },function onfail(){log(' wayback wmAvailabilityCheck failed')}); */
    log("getMatch result is.. result.isMatch -> " + result.isMatch);
    if (result.isMatch) {
      //Check if we're stuck in a loop where we keep redirecting this, in that
      //case ignore!
      log(" checking if we have just redirected to avoid loop");
      var data = justRedirected[details.url];

      var threshold = 3000;
      if (!data || new Date().getTime() - data.timestamp > threshold) {
        //Obsolete after 3 seconds
        justRedirected[details.url] = {
          timestamp: new Date().getTime(),
          count: 1
        };
      } else {
        data.count++;
        justRedirected[details.url] = data;
        if (data.count >= redirectThreshold) {
          log(
            " Ignoring " +
              details.url +
              " because we have redirected it " +
              data.count +
              " times in the last " +
              threshold +
              "ms"
          );
          return {};
        }
      }

      log(
        " Redirecting " +
          details.url +
          " ===> " +
          result.redirectTo +
          ", type: " +
          details.type +
          ", pattern: " +
          r.includePattern
      );

      ignoreNextRequest[result.redirectTo] = new Date().getTime();

      counts.archivedPageLoadsCount += 1;
      log("counts updated to " + counts.archivedPageLoadsCount);
      //Issue 10 - https://github.com/gkrishnaks/WaybackEverywhere-Firefox/issues/10
      // Remove ?utm and others and redirect only direct clean URL to wayback machine
      result.redirectTo = cleanUrlsOnFilters(result.redirectTo);
      log("Redirecting to ......" + result.redirectTo);
      return {
        redirectUrl: result.redirectTo
      };
    }
  }

  return {};
}

//Monitor changes in data, and setup everything again.
//This could probably be optimized to not do everything on every change
//but why bother
function monitorChanges(changes, namespace) {
  if (changes.disabled) {
    if (changes.disabled.newValue == true) {
      console.log("Disabling Wayback Everywhere - removed listener");
      appDisabled = true;
      chrome.webRequest.onBeforeRequest.removeListener(checkRedirects);
    } else {
      console.log("Enabling Wayback Everywhere - setting up listener");
      setUpRedirectListener();
      appDisabled = false;
    }
  }

  if (changes.redirects) {
    let newRedirects = changes.redirects.newValue;
    excludePatterns = getRegex(newRedirects[0].excludePattern);
    if (!appDisabled) {
      log("Excludes list have changed, setting up listener again");
      setUpRedirectListener();
    }
  }

  if (changes.logging) {
    updateLogging();
  }
  if (changes.tempIncludes) {
    log("tempIncludes changed to" + changes.tempIncludes.newValue);
    tempIncludes = changes.tempIncludes.newValue;
  }
  if (changes.tempExcludes) {
    log("tempExcludes changed to" + changes.tempExcludes.newValue);
    tempExcludes = changes.tempExcludes.newValue;
  }

  if (changes.readermode) {
    isReaderModeEnabled = changes.readermode.newValue;
    if (
      isReaderModeEnabled &&
      !chrome.tabs.onRemoved.hasListener(handleRemoved)
    ) {
      chrome.tabs.onRemoved.addListener(handleRemoved);
    }
    if (
      !isReaderModeEnabled &&
      chrome.tabs.onRemoved.hasListener(handleRemoved)
    ) {
      chrome.tabs.onRemoved.removeListener(handleRemoved);
    }
  }

  if (changes.filters) {
    filters = changes.filters.newValue;
  }
  if (changes.isLoadAllLinksEnabled) {
    isLoadAllLinksEnabled = changes.isLoadAllLinksEnabled.newValue;
  }
  if (changes.counts) {
    // This is needed only when user resets stats to 0 from advanceduser page
    if (
      changes.counts.newValue.archivedPageLoadsCount === 0 &&
      changes.counts.newValue.waybackSavescount === 0
    ) {
      counts.archivedPageLoadsCount = 0;
      counts.waybackSavescount = 0;
      oldcounts.archivedPageLoadsCount = 0;
      oldcounts.waybackSavescount = 0;
    }
  }
  if (changes.commonExtensions) {
    commonExtensions = changes.commonExtensions.newValue;
  }
}

function getRegex(excludePatterns) {
  let converted = "^";
  for (let i = 0; i < excludePatterns.length; i++) {
    var ch = excludePatterns.charAt(i);
    if ("()[]{}?.^$\\+".indexOf(ch) != -1) {
      converted += "\\" + ch;
    } else if (ch == "*") {
      converted += "(.*?)";
    } else {
      converted += ch;
    }
  }
  converted += "$";
  return new RegExp(converted, "gi");
}
//TODO: move Remove from Excludes from popup.js to here
// i.e Temporary incldue or Include should go here, currently it's in popup.js

//Creates a filter to pass to the listener so we don't have to run through
//all the redirects for all the request types we don't have any redirects for anyway.
function createFilter(redirects) {
  var types = [];
  for (var i = 0; i < redirects.length; i++) {
    redirects[i].appliesTo.forEach(function(type) {
      if (types.indexOf(type) == -1) {
        types.push(type);
      }
    });
  }

  types.sort();
  return {
    urls: ["https://*/*", "http://*/*"],
    types: types
  };
}

function createPartitionedRedirects(redirects) {
  var partitioned = {};

  for (var i = 0; i < redirects.length; i++) {
    var redirect = new Redirect(redirects[i]);
    redirect.compile();
    for (var j = 0; j < redirect.appliesTo.length; j++) {
      var requestType = redirect.appliesTo[j];
      if (partitioned[requestType]) {
        partitioned[requestType].push(redirect);
      } else {
        partitioned[requestType] = [redirect];
      }
    }
  }

  return partitioned;
}

var excludePatterns;
//Sets up the listener, partitions the redirects, creates the appropriate filters etc.
function setUpRedirectListener() {
  log(" in setUpRedirectListener ..");

  chrome.webRequest.onBeforeRequest.removeListener(checkRedirects); //Unsubscribe first, in case there are changes...

  chrome.storage.local.get(
    {
      redirects: []
    },
    function(obj) {
      var redirects = obj.redirects;
      if (redirects.length == 0) {
        log(" No redirects defined, not setting up listener");
        return;
      }
      excludePatterns = getRegex(redirects[0].excludePattern);
      // (we need to make ExcludePattern an array of hosts, currently it's regex)

      partitionedRedirects = createPartitionedRedirects(redirects);
      var filter = createFilter(redirects);

      chrome.webRequest.onBeforeRequest.addListener(checkRedirects, filter, [
        "blocking"
      ]);
    }
  );
}

var checkifDomaininAnyList = function(domain) {
  let domainStatus = "notInAnyList";
  if (!!domain && domain.length > 0) {
    // let pattern = '|*' + domain + '*';
    let tempExcRegex, tempIncRegex;
    if (!!tempExcludes && tempExcludes.length > 0) {
      tempExcRegex = getRegex(tempExcludes.join("").substring(1));
    }
    if (!!tempIncludes && tempIncludes.length > 0) {
      tempIncRegex = getRegex(tempIncludes.join("").substring(1));
    }
    let excListRegex = excludePatterns;
    if (!!tempExcRegex && tempExcRegex.test(domain)) {
      domainStatus = "domainTempExcluded";
      tempExcRegex.lastIndex = 0;
    } else if (!!tempIncRegex && tempIncRegex.test(domain)) {
      domainStatus = "domainTempIncluded";
      tempIncRegex.lastIndex = 0;
    } else if (!!excListRegex && excListRegex.test(domain)) {
      excListRegex.lastIndex = 0;
      domainStatus = "domainInExcludes";
    }
  }
  return domainStatus;
};

var manifestData = chrome.runtime.getManifest();

var justreloaded = [];

function MessageHandler(request, sender, sendResponse) {
  log(" Received background message: " + JSON.stringify(request));
  if (request.type == "getredirects") {
    log("Getting redirects from storage");
    chrome.storage.local.get(
      {
        redirects: []
      },
      function(obj) {
        log("Got redirects from storage: " + JSON.stringify(obj));
        sendResponse(obj);
      }
    );
  } else if (request.type == "saveredirects") {
    delete request.type;
    chrome.storage.local.set(request, function(a) {
      log("Finished saving redirects to storage from url");
      sendResponse({
        message: "Redirects saved"
      });
    });
  } else if (request.type == "excludethisSite") {
    delete request.type;
    if (appDisabled) {
      return;
    }
    addSitetoExclude(request, sender, sendResponse);
  } else if (request.type == "notify") {
    delete request.type;
    chrome.notifications.create({
      type: "basic",
      title: "Wayback Everywhere",
      message: request.data
    });
  } else if (request.type == "doFullReset") {
    var resettype = request.type;
    delete request.type;
    // FileReader.loadInitialdata(() => {
    //   log('finished full  reset, returning response to setting page');
    //   sendResponse({
    //     message: ' Factory reset. Reloaded  settings from bundled json'
    //   });
    // });
    loadInitialdata(resettype);
  } else if (request.type == "savetoWM") {
    delete request.type;
    if (appDisabled) {
      return;
    }
    savetoWM(request, sender, sendResponse);
  } else if (request.type == "appDetails") {
    let a = JSON.stringify(counts);
    let domainStatus = "notInAnyList";
    if (request.subtype === "fromPopup") {
      domainStatus = checkifDomaininAnyList(request.domain);
    }
    let c = {
      logstatus: log.enabled,
      counts: a,
      appDisabled: appDisabled,
      tempExcludes: tempExcludes,
      tempIncludes: tempIncludes,
      //excludesList: excludesList,
      domainStatus: domainStatus,
      isLoadAllLinksEnabled: isLoadAllLinksEnabled,
      justSaved: justSaved,
      filters: filters,
      appVersion: manifestData.version,
      commonExtensions: commonExtensions
    };
    sendResponse(c);
  } else if (request.type == "openAllLinks") {
    delete request.type;
    log(JSON.stringify(request));
    let urls = request.data;

    for (let i = 0; i < urls.length; i++) {
      if (
        request.selector.length != 0 &&
        urls[i].indexOf(request.selector) > -1
      ) {
        if (urls[i].indexOf("http") != 0) {
          if (urls[i].indexOf("/web") == 0) {
            urls[i] = "https://web.archive.org" + urls[i];
            //console.log(urls[i]);
          }
        }
        log("Opening this url in new tab -> " + urls[i]);

        chrome.tabs.create({
          url: urls[i]
        });
      }
    }
  } else if (request.type == "seeFirstVersion") {
    delete request.type;
    let urlDetails = UrlHelper.getHostfromUrl(request.url);
    let firstVersionURL = "https://web.archive.org/web/0/" + urlDetails.url;
    chrome.tabs.update(
      request.tabid,
      {
        active: true,
        url: firstVersionURL
      },
      function(tab) {
        log(
          "first version url loaded in browser in tab " +
            request.tabid +
            " as " +
            firstVersionURL
        );
        sendResponse("loaded first archived version");
      }
    );
  } else if (request.type == "clearTemps") {
    delete request.type;
    if (request.subtype === "fromPopup") {
      clearTemps(request.domain, request.toClear, sendResponse);
    } else {
      clearAllTemps(sendResponse);
    }
  } else {
    log("Unexpected message: " + JSON.stringify(request));
    return false;
  }

  return true; //This tells the browser to keep sendResponse alive because
  //we're sending the response asynchronously.
}

// Added the below to hande a very rare case where Wayback throws "504" error when Saving page.
// Manually reloading the page was enough to get it work next time.
// This will just reload the page once and stop reloading after that if it continues as
// .. it assigned url to justreloaded variable

// Find out if 504 is thrown by the saved page or by WM itself -
// Need to Comment out the below if WM is actually the one that shows this 504

function reloadPage(tabId, tabUrl) {
  let shouldReload = false;
  for (let i = 0; i < justreloaded.length; i++) {
    if (justreloaded[i].indexOf(tabUrl) < 0) {
      shouldReload = true;
      justreloaded.push(tabUrl + "==WBE==" + Date.now());
      break;
    }
  }
  if (shouldReload) {
    chrome.tabs.reload(
      tabId,
      {
        bypassCache: true
      },
      function() {
        log("Page reloaded");
      }
    );
  }
}
chrome.webRequest.onCompleted.addListener(
  function(details) {
    /*if (details.type == "main_frame") {
    console.log("status code is " + details.statusCode + " in url " + details.url);
  } */
    if (
      details.type == "main_frame" &&
      (details.statusCode == 504 || details.statusCode == 503)
    ) {
      reloadPage(details.tabId, details.url);
    }
  },
  {
    urls: ["*://web.archive.org/*"]
  }
);

//First time setup
//updateIcon();

function updateLogging() {
  chrome.storage.local.get(
    {
      logging: false
    },
    function(obj) {
      log.enabled = obj.logging;
      log("logging for Wayback Everywhere toggled to.." + log.enabled);
    }
  );
}

updateLogging();
var justSaved = ["http://examples.com==WBE==9999999999999"];
function savetoWM(request, sender, sendResponse) {
  let url1 = "";
  let tabid;
  var activetab = true;
  if (request.subtype == "fromContent") {
    url1 = sender.tab.url;
    tabid = sender.tab.id;
    activetab = false;
  }
  if (request.subtype == "fromPopup") {
    tabid = request.tabid;
    url1 = request.url;
  }
  let wmSaveUrl;
  let toSave;
  if (url1.indexOf("web.archive.org") > -1) {
    let obj = UrlHelper.getHostfromUrl(url1);
    toSave = obj.url.replace("#close", "");
  } else {
    toSave = url1.replace("#close", "");
  }
  toSave = cleanUrlsOnFilters(toSave);
  justSaved.push(toSave + "==WBE==" + Date.now());
  wmSaveUrl = "https://web.archive.org/save/" + toSave;
  log("save url to be loaded is -- also cleaned with filters --" + wmSaveUrl);
  chrome.tabs.update(
    tabid,
    {
      active: activetab,
      url: wmSaveUrl
    },
    function(tab) {
      counts.waybackSavescount += 1;

      log("in success function of tab reload");
      sendResponse({
        message: "saving page"
      });
    }
  );
}

function clearTemps(domain, toClear, sendResponse) {
  let index = -1;
  if (toClear === "cleartempIncludes") {
    index = tempIncludes.indexOf("|*" + domain + "*");
    if (index > -1) {
      tempIncludes.splice(index, 1);
    }
    /* TODO
     else if( domain.indexOf(".") !== domain.lastIndexOf(".")){
      log("in subdomain check...");
      let i = domain.indexOf(".");
      index= tempIncludes.indexOf('|*' + domain.substring(i+1) + '*');
      if(index > -1){
      tempIncludes.splice(index,1);
    }
    } */
    STORAGE.set({ tempIncludes: tempIncludes }, function() {
      sendResponse({
        message: "tempRulesCleared"
      });
    });
    //saveToStorage("tempIncludes", tempIncludes, sendResponse);
  } else {
    index = tempExcludes.indexOf("|*" + domain + "*");
    if (index > -1) {
      tempExcludes.splice(index, 1);
    }
    /* TODO
    else if( domain.indexOf(".") !== domain.lastIndexOf(".")){
            log("in subdomain check...");

      let i = domain.indexOf(".");
      index= tempExcludes.indexOf('|*' + domain.substring(i+1) + '*');
      if(index > -1){
      tempExcludes.splice(index,1);
    }
    } */
    STORAGE.set({ tempExcludes: tempExcludes }, function() {
      sendResponse({
        message: "tempRulesCleared"
      });
      // saveToStorage("tempExcludes", tempExcludes, sendResponse);
    });
  }
}
/*
function saveToStorage(key, value, sendResponse){
  STORAGE.set({key:value}, function(){
    sendResponse({
      message: 'tempRulesCleared'
    });
  });
}
*/
chrome.storage.local.get(
  {
    disabled: false
  },
  function(obj) {
    if (!obj.disabled) {
      setUpRedirectListener();
    } else {
      log("Wayback Everywhere is disabled..." + obj.disabled);
    }
  }
);

log(" Wayback Everywhere starting up...");

/*String.prototype.replaceAll = function(searchStr, replaceStr) {
  var str = this;

  // no match exists in string?
  if (str.indexOf(searchStr) === -1) {
    // return string
    return str;
  }

  // replace and remove first match, and do another recursirve search/replace
  return (str.replace(searchStr, replaceStr)).replaceAll(searchStr, replaceStr);
}*/
//set disabled to false upon startup

String.prototype.replaceAll = function(searchStr, replaceStr) {
  var str = this;

  // escape regexp special characters in search string
  searchStr = searchStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");

  return str.replace(new RegExp(searchStr, "gi"), replaceStr);
};
var isReaderModeEnabled = false;

function clearAllTemps(sendResponse) {
  // remove "temporarily exclude sites" on startup
  // Or user opeted to clear Temporary settings from Settings page
  let isChanged = false;
  STORAGE.get(
    {
      tempExcludes: [],
      tempIncludes: [],
      redirects: []
    },
    function(obj) {
      let redirects = obj.redirects;
      var excarray = obj.tempExcludes;
      log("exclude array on startup is..." + excarray);
      if (excarray.length > 0) {
        isChanged = true;
        for (let i = 0; i < excarray.length; i++) {
          let toReplace = excarray[i];
          log(toReplace + " need to be removed from exclude pattern");
          redirects[0].excludePattern = redirects[0].excludePattern.replaceAll(
            toReplace,
            ""
          );

          log(JSON.stringify(redirects));
        }
      }

      var incarray = obj.tempIncludes;
      log("include array on startup to reset..." + incarray);
      if (incarray.length > 0) {
        for (let i = 0; i < incarray.length; i++) {
          let toAdd = incarray[i];
          redirects[0].excludePattern = redirects[0].excludePattern + toAdd;
        }
        isChanged = true;
      }
      if (isChanged) {
        let temp = [];
        STORAGE.set(
          {
            redirects: redirects,
            tempExcludes: temp,
            tempIncludes: temp
          },
          function() {
            sendResponse({
              message: "successfullyclearedTemps"
            });
          }
        );
      }
    }
  );
}

function dedupExcludes(excludePattern) {
  if (excludePattern.length > 0) {
    let excludePatternArray = excludePattern.split("*|*");
    let oldlength = excludePatternArray.length;
    excludePatternArray[0] = excludePatternArray[0].replace("*", "");
    excludePatternArray[excludePatternArray.length - 1] = excludePatternArray[
      excludePatternArray.length - 1
    ].replace("*", "");
    excludePatternArray = Array.from(new Set(excludePatternArray));
    let shouldSave = false;
    if (excludePatternArray.length !== oldlength) {
      shouldSave = true;
    }
    // additional precaution just in case.. :
    if (excludePatternArray.indexOf("web.archive.org") === -1) {
      excludePatternArray.push("web.archive.org");
    }
    let newPattern = "*" + excludePatternArray.join("*|*") + "*";
    let returnObj = { excludePattern: newPattern, shouldSave: shouldSave };
    return returnObj;
  }
}

function handleUpdate(istemporary) {
  let updateWorker = new Worker(chrome.extension.getURL("js/readData.js"));
  let STORAGE = chrome.storage.local;
  let type = "update";
  let updateJson = "settings/updates.json";
  let absUrl = chrome.extension.getURL(updateJson);
  updateWorker.postMessage([absUrl, "json", type]);
  updateWorker.onmessage = function(e) {
    let changeInAddList = e.data.workerResult.changeInAddList;
    let changeInRemoveList = e.data.workerResult.changeInRemoveList;
    let addToDefaultExcludes = e.data.workerResult.addToDefaultExcludes;
    let removeFromDefaultExcludes =
      e.data.workerResult.removeFromDefaultExcludes;
    let showUpdatehtml = e.data.workerResult.showUpdatehtml;
    let changeInAddtoFiltersList = e.data.workerResult.changeInAddtoFiltersList;
    let changeInRemovefromFiltersList =
      e.data.workerResult.changeInRemovefromFiltersList;
    let addtoFiltersList = e.data.workerResult.addtoFiltersList;
    let removefromFiltersList = e.data.workerResult.removefromFiltersList;
    let changeinAddtoCommonFileExtensions =
      e.data.workerResult.changeinAddtoCommonFileExtensions;
    let addtoCommonFileExtensions =
      e.data.workerResult.addtoCommonFileExtensions;
    let changeinRemovefromCommonFileExtensions =
      e.data.workerResult.changeinRemovefromCommonFileExtensions;
    let removefromCommonFileExtensions =
      e.data.workerResult.removefromCommonFileExtensions;

    updateWorker.terminate();
    // Add or remove from Excludes
    STORAGE.get(
      {
        redirects: [],
        filters: [],
        commonExtensions: []
      },
      function(response) {
        console.log("WaybackEverywhere : handleUpdate-  updating settings");
        let redirects = response.redirects;
        let filterlist = response.filters;
        let currentCommonExtArray = response.commonExtensions;

        // Determine changes first..
        // check if we need to add to Excludes list.
        if (
          changeInAddList &&
          addToDefaultExcludes !== undefined &&
          addToDefaultExcludes.length > 0
        ) {
          //if(redirects[0].excludePattern.indexOf(addToDefaultExcludes) === -1 ){
          redirects[0].excludePattern =
            redirects[0].excludePattern + addToDefaultExcludes;
          log("the new excludes list is..." + redirects[0].excludePattern);
        }

        // check if we need to remove from Excludes list.
        if (
          changeInRemoveList &&
          removeFromDefaultExcludes !== undefined &&
          removeFromDefaultExcludes.length > 0
        ) {
          for (let i = 0; i < removeFromDefaultExcludes.length; i++) {
            if (removeFromDefaultExcludes[i].indexOf("web.archive.org") > -1) {
              continue;
            }
            let pattern = "|*" + removeFromDefaultExcludes[i] + "*";
            //log("removing this from excl  udest list" + pattern);
            redirects[0].excludePattern = redirects[0].excludePattern.replaceAll(
              pattern,
              ""
            );
          }
          log("the new excludes list is. ." + redirects[0].excludePattern);
        }

        // remove duplicates from Exclude Pattern during every addon update.
        // https://gitlab.com/gkrishnaks/WaybackEverywhere-Firefox/issues/59
        let dedupExcludesObj = dedupExcludes(redirects[0].excludePattern);
        if (dedupExcludesObj.shouldSave) {
          changeInAddList = true;
          redirects[0].excludePattern = dedupExcludesObj.excludePattern;
          console.log("WaybackEverywhere: deduplicated excludes list");
        }

        //check if we need to add to Filters list.
        if (
          changeInAddtoFiltersList &&
          addtoFiltersList !== undefined &&
          addtoFiltersList.length > 0
        ) {
          for (let i = 0; i < addtoFiltersList.length; i++) {
            if (filterlist.indexOf(addtoFiltersList[i]) < 0) {
              filterlist.push(addtoFiltersList[i]);
            }
          }
        }

        //check if we need to remove from Filters list.
        if (
          changeInRemovefromFiltersList &&
          removefromFiltersList !== undefined &&
          removefromFiltersList.length > 0
        ) {
          let index = -1;
          for (let i = 0; i < removefromFiltersList.length; i++) {
            index = filterlist.indexOf(removefromFiltersList[i]);
            if (index > -1) {
              filterlist.splice(index, 1);
            }
          }
        }

        // Check if we need to add to Common File extensions to exclude.
        if (
          changeinAddtoCommonFileExtensions &&
          addtoCommonFileExtensions !== undefined &&
          addtoCommonFileExtensions.length > 0
        ) {
          for (var ext of addtoCommonFileExtensions) {
            if (currentCommonExtArray.indexOf(ext) === -1) {
              currentCommonExtArray.push(ext);
            }
          }
        }

        // Check if we need to add to Common File extensions to exclude.
        if (
          changeinRemovefromCommonFileExtensions &&
          removefromCommonFileExtensions !== undefined &&
          removefromCommonFileExtensions.length > 0
        ) {
          for (var ext1 of removefromCommonFileExtensions) {
            let index = currentCommonExtArray.indexOf(ext1);
            if (index > -1) {
              currentCommonExtArray.splice(index, 1);
            }
          }
        }

        // Save all the changes
        // Save changes in Common Extensions
        if (
          changeinAddtoCommonFileExtensions ||
          changeinRemovefromCommonFileExtensions
        ) {
          commonExtensions = currentCommonExtArray;
          STORAGE.set(
            {
              commonExtensions: currentCommonExtArray
            },
            function() {
              log(
                "CommonExtensions saved as .. " +
                  JSON.stringify(currentCommonExtArray)
              );
            }
          );
        }

        // Save changes in Filters list
        if (changeInAddtoFiltersList || changeInRemovefromFiltersList) {
          filters = filterlist;
          STORAGE.set(
            {
              filters: filterlist
            },
            function() {
              log("filters saved as .. " + JSON.stringify(filterlist));
            }
          );
        }

        // Save changes in Exclude pattern
        if (changeInAddList || changeInRemoveList) {
          STORAGE.set({
            redirects: redirects
          });
        }

        //show update html if needed but not durin web-ext runs
        if (showUpdatehtml && istemporary !== true) {
          openUpdatehtml();
        }
      }
    );
  };
}

function openUpdatehtml() {
  let url = chrome.extension.getURL("update.html");
  log("Wayback Everywhere addon installed or updated..");
  chrome.tabs.create({
    url: url
  });
}

// Fix for https://github.com/gkrishnaks/WaybackEverywhere-Firefox/issues/11
// This will run once when background script runs so that counts are set correctly when addon is disabled and then enabled from about:addons
STORAGE.get(
  {
    counts: counts
  },
  function(response) {
    counts.archivedPageLoadsCount = response.counts.archivedPageLoadsCount;
    counts.waybackSavescount = response.counts.waybackSavescount;
    oldcounts = JSON.parse(JSON.stringify(counts));
  }
);

STORAGE.get(
  {
    commonExtensions: []
  },
  function(response) {
    commonExtensions = response.commonExtensions;
  }
);

function handleStartup() {
  log(
    "Handle startup - fetch counts, fetch readermode setting, fetch appdisabled setting, clear out any temp excludes or temp includes"
  );
  //For issue 11 fix, we moved this to background script - so that counts can get set to global variables correctly..
  // .. when addon is disabled and enabled from about:addons . Commenting the below
  /*
   STORAGE.get({
    counts: counts
  }, function(response) {
    counts.archivedPageLoadsCount = response.counts.archivedPageLoadsCount;
    counts.waybackSavescount = response.counts.waybackSavescount;
    oldcounts = JSON.parse(JSON.stringify(counts));
  });  */

  STORAGE.get(
    {
      readermode: false
    },
    function(obj) {
      isReaderModeEnabled = obj.readermode;
      if (isReaderModeEnabled) {
        chrome.tabs.onRemoved.addListener(handleRemoved);
      }
    }
  );

  STORAGE.get(
    {
      isLoadAllLinksEnabled: false
    },
    function(obj) {
      isLoadAllLinksEnabled = obj.isLoadAllLinksEnabled;
    }
  );

  STORAGE.get(
    {
      operationMode: false
    },
    function(obj) {
      STORAGE.set({
        disabled: obj.operationMode
      });
      appDisabled = obj.operationMode;
      //operationMode -> false is default behaviour of turning on WBE when browser loads.
      // true - if user wishes to start browser with WBE disabled
    }
  );
  /*
    // Enable on startup - Popup button is "Temporarily disable.."
    // as user can do full disable from addon/extension page anyway
    STORAGE.set({
      disabled: false
    }); */
  // Disable logging on startup
  STORAGE.set({
    logging: false
  });
  let sendResponse = function(obj) {};
  clearAllTemps(sendResponse);
}

function onInstalledfn(details) {
  //console.log(JSON.stringify(details));
  if (details.reason == "install") {
    loadInitialdata("init");
    console.log(" Wayback Everywhere addon installed");

    let counts = {
      archivedPageLoadsCount: 0,
      waybackSavescount: 0
    };
    let STORAGE = chrome.storage.local;
    STORAGE.set({
      counts: counts
    });

    let tempExcludes = [];
    STORAGE.set({
      tempExcludes: tempExcludes
    });
    STORAGE.set({
      tempIncludes: tempExcludes
    });
  }

  if (details.reason == "update") {
    handleUpdate(details.temporary); // To add or remove from "default excludes - see settings/updates.json
    console.log(" Wayback Everywhere addon was updated");
  }

  if (details.reason == "install" && details.temporary != true) {
    let url = chrome.extension.getURL("help.html");
    log("Wayback Everywhere addon installed or updated..");
    chrome.tabs.create({
      url: url
    });
  }
}

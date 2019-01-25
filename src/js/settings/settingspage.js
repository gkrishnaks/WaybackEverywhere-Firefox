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

// This is the main controller of the page. It is responsible for showing messages,
// modal windows and loading and saving the list of redirects, that all of the
// controllers work with.

var App = window.App || {};
App.settingsApp = window.App.settingsApp || {};
App.settingsApp.newExcludesite = "";
App.settingsApp.newIncludeSite = "";

App.settingsApp.operationmode = false; // we consider false as Default ON, true as disable on browser startup..

App.settingsApp.storage = chrome.storage.local;
//TODO: Change to sync when Firefox supports it...

App.settingsApp.getInitialValues = () => {
  App.settingsApp.storage.get(
    {
      readermode: false,
      operationMode: false,
      logging: false
    },
    function(obj) {
      App.settingsApp.getRules();
      App.settingsApp.logging = obj.logging;
      document.getElementById("toggleLogging").checked = obj.logging;
      App.settingsApp.readermode = obj.readermode;
      var useragent = navigator.userAgent;
      App.settingsApp.operationmode = obj.operationMode;
      document.getElementById("toggleOperationMode").checked =
        obj.operationMode;

      //console.log(useragent);
      App.settingsApp.isMobilefirefox = false;
      if (useragent.match(/Android/i)) {
        App.settingsApp.isMobilefirefox = true;
      }

      if (!App.settingsApp.isMobilefirefox) {
        document.getElementById("ReaderModeArea").style.display = "";
      }
      document.getElementById("togglereadermode").checked = obj.readermode;
    }
  );
};

App.settingsApp.addtoExclude = function(url) {
  App.settingsApp.message = null;
  var url1 = url.replace(/[\|&;\$%@"<>\(\)\+\^\'\*,]/g, "");
  var exclPatrn = App.settingsApp.getPattern(url1);
  var msg;
  App.settingsApp.newExcludesite = "";
  if (url1.length < 4) {
    msg =
      "You entered a URL -> " +
      url1 +
      " which is too small and will affect addon functionality. Please try again. Reach out to Developer if this is causing an issue";
    App.settingsApp.showMessage(msg, false, 10, 1);

    return;
  }

  if (UrlHelper.hasRepeatedLetters(url1)) {
    App.settingsApp.showMessage(
      "Invalid URL, try again or reach out to developer if this is causing an issue",
      false
    );
    return;
  }
  if (exclPatrn.domain.indexOf("|") > -1) {
    msg =
      "You entered a URL -> " +
      exclPatrn.domain +
      " with | symbol. This is not allowed, please try again";
    App.settingsApp.showMessage(msg, false, 10, 1);
    App.settingsApp.newExcludesite = "";

    return;
  }
  //excludePattern in App.settingsApp.redir looks like *web.archive.org*|*fsf.org*
  let str = App.settingsApp.redirects[0].excludePattern;
  let array = str.split("*");
  if (array.indexOf(exclPatrn.domain) > -1) {
    msg = "This site " + exclPatrn.domain + " already exists in Excludes list";
    App.settingsApp.newExcludesite = "";

    App.settingsApp.showMessage(msg, false, 10, 1);
    return;
  } else {
    App.settingsApp.redirects[0].excludePattern =
      App.settingsApp.redirects[0].excludePattern + exclPatrn.Pattern;
    msg = "This site " + exclPatrn.domain + " is added to Excludes list";
    App.settingsApp.newExcludesite = "";

    var arr = App.settingsApp.redirects.map(App.settingsApp.normalize);
    App.settingsApp.saveRedirectsMsgsender(arr);
    App.settingsApp.getRules();
    App.settingsApp.showMessage(msg, "success", 10, 1);
  }
};

App.settingsApp.tempExcludes = "";
App.settingsApp.tempIncludes = "";
App.settingsApp.justSaved = "";
App.settingsApp.filters = [];
App.settingsApp.appVersion = "1.0.0";
App.settingsApp.commonExtensions = [];
App.settingsApp.getTemps = () => {
  chrome.runtime.sendMessage(
    {
      type: "appDetails",
      subtype: "fromSettings",
      domain: "settings.html"
    },
    function(response) {
      /* log.enabled = response.logstatus;
        let counts = JSON.parse(response.counts);
        // {"archivedPageLoadsCount":0,"waybackSavescount":0}
        App.settingsApp.savecount = counts.waybackSavescount;
        App.settingsApp.loadcount = counts.archivedPageLoadsCount;
        App.settingsApp.disabled = response.appDisabled; */
      App.settingsApp.appVersion = response.appVersion;
      let k = document.getElementById("appVersion");
      if (!!k) {
        k.textContent = "Version " + App.settingsApp.appVersion;
      }
      App.settingsApp.tempExcludes = response.tempExcludes
        .join("")
        .replace(/\*/g, "")
        .substring(1)
        .replace(/\|/g, ", ");
      let el = document.getElementById("tempExcludes");

      if (!!App.settingsApp.tempExcludes) {
        el.style.display = "";
        el.lastElementChild.textContent = App.settingsApp.tempExcludes;
      } else {
        el.style.display = "none";
      }
      el = document.getElementById("tempIncludes");
      App.settingsApp.tempIncludes = response.tempIncludes
        .join("")
        .replace(/\*/g, "")
        .substring(1)
        .replace(/\|/g, ", ");
      if (!!App.settingsApp.tempIncludes) {
        el.style.display = "";
        el.lastElementChild.textContent = App.settingsApp.tempIncludes;
      } else {
        el.style.display = "none";
      }

      if (!App.settingsApp.tempExcludes && !App.settingsApp.tempExcludes) {
        document.getElementById("clearTempButton").style.display = "none";
      } else {
        document.getElementById("clearTempButton").style.display = "";
      }
      //App.settingsApp.isLoadAllLinksEnabled = response.isLoadAllLinksEnabled;
      //  console.log('tempExcludes is ' + tempExcludes + ' tempIncludes is ' + tempIncludes);
      if (response.justSaved.length > 0) {
        App.settingsApp.justSaved = response.justSaved.join(", ");
      }
      App.settingsApp.filters = response.filters;
      App.settingsApp.appVersion = response.appVersion;
      App.settingsApp.commonExtensions = response.commonExtensions;
      App.settingsApp.showdebuginfo();
      //App.settingsApp.getRules();;
    }
  );
};

App.settingsApp.clearTemps = function() {
  chrome.runtime.sendMessage(
    {
      type: "clearTemps"
    },
    function(response) {
      if (response.message == "successfullyclearedTemps") {
        App.settingsApp.tempExcludes = "";
        App.settingsApp.tempIncludes = "";
        //App.settingsApp.getRules();;
        App.settingsApp.getRules();
      }
    }
  );
};

App.settingsApp.removefromExclude = function(url) {
  let url1 = url.replace(/[\|&;\$%@"<>\(\)\+\^\'\*,]/g, "");
  App.settingsApp.message = null;
  var inclPattrn = App.settingsApp.getPattern(url1);
  var msg;
  App.settingsApp.newIncludeSite = "";
  if (inclPattrn.domain.indexOf("|") > -1) {
    msg =
      "You entered a URL -> " +
      inclPattrn.domain +
      " with | symbol. This is not allowed, please try again";
    App.settingsApp.showMessage(msg, false, 10, 1);
    App.settingsApp.newIncludeSite = "";
    App.settingsApp.getRules();

    return;
  }
  if (inclPattrn.domain.indexOf("web.archive.org") > -1) {
    msg =
      "You entered a URL -> " +
      inclPattrn.domain +
      " This is not allowed, removing this will affect functionality";
    App.settingsApp.showMessage(msg, false, 10, 1);
    App.settingsApp.newIncludeSite = "";
    App.settingsApp.getRules();

    return;
  }
  let str = App.settingsApp.redirects[0].excludePattern;
  let array = str.split("*");
  // Using >0 because we shouldn't let remove web.archive.org from excludeslist - avoiding endless redirect loop
  if (array.indexOf(inclPattrn.domain) > -1) {
    App.settingsApp.newIncludeSite = "";

    var obj = App.settingsApp.replaceAll(
      App.settingsApp.redirects[0].excludePattern,
      inclPattrn.domain
    );
    if (obj.isremoved) {
      App.settingsApp.redirects[0].excludePattern = obj.string;
      msg =
        "This site " + inclPattrn.domain + " is removed from the Excludes list";
      var arr = App.settingsApp.redirects.map(App.settingsApp.normalize);
      App.settingsApp.saveRedirectsMsgsender(arr);
      App.settingsApp.showMessage(msg, true, 10, 1);
    } else {
      msg =
        "No need to remove.. This site " +
        inclPattrn.domain +
        " is already not available in the Excludes list";
      App.settingsApp.showMessage(msg, "success", 10, 1);
    }
  } else {
    App.settingsApp.newIncludeSite = "";
    msg =
      "No need to remove! This site " +
      inclPattrn.domain +
      " is already not available in the Excludes list";
    App.settingsApp.showMessage(msg, "success", 10, 1);
  }
  App.settingsApp.getRules();
};

App.settingsApp.isLoadAllLinksEnabled = false;

App.settingsApp.storage.get(
  {
    isLoadAllLinksEnabled: false
  },
  function(obj) {
    App.settingsApp.isLoadAllLinksEnabled = obj.isLoadAllLinksEnabled;
    document.getElementById("isLoadAllLinksEnabled").checked =
      obj.isLoadAllLinksEnabled;
    //App.settingsApp.getRules();;
  }
);

App.settingsApp.toggleLoadAllLinksSettings = function() {
  App.settingsApp.storage.set(
    {
      isLoadAllLinksEnabled: !App.settingsApp.isLoadAllLinksEnabled
    },
    function() {
      App.settingsApp.isLoadAllLinksEnabled = !App.settingsApp
        .isLoadAllLinksEnabled;

      if (App.settingsApp.isLoadAllLinksEnabled) {
        document.getElementById("showExampleOpen").style.display = "";
        document.getElementById("showExampleOpenall").style.display = "none";
      }

      //App.settingsApp.getRules();;
    }
  );
};

App.settingsApp.replaceAll = (exclist, domain) => {
  // format *web.archive.org*|*example.org*
  var obj = {
    string: "",
    isremoved: false
  };
  var array = exclist.split("|");
  domain = "*" + domain + "*";

  for (let i = array.length - 1; i >= 0; i--) {
    if (array[i] === domain) {
      array.splice(i, 1);
      obj.isremoved = true;
    }
  }
  obj.string = array.join("|");
  return obj;
};

App.settingsApp.getPattern = url => {
  var url2 = url;
  var obj = {
    domain: "",
    Pattern: ""
  };
  var url3;
  if (url2.indexOf("web.archive.org") >= 0) {
    if (url2.indexOf("web.archive.org/save") > -1) {
      url2 = url2.replace(".org/save/", ".org/web/2/");
      //log('url2 from save to web/2 ..' + url2);
    }
    url2 = url2.split("web.archive.org/").pop();
  }
  if (url2.indexOf("http://") < 0 && url2.indexOf("https://") < 0) {
    url3 = url2;
    //log('url3 set as ' + url3);
    obj.domain = url2.toLowerCase();
  } else {
    var pattern = /:\/\/(.[^/]+)/;
    url3 = url2.match(pattern)[1];
    url3 = url3.split("www.").pop();
    obj.domain = url3.toLowerCase();
    //log('excludethisSite after regexpattern is ' + url3);
  }
  obj.Pattern = "|*" + url3.toLowerCase() + "*";
  return obj;
};

App.settingsApp.openHelp = function() {
  var url = chrome.extension.getURL("help.html");

  //FIREFOXBUG: Firefox chokes on url:url filter if the url is a moz-extension:// url
  //so we don't use that, do it the more manual way instead.
  chrome.tabs.query(
    {
      currentWindow: true
    },
    function(tabs) {
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].url == url) {
          chrome.tabs.update(
            tabs[i].id,
            {
              active: true
            },
            function(tab) {
              //close();
            }
          );
          return;
        }
      }

      chrome.tabs.create({
        url: "help.html"
      });
    }
  );
};

App.settingsApp.normalize = function(r) {
  return new Redirect(r).toObject(); //Cleans out any extra props, and adds default values for missing ones.
};

App.settingsApp.showresetConfirmation = false;

App.settingsApp.saveRedirectsMsgsender = arr => {
  chrome.runtime.sendMessage(
    {
      type: "saveredirects",
      redirects: arr
    },
    function(response) {
      App.settingsApp.redirects = [];
      App.settingsApp.redirects = arr;
      App.settingsApp.ReadableExcludePattern = App.settingsApp.redirects[0].excludePattern
        .replace(/\*/g, "")
        .replace(/\|/g, ", ");
      App.settingsApp.getRules();
      //App.settingsApp.getRules();;
    }
  );
};

// Saves the entire list of redirects to App.settingsApp.storage
App.settingsApp.saveChanges = function() {
  // Clean them up so angular $$hash things and stuff don't get serialized.
  var arr = App.settingsApp.redirects.map(App.settingsApp.normalize);

  //adding web.archive.org to beginning of exclude so that even if user clears it, ,
  // so that user won't end up endless looping
  if (arr[0].excludePattern.indexOf("web.archive.org") < 0) {
    if (arr[0].excludePattern.length == 0) {
      arr[0].excludePattern =
        "*web.archive.org*|*archive.org*|*chrome://*|*about:*|*/chrome/newtab*";
    } else {
      arr[0].excludePattern =
        "*web.archive.org*|*archive.org*|*chrome://*|*about:*|*/chrome/newtab*|" +
        arr[0].excludePattern;
    }
  }

  App.settingsApp.saveRedirectsMsgsender(arr);
};

// Saves the entire list of redirects to App.settingsApp.storage
App.settingsApp.saveChanges2 = function(arr) {
  // Clean them up so angular $$hash things and stuff don't get serialized.

  //adding web.archive.org to beginning of exclude so that even if imported json doesn't have it,
  // so that user won't end up endless looping

  if (arr[0].excludePattern.indexOf("web.archive.org") < 0) {
    arr[0].excludePattern =
      "*web.archive.org*|*archive.org*|*chrome://*|*about:*|" +
      arr[0].excludePattern;
  }
  App.settingsApp.saveRedirectsMsgsender(arr);
};

App.settingsApp.redirects = [];

App.settingsApp.ReadableExcludePattern = "web.archive.org";
//Need to proxy this through the background page,because Firefox gives us dead objects
//nonsense when accessing chrome.Storage directly.
App.settingsApp.getRules = () => {
  chrome.runtime.sendMessage(
    {
      type: "getredirects"
    },
    function(response) {
      if (App.settingsApp.redirects.length == 0) {
        App.settingsApp.redirects.push(
          App.settingsApp.normalize(response.redirects[0])
        );
      }
      document.getElementById("rDescription").textContent =
        App.settingsApp.redirects[0].description;
      App.settingsApp.ReadableExcludePattern = response.redirects[0].excludePattern
        .replace(/\*/g, "")
        .replace(/\|/g, ", ");
      document.querySelector("#showExcludes").textContent =
        App.settingsApp.ReadableExcludePattern;
      App.settingsApp.getTemps();
      App.settingsApp.showdebuginfo();

      //App.settingsApp.getRules();;
    }
  );
};

// Shows a message explaining how many redirects were imported.

App.settingsApp.timestamp = new Date();

App.settingsApp.importRedirects = function() {
  var fileInput = document.getElementById("fileInput");
  fileInput.addEventListener("change", function(e) {
    var file = fileInput.files[0];

    var reader = new FileReader();

    reader.onload = function(e) {
      var data;
      try {
        data = JSON.parse(reader.result);
        console.log("Wayback Everywhere: Imported data" + JSON.stringify(data));
      } catch (e) {
        App.settingsApp.showMessage(
          "Failed to parse JSON data, invalid JSON: " +
            (e.message || "").substr(0, 100)
        );
        return;
      }

      if (!data.redirects) {
        App.settingsApp.showMessage(
          'Invalid JSON, missing "redirects" property '
        );
        return;
      }

      if (
        data.createdBy.indexOf("Wayback Everywhere") < 0 ||
        data.redirects[0].description.indexOf("Wayback Everywhere") < 0
      ) {
        App.settingsApp.showMessage(
          "Invalid JSON, this does not seem to be exported from Wayback Everywhere"
        );
        return;
      }

      var imported = 0,
        existing = 0;

      var i = 0;
      var r = new Redirect(data.redirects[i]);
      r.updateExampleResult();
      if (
        App.settingsApp.redirects.some(function(i) {
          return new Redirect(i).equals(r);
        })
      ) {
        existing++;
      } else {
        var arr = [];
        arr.push(r.toObject());

        imported++;
        App.settingsApp.saveChanges2(arr);
      }

      App.settingsApp.showImportedMessage(imported, existing);

      // add above this
    };

    try {
      reader.readAsText(file, "utf-8");
    } catch (e) {
      App.settingsApp.showMessage("Failed to read import file");
    }
  });
};

// Updates the export link with a data url containing all the redirects.
// We want to have the href updated instead of just generated on click to
// allow people to right click and choose Save As...
App.settingsApp.updateExportLink = function() {
  var d = new Date();
  var localtime = d
    .toTimeString()
    .split("GMT")
    .shift("GMT");
  localtime = localtime.trim();
  var localtimezone = d
    .toTimeString()
    .split("(")
    .pop("GMT")
    .replace(")", "");
  localtimezone = localtimezone.trim();
  var day = d.toDateString();
  day = day
    .substring(4)
    .trim()
    .replace(/ /g, ".");
  App.settingsApp.timestamp = day + "_" + localtime + "_" + localtimezone;

  var redirects = App.settingsApp.redirects.map(function(r) {
    return new Redirect(r).toObject();
  });

  var exportObj = {
    createdBy: "Wayback Everywhere v" + chrome.runtime.getManifest().version,
    createdAt: new Date(),
    redirects: redirects
  };

  var json = JSON.stringify(exportObj, null, 4);

  //Using encodeURIComponent here instead of base64 because base64 always messed up our encoding for some reason...
  App.settingsApp.redirectDownload =
    "data:text/plain;charset=utf-8," + encodeURIComponent(json);
  let elem = document.getElementById("exportSettingBtn");
  if (!!elem) {
    elem.href = App.settingsApp.redirectDownload;
    elem.download = elem.download.replace(
      "{{timestamp}}",
      App.settingsApp.timestamp
    );
  }
};

App.settingsApp.showImportedMessage = (imported, existing) => {
  if (imported == 0 && existing == 0) {
    App.settingsApp.showMessage("No redirects existed in the file.");
  }
  if (imported > 0 && existing == 0) {
    App.settingsApp.showMessage("Successfully imported settings", true);
  }
  if (imported == 0 && existing > 0) {
    App.settingsApp.showMessage(
      "All redirects in the file already existed and were ignored."
    );
  }
  if (imported > 0 && existing > 0) {
    var m =
      "Successfully imported " +
      imported +
      " redirect" +
      (imported > 1 ? "s" : "") +
      ". ";
    if (existing == 1) {
      m += "1 redirect already existed and was ignored.";
    } else {
      m += existing + " redirects already existed and were ignored.";
    }
    App.settingsApp.showMessage(m, true);
  }
};

App.settingsApp.showdebuginfo = () => {
  let el = document.getElementById("logging");
  let el2 = document.getElementById("loggingInAdvancedUserPage");
  if (App.settingsApp.logging || !!el2) {
    if (!!el) {
      el.style.display = "";
    }
    document.getElementById("justsaved").textContent =
      App.settingsApp.justSaved;
    document.getElementById(
      "filtersarea"
    ).textContent = App.settingsApp.filters.join(", ");
    document.getElementById(
      "fileExtarea"
    ).textContent = App.settingsApp.commonExtensions.join(", ");
  } else {
    if (!!el) {
      el.style.display = "none";
    }
  }
};

App.settingsApp.logging = false;

App.settingsApp.toggleLogging = function() {
  App.settingsApp.storage.get(
    {
      logging: false
    },
    function(obj) {
      App.settingsApp.storage.set({
        logging: !obj.logging
      });
      App.settingsApp.logging = !obj.logging;
      App.settingsApp.showdebuginfo();
    }
  );
};

App.settingsApp.togglereadermode = () => {
  App.settingsApp.storage.set({
    readermode: !App.settingsApp.readermode
  });
  App.settingsApp.readermode = !App.settingsApp.readermode;
  App.settingsApp.getRules();
};

App.settingsApp.toggleOperationMode = () => {
  App.settingsApp.storage.set(
    {
      operationMode: !App.settingsApp.operationmode
    },
    function(a) {
      App.settingsApp.operationmode = !App.settingsApp.operationmode;
      App.settingsApp.getRules();
    }
  );
};

App.settingsApp.doFactoryReset = () => {
  chrome.runtime.sendMessage({
    type: "doFullReset",
    subtype: "fromSettings"
  });
};

// Shows a message bar above the list of redirects.
App.settingsApp.showMessage = (message, success, timer, id) => {
  let msgBox = document.getElementById("message-box");
  let incExcmsg = document.getElementById("incExcmsg");
  if (id != null) {
    App.settingsApp.incExcmsg = message;
    incExcmsg.style.display = "";
    incExcmsg.innerText = message;
    incExcmsg.classList = success ? "success" : "error";
  } else {
    App.settingsApp.message = message;
    msgBox.style.display = "";
    msgBox.innerText = message;
    msgBox.classList = success ? "success" : "error";
  }
  if (timer == null) {
    timer = 10;
  }
  //Remove the message in 20 seconds if it hasnt been changed...

  setTimeout(function() {
    if (App.settingsApp.message == message) {
      App.settingsApp.message = null;
      msgBox.style.display = "none";
    }
  }, timer * 1000);
  setTimeout(function() {
    if (App.settingsApp.incExcmsg == message) {
      App.settingsApp.incExcmsg = null;
      incExcmsg.style.display = "none";
    }
  }, timer * 1000);
};

App.settingsApp.showresetConfirmation = false;
App.settingsApp.showresetbutton = true;
App.settingsApp.toggleResetwarn = function() {
  App.settingsApp.showresetConfirmation = !App.settingsApp
    .showresetConfirmation;
  App.settingsApp.showresetbutton = !App.settingsApp.showresetbutton;
  if (App.settingsApp.showresetConfirmation) {
    document.getElementById("showresetConfirmation").style.display = App
      .settingsApp.showresetConfirmation
      ? ""
      : "none";
  }
  App.settingsApp.showresetbutton = !App.settingsApp.showresetbutton;
  document.getElementById("toggleResetwarn").style.display = App.settingsApp
    .showresetbutton
    ? ""
    : "none";
};

App.settingsApp.toggleDisabled = function(redirect) {
  redirect.disabled = !redirect.disabled;
  App.settingsApp.saveChanges();
};

(() => {
  let hidden = {};
  if (typeof document.hidden !== "undefined") {
    // Opera 12.10 and Firefox 18 and later support
    hidden.visibilityChange = "visibilitychange";
  } else if (typeof document.msHidden !== "undefined") {
    hidden.visibilityChange = "msvisibilitychange";
  } else if (typeof document.webkitHidden !== "undefined") {
    hidden.visibilityChange = "webkitvisibilitychange";
  }

  document.addEventListener(
    hidden.visibilityChange,
    App.settingsApp.getInitialValues,
    false
  );
})();

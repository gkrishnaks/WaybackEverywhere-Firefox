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

// This is the main controller of the page. It is responsible for showing messages,
// modal windows and loading and saving the list of redirects, that all of the
// controllers work with.

var $s = window.$s || {};
$s.settingsApp = window.$s.settingsApp || {};
$s.settingsApp.newExcludesite = "";
$s.settingsApp.newIncludeSite = "";

$s.settingsApp.operationmode = false; // we consider false as Default ON, true as disable on browser startup..

$s.settingsApp.storage = chrome.storage.local;
//TODO: Change to sync when Firefox supports it...

$s.settingsApp.getInitialValues = () => {
  $s.settingsApp.storage.get(
    {
      readermode: false,
      operationMode: false,
      logging: false
    },
    function(obj) {
      $s.settingsApp.getRules();
      $s.settingsApp.logging = obj.logging;
      document.getElementById("toggleLogging").checked = obj.logging;
      $s.settingsApp.readermode = obj.readermode;
      var useragent = navigator.userAgent;
      $s.settingsApp.operationmode = obj.operationMode;
      document.getElementById("toggleOperationMode").checked =
        obj.operationMode;

      //console.log(useragent);
      $s.settingsApp.isMobilefirefox = false;
      if (useragent.match(/Android/i)) {
        $s.settingsApp.isMobilefirefox = true;
      }

      if (!$s.settingsApp.isMobilefirefox) {
        document.getElementById("ReaderModeArea").style.display = "";
      }
      document.getElementById("togglereadermode").checked = obj.readermode;
    }
  );
};

$s.settingsApp.addtoExclude = function(url) {
  $s.settingsApp.message = null;
  var url1 = url.replace(/[\|&;\$%@"<>\(\)\+\^\'\*,]/g, "");
  var exclPatrn = $s.settingsApp.getPattern(url1);
  var msg;
  $s.settingsApp.newExcludesite = "";
  if (url1.length < 4) {
    msg =
      "You entered a URL -> " +
      url1 +
      " which is too small and will affect addon functionality. Please try again. Reach out to Developer if this is causing an issue";
    $s.settingsApp.showMessage(msg, false, 10, 1);

    return;
  }

  if (UrlHelper.hasRepeatedLetters(url1)) {
    $s.settingsApp.showMessage(
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
    $s.settingsApp.showMessage(msg, false, 10, 1);
    $s.settingsApp.newExcludesite = "";

    return;
  }
  //excludePattern in $s.settingsApp.redir looks like *web.archive.org*|*fsf.org*
  let str = $s.settingsApp.redirects[0].excludePattern;
  let array = str.split("*");
  if (array.indexOf(exclPatrn.domain) > -1) {
    msg = "This site " + exclPatrn.domain + " already exists in Excludes list";
    $s.settingsApp.newExcludesite = "";

    $s.settingsApp.showMessage(msg, false, 10, 1);
    return;
  } else {
    $s.settingsApp.redirects[0].excludePattern =
      $s.settingsApp.redirects[0].excludePattern + exclPatrn.Pattern;
    msg = "This site " + exclPatrn.domain + " is added to Excludes list";
    $s.settingsApp.newExcludesite = "";

    var arr = $s.settingsApp.redirects.map($s.settingsApp.normalize);
    $s.settingsApp.saveRedirectsMsgsender(arr);
    $s.settingsApp.getRules();
    $s.settingsApp.showMessage(msg, "success", 10, 1);
  }
};

$s.settingsApp.tempExcludes = "";
$s.settingsApp.tempIncludes = "";
$s.settingsApp.justSaved = "";
$s.settingsApp.filters = [];
$s.settingsApp.appVersion = "1.0.0";
$s.settingsApp.commonExtensions = [];
$s.settingsApp.getTemps = () => {
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
        $s.settingsApp.savecount = counts.waybackSavescount;
        $s.settingsApp.loadcount = counts.archivedPageLoadsCount;
        $s.settingsApp.disabled = response.appDisabled; */
      $s.settingsApp.appVersion = response.appVersion;
      let k = document.getElementById("appVersion");
      if (!!k) {
        k.textContent = "Version " + $s.settingsApp.appVersion;
      }
      $s.settingsApp.tempExcludes = response.tempExcludes
        .join("")
        .replace(/\*/g, "")
        .substring(1)
        .replace(/\|/g, ", ");
      let el = document.getElementById("tempExcludes");

      if (!!$s.settingsApp.tempExcludes) {
        el.style.display = "";
        el.lastElementChild.textContent = $s.settingsApp.tempExcludes;
      } else {
        el.style.display = "none";
      }
      el = document.getElementById("tempIncludes");
      $s.settingsApp.tempIncludes = response.tempIncludes
        .join("")
        .replace(/\*/g, "")
        .substring(1)
        .replace(/\|/g, ", ");
      if (!!$s.settingsApp.tempIncludes) {
        el.style.display = "";
        el.lastElementChild.textContent = $s.settingsApp.tempIncludes;
      } else {
        el.style.display = "none";
      }

      if (!$s.settingsApp.tempExcludes && !$s.settingsApp.tempExcludes) {
        document.getElementById("clearTempButton").style.display = "none";
      } else {
        document.getElementById("clearTempButton").style.display = "";
      }
      //$s.settingsApp.isLoadAllLinksEnabled = response.isLoadAllLinksEnabled;
      //  console.log('tempExcludes is ' + tempExcludes + ' tempIncludes is ' + tempIncludes);
      if (response.justSaved.length > 0) {
        $s.settingsApp.justSaved = response.justSaved.join(", ");
      }
      $s.settingsApp.filters = response.filters;
      $s.settingsApp.appVersion = response.appVersion;
      $s.settingsApp.commonExtensions = response.commonExtensions;
      $s.settingsApp.showdebuginfo();
      //$s.settingsApp.getRules();;
    }
  );
};

$s.settingsApp.clearTemps = function() {
  chrome.runtime.sendMessage(
    {
      type: "clearTemps"
    },
    function(response) {
      if (response.message == "successfullyclearedTemps") {
        $s.settingsApp.tempExcludes = "";
        $s.settingsApp.tempIncludes = "";
        //$s.settingsApp.getRules();;
        $s.settingsApp.getRules();
      }
    }
  );
};

$s.settingsApp.removefromExclude = function(url) {
  let url1 = url.replace(/[\|&;\$%@"<>\(\)\+\^\'\*,]/g, "");
  $s.settingsApp.message = null;
  var inclPattrn = $s.settingsApp.getPattern(url1);
  var msg;
  $s.settingsApp.newIncludeSite = "";
  if (inclPattrn.domain.indexOf("|") > -1) {
    msg =
      "You entered a URL -> " +
      inclPattrn.domain +
      " with | symbol. This is not allowed, please try again";
    $s.settingsApp.showMessage(msg, false, 10, 1);
    $s.settingsApp.newIncludeSite = "";
    $s.settingsApp.getRules();

    return;
  }
  if (inclPattrn.domain.indexOf("web.archive.org") > -1) {
    msg =
      "You entered a URL -> " +
      inclPattrn.domain +
      " This is not allowed, removing this will affect functionality";
    $s.settingsApp.showMessage(msg, false, 10, 1);
    $s.settingsApp.newIncludeSite = "";
    $s.settingsApp.getRules();

    return;
  }
  let str = $s.settingsApp.redirects[0].excludePattern;
  let array = str.split("*");
  // Using >0 because we shouldn't let remove web.archive.org from excludeslist - avoiding endless redirect loop
  if (array.indexOf(inclPattrn.domain) > -1) {
    $s.settingsApp.newIncludeSite = "";

    var obj = $s.settingsApp.replaceAll(
      $s.settingsApp.redirects[0].excludePattern,
      inclPattrn.domain
    );
    if (obj.isremoved) {
      $s.settingsApp.redirects[0].excludePattern = obj.string;
      msg =
        "This site " + inclPattrn.domain + " is removed from the Excludes list";
      var arr = $s.settingsApp.redirects.map($s.settingsApp.normalize);
      $s.settingsApp.saveRedirectsMsgsender(arr);
      $s.settingsApp.showMessage(msg, true, 10, 1);
    } else {
      msg =
        "No need to remove.. This site " +
        inclPattrn.domain +
        " is already not available in the Excludes list";
      $s.settingsApp.showMessage(msg, "success", 10, 1);
    }
  } else {
    $s.settingsApp.newIncludeSite = "";
    msg =
      "No need to remove! This site " +
      inclPattrn.domain +
      " is already not available in the Excludes list";
    $s.settingsApp.showMessage(msg, "success", 10, 1);
  }
  $s.settingsApp.getRules();
};

$s.settingsApp.isLoadAllLinksEnabled = false;

$s.settingsApp.storage.get(
  {
    isLoadAllLinksEnabled: false
  },
  function(obj) {
    $s.settingsApp.isLoadAllLinksEnabled = obj.isLoadAllLinksEnabled;
    document.getElementById("isLoadAllLinksEnabled").checked =
      obj.isLoadAllLinksEnabled;
    //$s.settingsApp.getRules();;
  }
);

$s.settingsApp.toggleLoadAllLinksSettings = function() {
  $s.settingsApp.storage.set(
    {
      isLoadAllLinksEnabled: !$s.settingsApp.isLoadAllLinksEnabled
    },
    function() {
      $s.settingsApp.isLoadAllLinksEnabled = !$s.settingsApp
        .isLoadAllLinksEnabled;

      if ($s.settingsApp.isLoadAllLinksEnabled) {
        document.getElementById("showExampleOpen").style.display = "";
        document.getElementById("showExampleOpenall").style.display = "none";
      }

      //$s.settingsApp.getRules();;
    }
  );
};

$s.settingsApp.replaceAll = (exclist, domain) => {
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

$s.settingsApp.getPattern = url => {
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

$s.settingsApp.openHelp = function() {
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

$s.settingsApp.normalize = function(r) {
  return new Redirect(r).toObject(); //Cleans out any extra props, and adds default values for missing ones.
};

$s.settingsApp.showresetConfirmation = false;

$s.settingsApp.saveRedirectsMsgsender = arr => {
  chrome.runtime.sendMessage(
    {
      type: "saveredirects",
      redirects: arr
    },
    function(response) {
      $s.settingsApp.redirects = [];
      $s.settingsApp.redirects = arr;
      $s.settingsApp.ReadableExcludePattern = $s.settingsApp.redirects[0].excludePattern
        .replace(/\*/g, "")
        .replace(/\|/g, ", ");
      $s.settingsApp.getRules();
      //$s.settingsApp.getRules();;
    }
  );
};

// Saves the entire list of redirects to $s.settingsApp.storage
$s.settingsApp.saveChanges = function() {
  // Clean them up so angular $$hash things and stuff don't get serialized.
  var arr = $s.settingsApp.redirects.map($s.settingsApp.normalize);

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

  $s.settingsApp.saveRedirectsMsgsender(arr);
};

// Saves the entire list of redirects to $s.settingsApp.storage
$s.settingsApp.saveChanges2 = function(arr) {
  // Clean them up so angular $$hash things and stuff don't get serialized.

  //adding web.archive.org to beginning of exclude so that even if imported json doesn't have it,
  // so that user won't end up endless looping

  if (arr[0].excludePattern.indexOf("web.archive.org") < 0) {
    arr[0].excludePattern =
      "*web.archive.org*|*archive.org*|*chrome://*|*about:*|" +
      arr[0].excludePattern;
  }
  $s.settingsApp.saveRedirectsMsgsender(arr);
};

$s.settingsApp.redirects = [];

$s.settingsApp.ReadableExcludePattern = "web.archive.org";
//Need to proxy this through the background page,because Firefox gives us dead objects
//nonsense when accessing chrome.Storage directly.
$s.settingsApp.getRules = () => {
  chrome.runtime.sendMessage(
    {
      type: "getredirects"
    },
    function(response) {
      if ($s.settingsApp.redirects.length == 0) {
        $s.settingsApp.redirects.push(
          $s.settingsApp.normalize(response.redirects[0])
        );
      }
      document.getElementById("rDescription").textContent =
        $s.settingsApp.redirects[0].description;
      $s.settingsApp.ReadableExcludePattern = response.redirects[0].excludePattern
        .replace(/\*/g, "")
        .replace(/\|/g, ", ");
      let el = (document.querySelector("#showExcludes").textContent =
        $s.settingsApp.ReadableExcludePattern);
      $s.settingsApp.getTemps();
      $s.settingsApp.showdebuginfo();

      //$s.settingsApp.getRules();;
    }
  );
};

// Shows a message explaining how many redirects were imported.

$s.settingsApp.timestamp = new Date();

$s.settingsApp.importRedirects = function() {
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
        $s.settingsApp.showMessage(
          "Failed to parse JSON data, invalid JSON: " +
            (e.message || "").substr(0, 100)
        );
        return;
      }

      if (!data.redirects) {
        $s.settingsApp.showMessage(
          'Invalid JSON, missing "redirects" property '
        );
        return;
      }

      if (
        data.createdBy.indexOf("Wayback Everywhere") < 0 ||
        data.redirects[0].description.indexOf("Wayback Everywhere") < 0
      ) {
        $s.settingsApp.showMessage(
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
        $s.settingsApp.redirects.some(function(i) {
          return new Redirect(i).equals(r);
        })
      ) {
        existing++;
      } else {
        var arr = [];
        arr.push(r.toObject());

        imported++;
        $s.settingsApp.saveChanges2(arr);
      }

      $s.settingsApp.showImportedMessage(imported, existing);

      // add above this
    };

    try {
      reader.readAsText(file, "utf-8");
    } catch (e) {
      $s.settingsApp.showMessage("Failed to read import file");
    }
  });
};

// Updates the export link with a data url containing all the redirects.
// We want to have the href updated instead of just generated on click to
// allow people to right click and choose Save As...
$s.settingsApp.updateExportLink = function() {
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
  $s.settingsApp.timestamp = day + "_" + localtime + "_" + localtimezone;

  var redirects = $s.settingsApp.redirects.map(function(r) {
    return new Redirect(r).toObject();
  });

  var exportObj = {
    createdBy: "Wayback Everywhere v" + chrome.runtime.getManifest().version,
    createdAt: new Date(),
    redirects: redirects
  };

  var json = JSON.stringify(exportObj, null, 4);

  //Using encodeURIComponent here instead of base64 because base64 always messed up our encoding for some reason...
  $s.settingsApp.redirectDownload =
    "data:text/plain;charset=utf-8," + encodeURIComponent(json);
  let elem = document.getElementById("exportSettingBtn");
  if (!!elem) {
    elem.href = $s.settingsApp.redirectDownload;
    elem.download = elem.download.replace(
      "{{timestamp}}",
      $s.settingsApp.timestamp
    );
  }
};

$s.settingsApp.showImportedMessage = (imported, existing) => {
  if (imported == 0 && existing == 0) {
    $s.settingsApp.showMessage("No redirects existed in the file.");
  }
  if (imported > 0 && existing == 0) {
    $s.settingsApp.showMessage("Successfully imported settings", true);
  }
  if (imported == 0 && existing > 0) {
    $s.settingsApp.showMessage(
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
    $s.settingsApp.showMessage(m, true);
  }
};

$s.settingsApp.showdebuginfo = () => {
  let el = document.getElementById("logging");
  let el2 = document.getElementById("loggingInAdvancedUserPage");
  if ($s.settingsApp.logging || !!el2) {
    if (!!el) {
      el.style.display = "";
    }
    document.getElementById("justsaved").textContent = $s.settingsApp.justSaved;
    document.getElementById(
      "filtersarea"
    ).textContent = $s.settingsApp.filters.join(", ");
    document.getElementById(
      "fileExtarea"
    ).textContent = $s.settingsApp.commonExtensions.join(", ");
  } else {
    if (!!el) {
      el.style.display = "none";
    }
  }
};

$s.settingsApp.logging = false;

$s.settingsApp.toggleLogging = function() {
  $s.settingsApp.storage.get(
    {
      logging: false
    },
    function(obj) {
      $s.settingsApp.storage.set({
        logging: !obj.logging
      });
      $s.settingsApp.logging = !obj.logging;
      $s.settingsApp.showdebuginfo();
    }
  );
};

$s.settingsApp.togglereadermode = () => {
  $s.settingsApp.storage.set({
    readermode: !$s.settingsApp.readermode
  });
  $s.settingsApp.readermode = !$s.settingsApp.readermode;
  $s.settingsApp.getRules();
};

$s.settingsApp.toggleOperationMode = () => {
  $s.settingsApp.storage.set(
    {
      operationMode: !$s.settingsApp.operationmode
    },
    function(a) {
      $s.settingsApp.operationmode = !$s.settingsApp.operationmode;
      $s.settingsApp.getRules();
    }
  );
};

$s.settingsApp.doFactoryReset = () => {
  chrome.runtime.sendMessage({
    type: "doFullReset",
    subtype: "fromSettings"
  });
};

// Shows a message bar above the list of redirects.
$s.settingsApp.showMessage = (message, success, timer, id) => {
  let msgBox = document.getElementById("message-box");
  let incExcmsg = document.getElementById("incExcmsg");
  if (id != null) {
    $s.settingsApp.incExcmsg = message;
    incExcmsg.style.display = "";
    incExcmsg.innerText = message;
    incExcmsg.classList = success ? "success" : "error";
  } else {
    $s.settingsApp.message = message;
    msgBox.style.display = "";
    msgBox.innerText = message;
    msgBox.classList = success ? "success" : "error";
  }
  if (timer == null) {
    timer = 10;
  }
  //Remove the message in 20 seconds if it hasnt been changed...

  setTimeout(function() {
    if ($s.settingsApp.message == message) {
      $s.settingsApp.message = null;
      msgBox.style.display = "none";
    }
  }, timer * 1000);
  setTimeout(function() {
    if ($s.settingsApp.incExcmsg == message) {
      $s.settingsApp.incExcmsg = null;
      incExcmsg.style.display = "none";
    }
  }, timer * 1000);
};

$s.settingsApp.showresetConfirmation = false;
$s.settingsApp.showresetbutton = true;
$s.settingsApp.toggleResetwarn = function() {
  $s.settingsApp.showresetConfirmation = !$s.settingsApp.showresetConfirmation;
  $s.settingsApp.showresetbutton = !$s.settingsApp.showresetbutton;
  if ($s.settingsApp.showresetConfirmation) {
    document.getElementById("showresetConfirmation").style.display = $s
      .settingsApp.showresetConfirmation
      ? ""
      : "none";
  }
  $s.settingsApp.showresetbutton = !$s.settingsApp.showresetbutton;
  document.getElementById("toggleResetwarn").style.display = $s.settingsApp
    .showresetbutton
    ? ""
    : "none";
};

$s.settingsApp.toggleDisabled = function(redirect) {
  redirect.disabled = !redirect.disabled;
  $s.settingsApp.saveChanges();
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
    $s.settingsApp.getInitialValues,
    false
  );
})();

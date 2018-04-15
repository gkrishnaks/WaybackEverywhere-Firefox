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


// This is the main controller of the page. It is responsible for showing messages,
// modal windows and loading and saving the list of redirects, that all of the
// controllers work with.

waybackEverywhereApp.controller('WBESettingsPageControl', ['$scope', '$timeout', '$document', function($s, $timeout, $document) {
  $s.deleting = null; //Variable for redirect being edited, of the form { index:<nr>, redirect:<redirect>};
  $s.showEditForm = $s.showDeleteForm = false; // Variables, child controllers can set them to show their forms
  $s.newExcludesite = "";
  $s.newIncludeSite = "";

  //   $scope.enterkey = function($event){
  //     var keyCode = $event.which || $event.keyCode;
  //     if (keyCode === 13) {

  //   };

  /*  String.prototype.replaceAll = function(searchStr, replaceStr) {
      var str = this;

      // escape regexp special characters in search string
      searchStr = searchStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

      return str.replace(new RegExp(searchStr, 'gi'), replaceStr);
    };*/

  $s.addtoExclude = function(url) {
    $s.message = null;
    var url1 = url.replace(/[\|&;\$%@"<>\(\)\+\^\'\*,]/g, "");
    var exclPatrn = getPattern(url1);
    var msg;
    $s.newExcludesite = "";

    if (exclPatrn.domain.indexOf('|') > -1) {
      msg = 'You entered a URL -> ' + exclPatrn.domain + ' with | symbol. This is not allowed, please try again';
      $s.showMessage(msg, 'error', 10, 1);
      $s.newExcludesite = "";

      return;
    }
    //excludePattern in $s.redir looks like *web.archive.org*|*fsf.org*
    let str = $s.redirects[0].excludePattern;
    let array = str.split('*');
    if (array.indexOf(exclPatrn.domain) > -1) {
      msg = 'This site ' + exclPatrn.domain + ' already exists in Excludes list';
      $s.newExcludesite = "";

      $s.showMessage(msg, 'success', 10, 1);
      return;
    } else {
      $s.redirects[0].excludePattern = $s.redirects[0].excludePattern + exclPatrn.Pattern;
      msg = 'This site ' + exclPatrn.domain + ' is added to Excludes list';
      $s.newExcludesite = "";

      var arr = $s.redirects.map(normalize);
      saveRedirectsMsgsender(arr);
      $s.showMessage(msg, 'success', 10, 1);
    }
  };

  $s.removefromExclude = function(url) {
    url1 = url.replace(/[\|&;\$%@"<>\(\)\+\^\'\*,]/g, "");
    $s.message = null;
    var inclPattrn = getPattern(url1);
    var msg;
    $s.newIncludeSite = "";
    if (inclPattrn.domain.indexOf('|') > -1) {
      msg = 'You entered a URL -> ' + inclPattrn.domain + ' with | symbol. This is not allowed, please try again';
      $s.showMessage(msg, 'error', 10, 1);
      $s.newIncludeSite = "";
      return;
    }
    if (inclPattrn.domain.indexOf('web.archive.org') > -1) {
      msg = 'You entered a URL -> ' + inclPattrn.domain + ' This is not allowed, removing this will affect functionality';
      $s.showMessage(msg, 'error', 10, 1);
      $s.newIncludeSite = "";
      return;
    }
    let str = $s.redirects[0].excludePattern;
    let array = str.split('*');
    // Using >0 because we shouldn't let remove web.archive.org from excludeslist - avoiding endless redirect loop
    if (array.indexOf(inclPattrn.domain) > 0) {
      $s.newIncludeSite = "";

      var obj = replaceAll($s.redirects[0].excludePattern, inclPattrn.domain);
      if (obj.isremoved) {
        $s.redirects[0].excludePattern = obj.string;
        msg = 'This site ' + inclPattrn.domain + ' is removed from the Excludes list';
        var arr = $s.redirects.map(normalize);
        saveRedirectsMsgsender(arr);
        $s.showMessage(msg, 'success', 10, 1);
      } else {
        msg = 'No need to remove.. This site ' + inclPattrn.domain + ' is already not available in the Excludes list';
        $s.showMessage(msg, 'success', 10, 1);
      }
    } else {
      $s.newIncludeSite = "";
      msg = 'No need to remove! This site ' + inclPattrn.domain + ' is already not available in the Excludes list';
      $s.showMessage(msg, 'success', 10, 1);
    }

  };

  var replaceAll = function(exclist, domain) {
    // format *web.archive.org*|*example.org*
    var obj = {
      string: "",
      isremoved: false
    };
    var array = exclist.split('|');
    domain = '*' + domain + '*';

    for (let i = array.length - 1; i >= 0; i--) {
      if (array[i] === domain) {
        array.splice(i, 1);
        obj.isremoved = true;
      }
    }
    obj.string = array.join('|');
    return obj;
  }


  var getPattern = function(url) {
    var url2 = url;
    var obj = {
      domain: "",
      Pattern: ""
    };
    var url3;
    if (url2.indexOf('web.archive.org') >= 0) {
      if (url2.indexOf('web.archive.org/save') > -1) {
        url2 = url2.replace('.org/save/', '.org/web/2/');
        log('url2 from save to web/2 ..' + url2);
      }
      url2 = url2.split('web.archive.org/').pop();
    }
    if (url2.indexOf('http://') < 0 && url2.indexOf('https://') < 0) {
      url3 = url2;
      log('url3 set as ' + url3);
      obj.domain = url2.toLowerCase();
    } else {
      var pattern = /:\/\/(.[^/]+)/;
      url3 = url2.match(pattern)[1];
      url3 = url3.split('www.').pop();
      obj.domain = url3.toLowerCase();
      log('excludethisSite after regexpattern is ' + url3);
    }
    obj.Pattern = '|*' + url3.toLowerCase() + '*';
    return obj;
  }


  $s.openHelp = function() {
    var url = chrome.extension.getURL('help.html');

    //FIREFOXBUG: Firefox chokes on url:url filter if the url is a moz-extension:// url
    //so we don't use that, do it the more manual way instead.
    chrome.tabs.query({
      currentWindow: true
    }, function(tabs) {
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].url == url) {
          chrome.tabs.update(tabs[i].id, {
            active: true
          }, function(tab) {
            //close();
          });
          return;
        }
      }


      chrome.tabs.create({
        url: "help.html"
      });
    });
  };

  var storage = chrome.storage.local; //TODO: Change to sync when Firefox supports it...

  function normalize(r) {
    return new Redirect(r).toObject(); //Cleans out any extra props, and adds default values for missing ones.
  }
  $s.showresetConfirmation = false;

  var saveRedirectsMsgsender = function(arr) {

    chrome.runtime.sendMessage({
      type: "saveredirects",
      redirects: arr
    }, function(response) {
      $s.redirects = [];
      $s.redirects = arr;
      var exc1 = $s.redirects[0].excludePattern;
      $s.ReadableExcludePattern = exc1.replace(/\*/g, '');
      $s.ReadableExcludePattern = $s.ReadableExcludePattern.replace(/\|/g, ', ');

      $s.$apply();

    });

  }

  // Saves the entire list of redirects to storage.
  $s.saveChanges = function() {

    // Clean them up so angular $$hash things and stuff don't get serialized.
    var arr = $s.redirects.map(normalize);

    //adding web.archive.org to beginning of exclude so that even if user clears it, ,
    // so that user won't end up endless looping
    if (arr[0].excludePattern.indexOf('web.archive.org') < 0) {
      if (arr[0].excludePattern.length == 0) {
        arr[0].excludePattern = '*web.archive.org*|*archive.org*|*chrome://*|*about:*|*/chrome/newtab*'
      } else {
        arr[0].excludePattern = '*web.archive.org*|*archive.org*|*chrome://*|*about:*|*/chrome/newtab*|' + arr[0].excludePattern;
      }
    }

    saveRedirectsMsgsender(arr);

  };


  // Saves the entire list of redirects to storage.
  $s.saveChanges2 = function(arr) {

    // Clean them up so angular $$hash things and stuff don't get serialized.

    //adding web.archive.org to beginning of exclude so that even if imported json doesn't have it,
    // so that user won't end up endless looping

    if (arr[0].excludePattern.indexOf('web.archive.org') < 0) {

      arr[0].excludePattern = '*web.archive.org*|*archive.org*|*chrome://*|*about:*|' + arr[0].excludePattern;
    }
    saveRedirectsMsgsender(arr);
  };


  $s.redirects = [];

  $s.ReadableExcludePattern = 'web.archive.org';
  //Need to proxy this through the background page,because Firefox gives us dead objects
  //nonsense when accessing chrome.storage directly.
  chrome.runtime.sendMessage({
    type: "getredirects"
  }, function(response) {
    for (var i = 0; i < response.redirects.length; i++) {
      $s.redirects.push(normalize(response.redirects[i]));
    }
    var exc = $s.redirects[0].excludePattern;
    $s.ReadableExcludePattern = exc.replace(/\*/g, '');
    $s.ReadableExcludePattern = $s.ReadableExcludePattern.replace(/\|/g, ', ');

    $s.$apply();
  });

  $s.logging = false;

  storage.get({
    logging: false
  }, function(obj) {
    $s.logging = obj.logging;
    $s.$apply();
  });


  $s.toggleLogging = function() {
    storage.get({
      logging: false
    }, function(obj) {
      storage.set({
        logging: !obj.logging
      });
      $s.logging = !obj.logging;
      $s.$apply();
    });
  };

  $s.doFactoryReset = function() {
    chrome.runtime.sendMessage({
      type: "doFullReset",
      subtype: "fromSettings"
    });
  };

  // Shows a message bar above the list of redirects.
  $s.showMessage = function(message, success, timer, id) {
    if (id != null) {
      $s.incExcmsg = message;
    } else {
      $s.message = message;
    }
    if (timer == null) {
      timer = 20;
    }
    $s.messageType = success ? 'success' : 'error';

    //Remove the message in 20 seconds if it hasn't been changed...
    $timeout(function() {
      if ($s.message == message) {
        $s.message = null;
      }
    }, timer * 1000);
    $timeout(function() {
      if ($s.incExcmsg == message) {
        $s.incExcmsg = null;
      }
    }, timer * 1000);

  }

}]);
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

    Home: https://github.com/gkrishnaks
*/


function Redirect(o) {
  this._init(o);
}
log.enabled = false;
//temp, allow addon sdk to require this.
if (typeof exports !== 'undefined') {
  exports.Redirect = Redirect;
}

function updateLogging() {
  chrome.storage.local.get({
    logging: false
  }, function(obj) {
    log.enabled = obj.logging;
  });
}

updateLogging();

function log(msg) {
  if (log.enabled) {
    console.log('WaybackEverywhere redirect.js: ' + msg);
  }
}
//Static
Redirect.WILDCARD = 'W';
Redirect.REGEX = 'R';

Redirect.requestTypes = {
  main_frame: 'Main window (address bar)',
  sub_frame: 'IFrames',
  stylesheet: 'Stylesheets',
  script: 'Scripts',
  image: 'Images',
  object: 'Objects (e.g. Flash videos, Java applets)',
  xmlhttprequest: 'XMLHttpRequests (Ajax)',
  other: 'Other',
};

Redirect.prototype = {

  //attributes
  description: '',
  exampleUrl: '',
  exampleResult: '',
  error: null,
  includePattern: '',
  excludePattern: '',
  redirectUrl: '',
  patternType: '',
  processMatches: 'noProcessing',
  disabled: false,

  compile: function() {

    var incPattern = this._preparePattern(this.includePattern);
    var excPattern = this._preparePattern(this.excludePattern);
    log('Pattern..' + excPattern);
    if (incPattern) {
      this._rxInclude = new RegExp(incPattern, 'gi');
    }

    if (excPattern) {
      this._rxExclude = new RegExp(excPattern, 'gi');
    }
  },

  equals: function(redirect) {
    return this.description == redirect.description &&
      this.exampleUrl == redirect.exampleUrl &&
      this.includePattern == redirect.includePattern &&
      this.excludePattern == redirect.excludePattern &&
      this.redirectUrl == redirect.redirectUrl &&
      this.patternType == redirect.patternType &&
      this.processMatches == redirect.processMatches &&
      this.appliesTo.toString() == redirect.appliesTo.toString();
  },

  toObject: function() {
    return {
      description: this.description,
      exampleUrl: this.exampleUrl,
      exampleResult: this.exampleResult,
      error: this.error,
      includePattern: this.includePattern,
      excludePattern: this.excludePattern,
      redirectUrl: this.redirectUrl,
      patternType: this.patternType,
      processMatches: this.processMatches,
      disabled: this.disabled,
      appliesTo: this.appliesTo.slice(0),
    };
  },

  getMatch: function(url, forceIgnoreDisabled) {
    if (!this._rxInclude) {
      this.compile();
    }

    var result = {
      isMatch: false,
      isExcludeMatch: false,
      isDisabledMatch: false,
      redirectTo: '',
      toString: function() {
        return JSON.stringify(this);
      }
    };
    var redirectTo = null;

    redirectTo = this._includeMatch(url);
    log('redirectTo is' + this._includeMatch(url));

    if (redirectTo !== null) {
      if (this.disabled && !forceIgnoreDisabled) {
        result.isDisabledMatch = true;
      } else if (this._excludeMatch(url)) {
        result.isExcludeMatch = true;
      } else {
        result.isMatch = true;
        result.redirectTo = redirectTo;
      }
    }
    log('returning result as ' + result);
    return result;
  },


  //Updates the .exampleResult field or the .error
  //field depending on if the example url and patterns match
  //and make a good redirect
  updateExampleResult: function() {

    //Default values
    this.error = null;
    this.exampleResult = '';


    if (!this.exampleUrl) {
      this.error = 'No example URL defined.';
      return;
    }

    if (this.patternType == Redirect.REGEX && this.includePattern) {
      try {
        new RegExp(this.includePattern, 'gi');
      } catch (e) {
        this.error = 'Invalid regular expression in Include pattern.';
        return;
      }
    }

    if (this.patternType == Redirect.REGEX && this.excludePattern) {
      try {
        new RegExp(this.excludePattern, 'gi');
      } catch (e) {
        this.error = 'Invalid regular expression in Exclude pattern.';
        return;
      }
    }

    if (!this.appliesTo || this.appliesTo.length == 0) {
      this.error = 'At least one request type must be chosen.';
      return;
    }

    this.compile();

    var match = this.getMatch(this.exampleUrl, true);

    if (match.isExcludeMatch) {
      this.error = 'The exclude pattern excludes the example url.'
      return;
    }

    if (!match.isMatch) {
      this.error = 'The include pattern does not match the example url.';
      return;
    }

    this.exampleResult = match.redirectTo;
  },

  isRegex: function() {
    return this.patternType == Redirect.REGEX;
  },

  isWildcard: function() {
    return this.patternType == Redirect.WILDCARD;
  },

  test: function() {
    return this.getMatch(this.exampleUrl);
  },

  //Private functions below
  _rxInclude: null,
  _rxExclude: null,

  _preparePattern: function(pattern) {
    if (!pattern) {
      return null;
    }
    if (this.patternType == Redirect.REGEX) {
      return pattern;
    } else { //Convert wildcard to regex pattern
      var converted = '^';
      for (var i = 0; i < pattern.length; i++) {
        var ch = pattern.charAt(i);
        if ('()[]{}?.^$\\+'.indexOf(ch) != -1) {
          converted += '\\' + ch;
        } else if (ch == '*') {
          converted += '(.*?)';
        } else {
          converted += ch;
        }
      }
      converted += '$';
      log('Converted pattern from wildcards is.. ' + converted);
      return converted;
    }
  },

  _init: function(o) {
    this.description = o.description || '';
      this.exampleUrl = o.exampleUrl || '';
    this.exampleResult = o.exampleResult || '';
    this.error = o.error || null;
    this.includePattern = o.includePattern || '';
    this.excludePattern = o.excludePattern || '';
    this.redirectUrl = o.redirectUrl || '';
    this.patternType = o.patternType || Redirect.WILDCARD;
    this.processMatches = o.processMatches || 'noProcessing';
    if (!o.processMatches && o.unescapeMatches) {
      this.processMatches = 'urlDecode';
    }
    if (!o.processMatches && o.escapeMatches) {
      this.processMatches = 'urlEncode';
    }

    this.disabled = !!o.disabled;
    if (o.appliesTo && o.appliesTo.length) {
      this.appliesTo = o.appliesTo.slice(0);
    } else {
      this.appliesTo = ['main_frame'];
    }
  },

  toString: function() {
    return JSON.stringify(this.toObject(), null, 2);
  },

  _includeMatch: function(url) {
    //var finalurl = "";
    if (!this._rxInclude) {
      return null;
    }
    var matches = this._rxInclude.exec(url);
    if (!matches) {
      return null;
    }
    var resultUrl = this.redirectUrl;
    for (var i = 1; i < matches.length; i++) {
      var repl = matches[i] || '';
      if (this.processMatches == 'urlDecode') {
        repl = unescape(repl);
      }
      if (this.processMatches == 'urlEncode') {
        repl = encodeURIComponent(repl);
      }
      if (this.processMatches == 'base64decode') {
        if (repl.indexOf('%') > -1) {
          repl = unescape(repl);
        }
        repl = atob(repl);
      }
      resultUrl = resultUrl.replace(new RegExp('\\$' + i, 'gi'), repl);
      log('finalurl --> ' + repl + ' resultUrl -->' + resultUrl);
    }
    this._rxInclude.lastIndex = 0;
    return resultUrl;
  },

  _excludeMatch: function(url) {
    log('inside _excludeMatch.. for url -->' + url);
    if (!this._rxExclude) {
      log('returning false');
      return false;
    }
    // fix for https://github.com/gkrishnaks/WaybackEverywhere-Firefox/issues/3
    // Url might have tracking parts after ? that might be in excludes
    // In that case, it shouldn't be excluded
    // for example, if url has http://example.com/some/page?utm=twitter.com -> though twitter.com is in Excludes list, shouldn't exclude that as it's in tracking part
    let url2 = getHostfromUrl(url).hostname;
    var shouldExclude = this._rxExclude.test(url2);
    this._rxExclude.lastIndex = 0;
    // The below may not happen at all as background.js just returns when hostname is "t.co"
    //but just to be sure endless redirect won't happen, we will retain the below
    if (url2 == "t.co") {
      shouldExclude = true;
    }
    log('shouldExclude --> ' + shouldExclude + 'for url ' + url);
    return shouldExclude;
  }
};

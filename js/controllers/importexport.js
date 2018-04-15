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


//This controller, and associated directives and config, are responsible for import and exporting redirects
//from .json files.

waybackEverywhereApp.config([
  '$compileProvider',
  function($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|data):/);
  }
]).directive('fileselected', function() { //Directive for file upload:
  return {
    restrict: 'A',
    link: function(scope, element, attr, ctrl) {
      element.bind('change', function(e) {
        var f = element[0].files[0];
        element[0].value = '';
        scope.$eval(attr.fileselected, {
          '$file': f
        });
      });
    }
  }
}).controller('ImportExportCtrl', ['$scope', function($s) {
  // Shows a message explaining how many redirects were imported.
  function showImportedMessage(imported, existing) {
    if (imported == 0 && existing == 0) {
      $s.showMessage('No redirects existed in the file.');
    }
    if (imported > 0 && existing == 0) {
      $s.showMessage('Successfully imported settings', true);
    }
    if (imported == 0 && existing > 0) {
      $s.showMessage('All redirects in the file already existed and were ignored.');
    }
    if (imported > 0 && existing > 0) {
      var m = 'Successfully imported ' + imported + ' redirect' + (imported > 1 ? 's' : '') + '. ';
      if (existing == 1) {
        m += '1 redirect already existed and was ignored.';
      } else {
        m += existing + ' redirects already existed and were ignored.';
      }
      $s.showMessage(m, true);
    }
  }
  $s.timestamp = new Date();
  $s.importRedirects = function(file) {
    if (!file) {
      return;
    }
    var reader = new FileReader();

    reader.onload = function(e) {
      var data;
      try {
        var data = JSON.parse(reader.result);
      } catch (e) {
        $s.showMessage('Failed to parse JSON data, invalid JSON: ' + (e.message || '').substr(0, 100));
        return $s.$parent.$apply();
      }

      if (!data.redirects) {
        $s.showMessage('Invalid JSON, missing "redirects" property ');
        return $s.$parent.$apply();
      }

      // check for description and name... using OR condition on purpose..
      if (data.createdBy.indexOf('Wayback Everywhere') < 0 || data.redirects[0].description.indexOf('Wayback Everywhere') < 0) {
        $s.showMessage('Invalid JSON, this does not seem to be exported from Wayback Everywhere');
        return $s.$parent.$apply();
      }

      var imported = 0,
        existing = 0;

      var i = 0;
      var r = new Redirect(data.redirects[i]);
      r.updateExampleResult();
      if ($s.redirects.some(function(i) {
          return new Redirect(i).equals(r);
        })) {
        existing++;
      } else {
        var arr = [];
        arr.push(r.toObject());

        imported++;
        $s.saveChanges2(arr);

      }



      showImportedMessage(imported, existing);

      $s.$parent.$apply();
    };
    try {
      reader.readAsText(file, 'utf-8');
    } catch (e) {
      $s.showMessage('Failed to read import file');
    }
  }

  // Updates the export link with a data url containing all the redirects.
  // We want to have the href updated instead of just generated on click to
  // allow people to right click and choose Save As...
  $s.updateExportLink = function() {
    var d = new Date();
    var localtime = d.toTimeString().split('GMT').shift('GMT');
    localtime = localtime.trim();
    var localtimezone = d.toTimeString().split('(').pop('GMT').replace(')', '');
    localtimezone = localtimezone.trim();
    var day = d.toDateString();
    day = day.substring(4).trim().replace(/ /g, '.');
    $s.timestamp = day + '_' + localtime + '_' + localtimezone;

    var redirects = $s.redirects.map(function(r) {
      return new Redirect(r).toObject();
    });

    var exportObj = {
      createdBy: 'Wayback Everywhere v' + chrome.runtime.getManifest().version,
      createdAt: new Date(),
      redirects: redirects
    };

    var json = JSON.stringify(exportObj, null, 4);

    //Using encodeURIComponent here instead of base64 because base64 always messed up our encoding for some reason...
    $s.redirectDownload = 'data:text/plain;charset=utf-8,' + encodeURIComponent(json);
  }

  $s.updateExportLink(); //Run once so we will have a href to begin with
}]);
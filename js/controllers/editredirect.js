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



waybackEverywhereApp.controller('EditRedirectCtrl', ['$scope', function($s) {


  $s.requestTypes = Redirect.requestTypes;

  // Ok, this is pretty ugly. But I want to make this controller to control
  // everything about the editing process, so I make this available on
  // the parent scope, so the RedirectListCtrl can access it.
  $s.$parent.editRedirect = function(index) {
    $s.redirect = new Redirect($s.redirects[index]);
    $s.editIndex = index;
    $s.redirect.updateExampleResult();
    if ($s.redirect.processMatches != 'noProcessing' || !($s.redirect.appliesTo.length == 1 && $s.redirect.appliesTo[0] == "main_frame")) {
      $s.showAdvanced = true; //Auto show advanced if redirect uses advanced options
    }
    $s.$parent.showEditForm = true;
  };

  // Same, this is for the Create New button, which is starting
  // the edit form, so I want to control it from here.
  $s.$parent.createNewRedirect = function() {
    $s.redirect = new Redirect({});
    $s.$parent.showEditForm = true;
  };

  $s.saveRedirect = function() {
    if ($s.redirect.error) {
      return; //Button is already disabled, but we still get the click
    }

    //Just make sure it's freshly updated when saved
    $s.redirect.updateExampleResult();

    if ($s.editIndex >= 0) {
      $s.redirects[$s.editIndex] = $s.redirect;
    } else {
      $s.redirects.unshift($s.redirect);
    }
    closeEditForm();
    $s.saveChanges();
  };

  $s.cancelEdit = function() {
    closeEditForm();
  }

  // To bind a list of strings to a list of checkboxes
  $s.appliesTo = function(key) {
    if (!$s.redirect) {
      return;
    }
    return $s.redirect.appliesTo.indexOf(key) != -1;
  };

  // Add or remove string from array based on whether checkbox is checked
  $s.toggleApplies = function(key) {
    if (!$s.redirect) {
      return;
    }
    var arr = $s.redirect.appliesTo;

    var index = arr.indexOf(key);
    if (index == -1) {
      arr.push(key);
    } else {
      arr.splice(index, 1);
    }

    var order = 'main_frame,sub_frame,stylesheet,script,image,object,xmlhttprequest,other';

    arr.sort(function(a, b) {
      return order.indexOf(a) - order.indexOf(b);
    });

    $s.redirect.updateExampleResult();
  };

  function closeEditForm() {
    $s.editIndex = -1;
    $s.redirect = null;
    $s.showAdvanced = false;
    $s.$parent.showEditForm = false;
  }
}]);
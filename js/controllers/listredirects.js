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


// This controller is responsible for the list of redirects and the actions
// that can be taken from there.
waybackEverywhereApp.filter('requestTypeDisplay', function() { //Filter for displaying nice names for request types
  return function(input) {
    return input.map(function(key) {
      return Redirect.requestTypes[key];
    }).join(', ');
  }
}).controller('ListRedirectsCtrl', ['$scope', function($s) {

  function swap(arr, i, n) {
    var item = arr[i];
    arr[i] = arr[n];
    arr[n] = item;
  }
  $s.showresetConfirmation = false;
  $s.showresetbutton = true;
  $s.toggleResetwarn = function() {
    $s.showresetConfirmation = !$s.showresetConfirmation;
    $s.showresetbutton = !$s.showresetbutton;

  }
  // Move the redirect at index up in the list, giving it higher priority
  $s.moveUp = function(index) {
    if (index == 0) {
      return;
    }
    swap($s.redirects, index, index - 1);
    $s.saveChanges();
  };

  // Move the redirect at index down in the list, giving it lower priority
  $s.moveDown = function(index) {
    if (index == $s.redirects.length - 1) {
      return;
    }
    swap($s.redirects, index, index + 1);
    $s.saveChanges();
  };

  $s.toggleDisabled = function(redirect) {
    redirect.disabled = !redirect.disabled;
    $s.saveChanges();
  };

  $s.example = function(redirect) {
    return new Redirect(redirect).getMatch(redirect.exampleUrl).redirectTo;
  };

  //Edit button is defined in EditRedirectCtrl
  //Delete button is defined in DeleteRedirectCtrl
  //Exclude site button is defined in Excludesitectrl
}]);
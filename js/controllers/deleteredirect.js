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


waybackEverywhereApp.controller('DeleteRedirectCtrl', ['$scope', function($s) {

  // Ok, this is pretty ugly. But I want to make this controller to control
  // everything about the deleting process, so I make this available on
  // the parent scope, so the RedirectListCtrl can access it.
  $s.$parent.confirmDeleteRedirect = function(index) {
    $s.redirect = $s.redirects[index];
    $s.deleteIndex = index;
    $s.$parent.showDeleteForm = true;
  };

  $s.cancelDelete = function(index) {
    delete $s.redirect;
    delete $s.deleteIndex;
    $s.$parent.showDeleteForm = false;
  }

  $s.deleteRedirect = function() {
    $s.redirects.splice($s.deleteIndex, 1);
    delete $s.redirect;
    delete $s.deleteIndex;
    $s.$parent.showDeleteForm = false;
    $s.saveChanges();
  };
}]);
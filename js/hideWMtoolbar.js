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


//to hide wayback hideWaybackToolbat
// We hide for 2 cases
// 1. In desktop firefox user clicks save as pdf button
// 2. In Firefox Android, as there`s limited screen space,  let's hide it

function hideWaybackToolbar() {
  let c = document.getElementById("wm-tb-close");
  if (c != null) {
    c.click();
  }
}
hideWaybackToolbar();
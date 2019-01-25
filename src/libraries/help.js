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

//This code is used for collapse/open functionality in Help page

$(document).ready(function() {
  $(".collapse").on("shown.bs.collapse", function(e) {
    var $card = $(this).closest(".card");
    $("html,body").animate(
      {
        scrollTop: $card.offset().top
      },
      500
    );
    e.stopPropagation();
  });
  let manifestData = chrome.runtime.getManifest();
  let versionText = "Version " + manifestData.version;
  if (!!$("#appVersion")) {
    $("#appVersion").text(versionText);
  }
});

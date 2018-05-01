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

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type == "getAllFirstPartylinks") {
    let anchorsArray = [];
    let anchors = document.getElementsByTagName("a");

    for (let i = 0; i < anchors.length; i++) {
      // add only the links of same hostname - so we check if link is not starting with http
      if (anchors[i].getAttribute("href") !== null && !anchors[i].getAttribute("href").indexOf("http") == 0) {
        anchorsArray.push(anchors[i].getAttribute("href"));
      }
    }
    //console.log(anchorsArray);
    sendResponse({
      data: anchorsArray
    });
  }
  return true;
});
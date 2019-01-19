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

var PopupApp = window.PopupApp || {};

PopupApp.listenForClicks = e => {
    switch (e.target.id) {
        case "statsButton":
            PopupApp.statsShown = !PopupApp.statsShown;
            DOM.popupDOM.toggleStats(PopupApp.statsShown);
            break;
        case "enablebutton":
        case "disablebutton":
            PopupApp.toggleDisabled();
            break;
        case "savePagebutton":
            chrome.runtime.sendMessage(
                {
                    type: "savetoWM",
                    subtype: "fromPopup",
                    url: PopupApp.currentUrl,
                    tabid: PopupApp.tabid
                },
                function(response) {
                    PopupApp.log("returned to popup script" + response.message);
                    window.close();
                }
            );
            break;
        case "firstArchivedButton":
            chrome.runtime.sendMessage(
                {
                    type: "seeFirstVersion",
                    subtype: "fromPopup",
                    url: PopupApp.currentUrl,
                    tabid: PopupApp.tabid
                },
                response => {
                    PopupApp.log(response);
                    window.close();
                }
            );
            break;
        case "savePdfbutton":
            PopupApp.saveAsPDF();
            break;
        case "settingsbutton":
            PopupApp.openUrl(chrome.extension.getURL("settings.html"));
            break;
        case "refreshbutton":
            PopupApp.openUrl(PopupApp.currentUrl);

            break;
        case "includeButton":
            PopupApp.removeSitefromexclude();
            break;
        case "tempIncludeButton":
            PopupApp.removeSitefromexcludeTemp();
            break;
        case "clearTempExcludeButton":
            PopupApp.clearTempRules("tempExcludes");
            break;
        case "applyTempToPermExcludesButton":
            PopupApp.applyTemptoPermanent("excludes");
            break;
        case "clearFromTempIncludesButton":
            PopupApp.clearTempRules("tempIncludes");
            break;
        case "tempExcludebutton":
            PopupApp.sendExcludeMessage("AddtoTempExcludesList");
            break;
        case "MainExcludesButton":
            PopupApp.sendExcludeMessage("AddtoExcludesList");
            break;
        case "applysitetoPermanentIncludesButton":
            PopupApp.applyTemptoPermanent("includes");
            break;
        case "openAllLinksButton":
            PopupApp.loadAll1pLinks(
                document.querySelector("#selectorInput").value
            );
            break;
        case "helpButton":
            PopupApp.openUrl(chrome.extension.getURL("help.html"));
            break;
        /* case "rmrr":
        let nk = document.querySelector("#removethis");
        nk.style.display = "none"; // set to "" to display
        break; */
        default:
            PopupApp.log("click was not on a button");
    }
};

window.onload = () => {
    document.addEventListener("click", PopupApp.listenForClicks);
    document
        .getElementById("selectorInput")
        .addEventListener("keyup", DOM.popupDOM.keyUpListener);
};

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

var App = window.App || {};
App.settingsApp = window.App.settingsApp || {};

window.onload = function() {
    document.querySelector("#addtoExclude").disabled = true;
    document.querySelector("#removefromExclude").disabled = true;

    document.addEventListener("click", App.settingsApp.listenForClicks);
    document
        .getElementById("newExcludesite")
        .addEventListener("input", DOM.shouldEnableButton);
    document
        .getElementById("newIncludeSite")
        .addEventListener("input", DOM.shouldEnableButton);
    document
        .getElementById("newExcludesite")
        .addEventListener("keyup", App.keyUpListener);
    document
        .getElementById("newIncludeSite")
        .addEventListener("keyup", App.keyUpListener);
    let btn = document.getElementById("exportSettingBtn");
    if (!!btn) {
        btn.addEventListener("mousedown", App.settingsApp.updateExportLink);
    }
    try {
        document
            .getElementById("addfilter")
            .addEventListener("input", DOM.shouldEnableButton);
        document
            .getElementById("addfilter")
            .addEventListener("keyup", App.keyUpListener);

        document
            .getElementById("toRemoveFilter")
            .addEventListener("input", DOM.shouldEnableButton);
        document
            .getElementById("toRemoveFilter")
            .addEventListener("keyup", App.keyUpListener);

        document
            .getElementById("newExtension")
            .addEventListener("input", DOM.shouldEnableButton);
        document
            .getElementById("newExtension")
            .addEventListener("keyup", App.keyUpListener);

        document
            .getElementById("removeExtension")
            .addEventListener("input", DOM.shouldEnableButton);
        document
            .getElementById("removeExtension")
            .addEventListener("keyup", App.keyUpListener);
    } catch (e) {
        // do nothing..
    }
    App.settingsApp.getInitialValues();
    App.settingsApp.updateExportLink(); //Run once so we will have a href to begin with
};

App.keyUpListener = function(e) {
    if (e.keyCode === 13 || e.key === "Enter") {
        switch (e.target.id) {
            case "newExcludesite":
                App.settingsApp.addtoExclude(e.target.value);
                e.target.value = "";
                e.target.parentElement.disabled = true;
                break;
            case "newIncludeSite":
                App.settingsApp.removefromExclude(e.target.value);
                e.target.value = "";
                e.target.parentElement.disabled = true;
                break;
            case "addfilter":
                App.settingsApp.addtofilters(e.target.value);
                e.target.value = "";
                document.getElementById("addtofiltersBtn").disabled = true;
                break;
            case "toRemoveFilter":
                App.settingsApp.removefromfilters(e.target.value);
                e.target.value = "";
                document.getElementById("removefromfiltersBtn").disabled = true;
                break;
            case "newExtension":
                App.settingsApp.addtoExtensions(e.target.value);
                e.target.value = "";
                document.getElementById("addtoExtensions").disabled = true;
                break;

            case "removeExtension":
                App.settingsApp.removefromExtensions(e.target.value);
                e.target.value = "";
                document.getElementById("removefromExtensions").disabled = true;
                break;
        }
        App.settingsApp.getRules();
    } else if (e.key === " " || e.keyCode === 32) {
        switch (e.target.id) {
            case "isLoadAllLinksEnabled":
                App.settingsApp.toggleLoadAllLinksSettings();
                break;
            case "togglereadermode":
                App.settingsApp.togglereadermode();
                break;
            case "toggleOperationMode":
                App.settingsApp.toggleOperationMode();
                break;
            case "toggleLogging":
                App.settingsApp.toggleLogging();
                break;
        }
    }
    App.settingsApp.getRules();
};

App.settingsApp.listenForClicks = function(e) {
    App.settingsApp.incExcmsg = null;

    switch (e.target.id) {
        case "addtoExclude":
            let el2 = document.querySelector("#newExcludesite");
            App.settingsApp.addtoExclude(el2.value);
            el2.value = "";
            document.getElementById("addtoExclude").disabled = true;
            break;
        case "removefromExclude":
            let el3 = document.querySelector("#newIncludeSite");
            App.settingsApp.removefromExclude(el3.value);
            el3.value = "";
            document.getElementById("removefromExclude").disabled = true;
            break;
        case "isLoadAllLinksEnabled":
            App.settingsApp.toggleLoadAllLinksSettings();
            break;
        case "togglereadermode":
            App.settingsApp.togglereadermode();
            break;
        case "toggleOperationMode":
            App.settingsApp.toggleOperationMode();
            break;
        case "showExampleOpenall":
            document.getElementById("showExampleOpen").style.display = "";
            document.getElementById("showExampleOpenall").style.display =
                "none";
            break;
        case "toggleLogging":
            App.settingsApp.toggleLogging();
            break;
        case "toggleResetwarn":
            App.settingsApp.toggleResetwarn();
            document.getElementById("toggleResetwarn").style.display = "none";
            break;
        case "cancelresets":
            App.settingsApp.toggleResetwarn();
            document.getElementById("showresetConfirmation").style.display =
                "none";
            document.getElementById("toggleResetwarn").style.display = "";
            break;
        case "doFactoryReset":
            App.settingsApp.doFactoryReset();
            break;
        case "showExcludesButton":
            let el = document.getElementById("showExcludes");
            el.style.display = "";
            el.previousElementSibling.style.display = "none";
            break;
        case "clearTemps":
            App.settingsApp.clearTemps();
            break;
        case "incExcmsg":
            let el1 = document.getElementById("incExcmsg");
            el1.style.display = "none";
            break;
        case "message-box":
            document.getElementById("message-box").style.display = "none";
            break;
        case "fileInput":
            App.settingsApp.importRedirects();
            break;
        case "openHelp":
            App.settingsApp.openHelp();
            break;
        case "clearAllHostnamesFromExcludes":
            App.settingsApp.clearAllHostnamesFromExcludes();
            break;
        case "clearAllStats":
            App.settingsApp.clearAllStats();
            break;
        case "clearAllFilters":
            App.settingsApp.clearAllFilters();
            break;
        case "clearAllFileExtensions":
            App.settingsApp.clearAllFileExtensions();
            break;
        case "addtofiltersBtn":
            let e4 = document.querySelector("#addfilter");
            App.settingsApp.addtofilters(e4.value);
            e4.value = "";
            document.getElementById("addtofiltersBtn").disabled = true;
            break;
        case "removefromfiltersBtn":
            let e5 = document.querySelector("#toRemoveFilter");
            App.settingsApp.removefromfilters(e5.value);
            e5.value = "";
            document.getElementById("removefromfiltersBtn").disabled = true;
            break;
        case "addtoExtensions":
            let e6 = document.querySelector("#newExtension");
            App.settingsApp.addtoExtensions(e6.value);
            e6.value = "";
            document.getElementById("addtoExtensions").disabled = true;
            break;

        case "removefromExtensions":
            let e7 = document.querySelector("#removeExtension");
            App.settingsApp.removefromExtensions(e7.value);
            e7.value = "";
            document.getElementById("removefromExtensions").disabled = true;
            break;
    }
};


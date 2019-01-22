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

/* globals PopupApp */

var DOM = {};
DOM.popupDOM = {};

DOM.popupDOM.updateDOM = () => {
  //logging($s);
  if (PopupApp.disabled) {
    document.querySelector("#showdisablebutton").style.display = "none";
    document.querySelector("#showenablebutton").style.display = "";
  } else {
    document.querySelector("#showdisablebutton").style.display = "";
    document.querySelector("#showenablebutton").style.display = "none";
  }

  if (
    !PopupApp.disabled &&
    PopupApp.settingsInAboutConfig &&
    !PopupApp.webextpagesExcluded
  ) {
    document.querySelector("#saveButtonArea").style.display = "";
    document.querySelector(
      "#savePagebutton"
    ).textContent = !PopupApp.issiteexcluded
      ? "Save this page now"
      : "Save this page again";
  } else {
    document.querySelector("#saveButtonArea").style.display = "none";
  }

  if (
    PopupApp.issiteexcluded &&
    !PopupApp.disabled &&
    !PopupApp.webextpagesExcluded &&
    PopupApp.settingsInAboutConfig &&
    !PopupApp.hideIncludebutton
  ) {
    document.querySelector("#firstArchivedbuttonArea").style.display = "";
  } else {
    document.querySelector("#firstArchivedbuttonArea").style.display = "none";
  }

  if (
    !PopupApp.isMobilefirefox &&
    PopupApp.issiteexcluded &&
    !PopupApp.disabled &&
    !PopupApp.webextpagesExcluded &&
    PopupApp.SettingsInAboutConfig
  ) {
    document.querySelector("#SavePagetoPDFArea").style.display = "";
  } else {
    document.querySelector("#SavePagetoPDFArea").style.display = "none";
  }

  document.querySelector(
    "#settingsbuttonarea"
  ).style.display = !PopupApp.settingspagehide ? "" : "none";

  if (
    !PopupApp.disabled &&
    !PopupApp.settingspagehide &&
    PopupApp.domain &&
    PopupApp.domain !== "chrome" &&
    (PopupApp.isDomainInExcludesList ||
      PopupApp.isDomainTempExcluded ||
      PopupApp.isDomainTempIncluded)
  ) {
    document.querySelector("#alertArea").style.display = "";
    let alertAreaTempexcludes = document.querySelector("#inTempexcludesAlert");
    let alertAreaExcludes = document.querySelector("#inExcludesAlert");

    let alertAreaTempIncludes = document.querySelector("#inTempIncludesAlert");
    if (PopupApp.isDomainInExcludesList) {
      alertAreaExcludes.style.display = "";
      alertAreaExcludes.textContent = PopupApp.domain + " is in Excludes List";
      alertAreaTempIncludes.style.display = "none";
      alertAreaTempexcludes.style.display = "none";
    }

    if (PopupApp.isDomainTempExcluded) {
      alertAreaTempexcludes.style.display = "";
      alertAreaTempexcludes.textContent =
        PopupApp.domain + " is temporarily Excluded";
      alertAreaTempIncludes.style.display = "none";
      alertAreaExcludes.style.display = "none";
    }

    if (PopupApp.isDomainTempIncluded) {
      alertAreaTempIncludes.style.display = "";
      alertAreaTempIncludes.textContent =
        PopupApp.domain + " is temporarily Included";
      alertAreaExcludes.style.display = "none";
      alertAreaTempexcludes.style.display = "none";
    }
  } else {
    let alertarea = document.querySelector("#alertArea");
    alertarea.style.display = "none";
  }

  if (
    PopupApp.showRefreshAlert &&
    !PopupApp.settingspagehide &&
    !PopupApp.webextpagesExcluded &&
    !PopupApp.disabled &&
    !!PopupApp.domain &&
    !PopupApp.isDomainInExcludesList &&
    !PopupApp.isDomainTempExcluded &&
    !PopupApp.issiteexcluded &&
    PopupApp.domain !== "chrome"
  ) {
    document.querySelector("#clicktoRefreshArea").style.display = "";
  } else {
    document.querySelector("#clicktoRefreshArea").style.display = "none";
  }

  if (
    !PopupApp.issiteexcluded &&
    !PopupApp.disabled &&
    !PopupApp.webextpagesExcluded &&
    PopupApp.SettingsInAboutConfig &&
    !PopupApp.hideIncludebutton &&
    !!PopupApp.domain &&
    PopupApp.domain !== "chrome" &&
    !PopupApp.isDomainTempExcluded
  ) {
    document.querySelector("#includeDomainArea").style.display = "";
    document.querySelector("#includeButton").textContent =
      "Include " + PopupApp.domain;
    document.querySelector("#tempIncludeArea").style.display = "";
    document.querySelector("#tempIncludeButton").textContent =
      "Temporarily Include " + PopupApp.domain;
  } else {
    document.querySelector("#includeDomainArea").style.display = "none";
    document.querySelector("#tempIncludeArea").style.display = "none";
  }

  if (
    !PopupApp.issiteexcluded &&
    !PopupApp.disabled &&
    !PopupApp.webextpagesExcluded &&
    PopupApp.SettingsInAboutConfig &&
    !PopupApp.hideIncludebutton &&
    !!PopupApp.domain &&
    PopupApp.isDomainTempExcluded
  ) {
    document.querySelector("#clearTempExcludeArea").style.display = "";
    document.querySelector("#clearTempExcludeButton").textContent =
      "Clear " + PopupApp.domain + " from Temporary Excludes";
    document.querySelector("#applyTempToPermExcludes").style.display = "";
    document.querySelector("#applyTempToPermExcludesButton").textContent =
      "Add " + PopupApp.domain + " to Excludes List";
  } else {
    document.querySelector("#clearTempExcludeArea").style.display = "none";
    document.querySelector("#applyTempToPermExcludes").style.display = "none";
  }

  if (
    PopupApp.issiteexcluded &&
    !PopupApp.disabled &&
    !PopupApp.webextpagesExcluded &&
    PopupApp.SettingsInAboutConfig &&
    !PopupApp.hideIncludebutton &&
    !!PopupApp.domain &&
    PopupApp.isDomainTempIncluded
  ) {
    document.querySelector("#clearFromTempIncludesArea").style.display = "";
    document.querySelector("#clearFromTempIncludesButton").textContent =
      "Clear " + PopupApp.domain + " from Temporary Includes";
    document.querySelector("#applysitetoPermanentIncludesArea").style.display =
      "";
    document.querySelector("#applysitetoPermanentIncludesButton").textContent =
      "Include " + PopupApp.domain + " from now";
  } else {
    document.querySelector("#clearFromTempIncludesArea").style.display = "none";
    document.querySelector("#applysitetoPermanentIncludesArea").style.display =
      "none";
  }

  if (
    PopupApp.issiteexcluded &&
    !PopupApp.disabled &&
    !PopupApp.webextpagesExcluded &&
    PopupApp.SettingsInAboutConfig &&
    !PopupApp.hideIncludebutton &&
    !!PopupApp.domain &&
    !PopupApp.isDomainTempIncluded
  ) {
    document.querySelector("#tempExcludeArea").style.display = "";
    document.querySelector("#tempExcludebutton").textContent =
      "Temporarily Exclude " + PopupApp.domain;
    document.querySelector("#MainExcludesButtonArea").style.display = "";
    document.querySelector("#MainExcludesButton").textContent =
      "Add " + PopupApp.domain + " to Excludes List";
  } else {
    document.querySelector("#tempExcludeArea").style.display = "none";
    document.querySelector("#MainExcludesButtonArea").style.display = "none";
  }

  if (
    PopupApp.isLoadAllLinksEnabled &&
    PopupApp.issiteexcluded &&
    !PopupApp.disabled &&
    !PopupApp.webextpagesExcluded &&
    PopupApp.SettingsInAboutConfig &&
    !!PopupApp.domain
  ) {
    document.querySelector("#openAllLinksArea").style.display = "";
    document.querySelector("#openAllLinksButton").disabled = true;
    document
      .querySelector("#selectorInput")
      .addEventListener("input", DOM.shouldEnableButton);
  } else {
    document.querySelector("#openAllLinksArea").style.display = "none";
  }
  document.querySelector("#versiondisplay").textContent = !!PopupApp.appVersion
    ? "Version " + PopupApp.appVersion
    : "Version 1.1";

  if (!!document.getElementsByClassName("hideBody")[0]) {
    document.getElementsByClassName("hideBody")[0].classList = "";
  }
};

DOM.popupDOM.toggleStats = toshow => {
  let el = document.querySelector("#showstats");
  if (!!el) {
    if (toshow) {
      el.style.display = "none";
    } else {
      el.style.display = "";

      if (PopupApp.loadcount > 0) {
        let loadcount = document.querySelector("#loadcount");
        loadcount.style.display = "";
        loadcount.textContent = "Pages redirected : " + PopupApp.loadcount;
      }

      if (PopupApp.savecount > 0) {
        let count = document.querySelector("#savecount");
        count.style.display = "";
        count.textContent = "Pages saved to WM : " + PopupApp.savecount;
      }
      if (PopupApp.loadcount > 0 && PopupApp.savecount > 0) {
        let count = document.querySelector("#totalcount");
        count.style.display = "";
        count.textContent =
          "Total WM visits: " + `${PopupApp.savecount + PopupApp.loadcount}`;

        if (PopupApp.loadcount !== PopupApp.savecount) {
          let count = document.querySelector("#ratiocount");
          count.style.display = "";
          count.textContent =
            "Saved/Redirected: " +
            `${((PopupApp.savecount / PopupApp.loadcount) * 100).toFixed(1)}` +
            "%";
        }
      }
      if (PopupApp.loadcount === 0 && PopupApp.savecount === 0) {
        document.querySelector("#welcomecount").style.display = "";
        el.style.display = "";
        document.querySelector("#totalcount").style.display = "none";
        document.querySelector("#ratiocount").style.display = "none";
        document.querySelector("#savecount").style.display = "none";
        document.querySelector("#loadcount").style.display = "none";
      }
    }
  }
};

DOM.popupDOM.keyUpListener = function(e) {
  if (e.keyCode === 13 || e.key === "Enter") {
    switch (e.target.id) {
      case "selectorInput":
        PopupApp.loadAll1pLinks(e.target.value);

        e.target.value = "";
        e.target.parentElement.disabled = true;
        break;
    }
  }
};

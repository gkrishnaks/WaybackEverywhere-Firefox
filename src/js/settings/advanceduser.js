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

App.settingsApp.clearAllHostnamesFromExcludes = function() {
	App.settingsApp.storage.get(
		{
			redirects: []
		},
		function(obj) {
			let redirectslist = obj.redirects;
			redirectslist[0].excludePattern = "*web.archive.org*|*archive.org*";
			App.settingsApp.storage.set({ redirects: redirectslist });
			App.settingsApp.ReadableExcludePattern =
				"web.archive.org, archive.org";
			App.settingsApp.getRules();
			App.settingsApp.showMessage(
				"All excludes are cleared except archive.org which is mandatory exclude for addon functionality",
				true
			);
			//App.settingsApp.getRules();;
		}
	);
};

App.settingsApp.clearAllStats = function() {
	var counts = {
		archivedPageLoadsCount: 0,
		waybackSavescount: 0
	};
	App.settingsApp.storage.set({ counts: counts }, function() {
		App.settingsApp.showMessage(
			"All Stats are reset to zero successfully",
			true
		);
	});
};

App.settingsApp.clearAllFilters = () => {
	let filters = [];
	App.settingsApp.storage.set({ filters: filters }, function() {
		App.settingsApp.filters = [];
		App.settingsApp.showMessage(
			"All Filters (which are used to clear URLs of Tracking IDs) are reset to zero successfully",
			true
		);
		App.settingsApp.getRules();
	});
};

App.settingsApp.addtofilters = newFilter => {
	let filterNew = [];
	if (App.settingsApp.filters.length === 0) {
		filterNew.push(newFilter);
	}

	if (App.settingsApp.filters.indexOf(newFilter) > -1) {
		App.settingsApp.showMessage(newFilter + " is already there in filters");
		return;
	}
	if (App.settingsApp.filters.indexOf(newFilter) < 0) {
		filterNew = App.settingsApp.filters; // Created new variable so that we can update App.settingsApp.filters after save success
		filterNew.push(newFilter);
		App.settingsApp.storage.set(
			{
				filters: filterNew
			},
			function(obj) {
				App.settingsApp.filters = filterNew;
				App.settingsApp.newFilter = "";
				// console.log(App.settingsApp.filters);
				App.settingsApp.getRules();
				App.settingsApp.showMessage(
					newFilter + " is added to filters",
					true
				);
			}
		);
	}
};

App.settingsApp.toRemoveFilter = "";

App.settingsApp.removefromfilters = toRemoveFilter => {
	if (toRemoveFilter.length > 0) {
		let filter = App.settingsApp.filters;
		if (filter.length > 0) {
			let index = filter.indexOf(toRemoveFilter);
			if (index > -1) {
				filter.splice(index, 1);
				App.settingsApp.storage.set({ filters: filter }, function(obj) {
					App.settingsApp.filters = filter;
					App.settingsApp.toRemoveFilter = "";
					App.settingsApp.getRules();
					App.settingsApp.showMessage(
						toRemoveFilter + " is removed from Filters",
						true
					);
				});
			} else {
				App.settingsApp.showMessage(
					toRemoveFilter + " is already not there in Filters",
					false
				);
			}
		} else {
			App.settingsApp.showMessage("Filter list is empty..!", false);
		}
	}
};

App.settingsApp.addtoExtensions = function(newExtension) {
	let msg = "";
	if (newExtension.indexOf(".") < 0) {
		newExtension = "." + newExtension;
	}
	if (newExtension.lastIndexOf(".") !== 0) {
		msg = "Extension cannot end with a dot/period, try again";
		App.settingsApp.showMessage(msg, false);
		//No need to throw any error message as it's going to be accessed from advanceduser page only
		return;
	}
	if (App.settingsApp.commonExtensions.indexOf(newExtension) === -1) {
		let extensions = App.settingsApp.commonExtensions;
		extensions.push(newExtension);
		App.settingsApp.storage.set(
			{
				commonExtensions: extensions
			},
			function() {
				App.settingsApp.commonExtensions = extensions;
				App.settingsApp.newExtension = "";
				App.settingsApp.getRules();
				msg = newExtension + " is now available in excluded extensions";
				App.settingsApp.showMessage(msg, true);
			}
		);
	} else {
		msg = newExtension + " is already there in Excluded Extensions below";
		App.settingsApp.showMessage(msg, false);
	}
};

App.settingsApp.removefromExtensions = function(removeExtension) {
	if (removeExtension.indexOf(".") < 0) {
		removeExtension = "." + removeExtension;
	}
	let msg = "";
	if (removeExtension.lastIndexOf(".") !== 0) {
		msg = "Extension cannot end with a dot/period, try again";
		App.settingsApp.showMessage(msg, false);

		//No need to throw any error message as it's going to be accessed from advanceduser page only
		return;
	}
	if (
		App.settingsApp.commonExtensions.length > 0 &&
		App.settingsApp.commonExtensions.indexOf(removeExtension) > -1
	) {
		let index = App.settingsApp.commonExtensions.indexOf(removeExtension);
		let extensions = App.settingsApp.commonExtensions;
		if (index > -1) {
			extensions.splice(index, 1);
			App.settingsApp.storage.set(
				{
					commonExtensions: extensions
				},
				function() {
					App.settingsApp.commonExtensions = extensions;
					App.settingsApp.removeExtension = "";
					App.settingsApp.getRules();
					msg =
						removeExtension +
						" is no longer available in excluded extensions";
					App.settingsApp.showMessage(msg, true);
				}
			);
		}
	} else {
		msg =
			removeExtension +
			" is already not there in Excluded Extensions below";
		App.settingsApp.showMessage(msg, false);
	}
};

App.settingsApp.clearAllFileExtensions = function() {
	if (App.settingsApp.commonExtensions.length > 0) {
		let k = [];
		App.settingsApp.storage.set(
			{
				commonExtensions: k
			},
			function() {
				App.settingsApp.commonExtensions = k;
				//App.settingsApp.getRules();;
				App.settingsApp.showMessage(
					"All File Extensions (which are used for on-the-fly exclude of download links)  are reset to zero successfully",
					true
				);
				App.settingsApp.getRules();
			}
		);
	}
};

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

var $s = window.$s || {};
$s.settingsApp = window.$s.settingsApp || {};

$s.settingsApp.clearAllHostnamesFromExcludes = function() {
	$s.settingsApp.storage.get(
		{
			redirects: []
		},
		function(obj) {
			let redirectslist = obj.redirects;
			redirectslist[0].excludePattern = "*web.archive.org*|*archive.org*";
			$s.settingsApp.storage.set({ redirects: redirectslist });
			$s.settingsApp.ReadableExcludePattern =
				"web.archive.org, archive.org";
			$s.settingsApp.getRules();
			$s.settingsApp.showMessage(
				"All excludes are cleared except archive.org which is mandatory exclude for addon functionality",
				true
			);
			//$s.settingsApp.getRules();;
		}
	);
};

$s.settingsApp.clearAllStats = function() {
	var counts = {
		archivedPageLoadsCount: 0,
		waybackSavescount: 0
	};
	$s.settingsApp.storage.set({ counts: counts }, function() {
		$s.settingsApp.showMessage(
			"All Stats are reset to zero successfully",
			true
		);
	});
};

$s.settingsApp.clearAllFilters = () => {
	let filters = [];
	$s.settingsApp.storage.set({ filters: filters }, function() {
		$s.settingsApp.filters = [];
		$s.settingsApp.showMessage(
			"All Filters (which are used to clear URLs of Tracking IDs) are reset to zero successfully",
			true
		);
		$s.settingsApp.getRules();
	});
};

$s.settingsApp.addtofilters = newFilter => {
	let filterNew = [];
	if ($s.settingsApp.filters.length === 0) {
		filterNew.push(newFilter);
	}

	if ($s.settingsApp.filters.indexOf(newFilter) > -1) {
		$s.settingsApp.showMessage(newFilter + " is already there in filters");
		return;
	}
	if ($s.settingsApp.filters.indexOf(newFilter) < 0) {
		filterNew = $s.settingsApp.filters; // Created new variable so that we can update $s.settingsApp.filters after save success
		filterNew.push(newFilter);
		$s.settingsApp.storage.set(
			{
				filters: filterNew
			},
			function(obj) {
				$s.settingsApp.filters = filterNew;
				$s.settingsApp.newFilter = "";
				// console.log($s.settingsApp.filters);
				$s.settingsApp.getRules();
				$s.settingsApp.showMessage(
					newFilter + " is added to filters",
					true
				);
			}
		);
	}
};

$s.settingsApp.toRemoveFilter = "";

$s.settingsApp.removefromfilters = toRemoveFilter => {
	if (toRemoveFilter.length > 0) {
		let filter = $s.settingsApp.filters;
		if (filter.length > 0) {
			let index = filter.indexOf(toRemoveFilter);
			if (index > -1) {
				filter.splice(index, 1);
				$s.settingsApp.storage.set({ filters: filter }, function(obj) {
					$s.settingsApp.filters = filter;
					$s.settingsApp.toRemoveFilter = "";
					$s.settingsApp.getRules();
					$s.settingsApp.showMessage(
						toRemoveFilter + " is removed from Filters",
						true
					);
				});
			} else {
				$s.settingsApp.showMessage(
					toRemoveFilter + " is already not there in Filters",
					false
				);
			}
		} else {
			$s.settingsApp.showMessage("Filter list is empty..!", false);
		}
	}
};

$s.settingsApp.addtoExtensions = function(newExtension) {
	let msg = "";
	if (newExtension.indexOf(".") < 0) {
		newExtension = "." + newExtension;
	}
	if (newExtension.lastIndexOf(".") !== 0) {
		msg = "Extension cannot end with a dot/period, try again";
		$s.settingsApp.showMessage(msg, false);
		//No need to throw any error message as it's going to be accessed from advanceduser page only
		return;
	}
	if ($s.settingsApp.commonExtensions.indexOf(newExtension) === -1) {
		let extensions = $s.settingsApp.commonExtensions;
		extensions.push(newExtension);
		$s.settingsApp.storage.set(
			{
				commonExtensions: extensions
			},
			function() {
				$s.settingsApp.commonExtensions = extensions;
				$s.settingsApp.newExtension = "";
				$s.settingsApp.getRules();
				msg = newExtension + " is now available in excluded extensions";
				$s.settingsApp.showMessage(msg, true);
			}
		);
	} else {
		msg = newExtension + " is already there in Excluded Extensions below";
		$s.settingsApp.showMessage(msg, false);
	}
};

$s.settingsApp.removefromExtensions = function(removeExtension) {
	if (removeExtension.indexOf(".") < 0) {
		removeExtension = "." + removeExtension;
	}
	let msg = "";
	if (removeExtension.lastIndexOf(".") !== 0) {
		msg = "Extension cannot end with a dot/period, try again";
		$s.settingsApp.showMessage(msg, false);

		//No need to throw any error message as it's going to be accessed from advanceduser page only
		return;
	}
	if (
		$s.settingsApp.commonExtensions.length > 0 &&
		$s.settingsApp.commonExtensions.indexOf(removeExtension) > -1
	) {
		let index = $s.settingsApp.commonExtensions.indexOf(removeExtension);
		let extensions = $s.settingsApp.commonExtensions;
		if (index > -1) {
			extensions.splice(index, 1);
			$s.settingsApp.storage.set(
				{
					commonExtensions: extensions
				},
				function() {
					$s.settingsApp.commonExtensions = extensions;
					$s.settingsApp.removeExtension = "";
					$s.settingsApp.getRules();
					msg =
						removeExtension +
						" is no longer available in excluded extensions";
					$s.settingsApp.showMessage(msg, true);
				}
			);
		}
	} else {
		msg =
			removeExtension +
			" is already not there in Excluded Extensions below";
		$s.settingsApp.showMessage(msg, false);
	}
};

$s.settingsApp.clearAllFileExtensions = function() {
	if ($s.settingsApp.commonExtensions.length > 0) {
		let k = [];
		$s.settingsApp.storage.set(
			{
				commonExtensions: k
			},
			function() {
				$s.settingsApp.commonExtensions = k;
				//$s.settingsApp.getRules();;
				$s.settingsApp.showMessage(
					"All File Extensions (which are used for on-the-fly exclude of download links)  are reset to zero successfully",
					true
				);
				$s.settingsApp.getRules();
			}
		);
	}
};

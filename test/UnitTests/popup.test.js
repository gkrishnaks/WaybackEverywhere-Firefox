describe("PopupApp", function() {
  beforeEach(angular.mock.module("popupApp"));

  var $controller;

  beforeEach(
    angular.mock.inject(function(_$controller_) {
      $controller = _$controller_;
    })
  );

  describe("Check variable initializations", function() {
    var $scope = {};
    var controller;
    beforeEach(function() {
      chrome.flush();
      $scope = {};
      controller = $controller("PopupCtrl", {
        $scope: $scope
      });
    });

    it("variables need to be intialized", function() {
      expect($scope.logging).to.eql(false);
      expect($scope.domain).to.eql("");
      expect($scope.tempIncludes).to.eql([]);
      expect($scope.tempExcludes).to.eql([]);

      expect($scope.isDomainTempIncluded).to.eql(false);
      expect($scope.isDomainTempExcluded).to.eql(false);
      expect($scope.isDomainInExcludesList).to.eql(false);
      expect($scope.showRefreshAlert).to.eql(false);
    });
    /*
		it("provide a mock response for self calling function getCurrentUrl and updateDetails", function() {
			$scope.$apply = function() {};
			var tabs = [{ id: 1, url: "https://gnu.org" }];
			chrome.tabs.query.yields(tabs);

			var response = {
				logstatus: false,
				counts: JSON.stringify({
					archivedPageLoadsCount: 10,
					waybackSavescount: 40
				}),
				appDisabled: false,
				tempExcludes: [],
				tempIncludes: [],
				//excludesList: excludesList,
				domainStatus: "domainTempExcluded",
				isLoadAllLinksEnabled: false,
				justSaved: {},
				filters: [],
				appVersion: "1.0.0",
				commonExtensions: []
			};
			chrome.runtime.sendMessage.yields(response);
			$scope.getCurrentUrlandUpdateDetails();

			expect($scope.isDomainTempExcluded).to.eql(true);
		}); */
  });

  describe("sendExcludeMessage helper function should send message to BG script as received", function() {
    var $scope = {};
    var controller;
    beforeEach(function() {
      chrome.flush();
      $scope = {};
      controller = $controller("PopupCtrl", {
        $scope: $scope
      });
    });
    it("sendExcludeMessage helper function should send message to BG script as received", function() {
      var responseMessage = {
        message: "excluded"
      };
      chrome.runtime.sendMessage.yields(responseMessage);

      $scope.domain = "gnu.org";
      $scope.sendExcludeMessage("AddtoExcludesListfromJunit");
      assert.ok(chrome.runtime.sendMessage.calledOnce);
      assert.ok(
        chrome.runtime.sendMessage.calledWith({
          type: "excludethisSite",
          subtype: "fromPopup",
          url: undefined,
          tabid: undefined,
          category: "AddtoExcludesListfromJunit"
        })
      );
      chrome.flush();
    });
  });

  describe("should send exclude Message correctly to Background script", function() {
    afterEach(function() {
      chrome.flush();
      //delete global.chrome;
    });
    beforeEach(function() {
      chrome.flush();
      $scope = {};
      controller = $controller("PopupCtrl", {
        $scope: $scope
      });
    });
    var controller;
    var $scope = {};
    it("addSitetoExclude should pass category as AddtoExcludesList", function() {
      $scope.domain = "gnu.org";
      assert.ok(chrome.runtime.sendMessage.notCalled);

      $scope.addSitetoExclude();

      assert.ok(
        chrome.runtime.sendMessage.calledWith({
          type: "excludethisSite",
          subtype: "fromPopup",
          url: undefined,
          tabid: undefined,
          category: "AddtoExcludesList"
        })
      );
    });

    it("addSitetoExclude should pass category as AddtoTempExcludesList", function() {
      $scope.domain = "gnu.org";
      assert.ok(chrome.runtime.sendMessage.notCalled);

      $scope.addSitetotempExclude();

      assert.ok(
        chrome.runtime.sendMessage.withArgs({
          type: "excludethisSite",
          subtype: "fromPopup",
          url: undefined,
          tabid: undefined,
          category: "AddtoTempExcludesList"
        }).calledOnce
      );
    });
  });

  describe("sendExcludeMessage should handle invalid cases and not send to background script", function() {
    var $scope;
    var controller;
    beforeEach(function() {
      chrome.flush();
      $scope = {};
      controller = $controller("PopupCtrl", {
        $scope: $scope
      });
    });

    afterEach(function() {
      chrome.flush();
      //delete global.chrome;
    });

    it("sendExcludeMessage should not send Empty domain to background script", function() {
      assert.ok(chrome.runtime.sendMessage.notCalled);
      $scope.domain = "";
      $scope.sendExcludeMessage("AddtoExcludesListfromJunit");
      assert.ok(chrome.runtime.sendMessage.notCalled);
    });

    it("sendExcludeMessage should not web.archive.org Empty domain to background script", function() {
      $scope.domain = "web.archive.org";
      $scope.sendExcludeMessage("AddtoExcludesListfromJunit");
      assert.ok(chrome.runtime.sendMessage.notCalled);
    });
  });

  describe("Check toggle functions", function() {
    var $scope;
    var controller;
    beforeEach(function() {
      chrome.flush();
      $scope = {};
      controller = $controller("PopupCtrl", {
        $scope: $scope
      });
    });

    afterEach(function() {
      chrome.flush();
      //delete global.chrome;
    });

    it("showStats should toggle  stats from false/ true", function() {
      $scope.showstat = false;
      $scope.showstats();
      expect($scope.showstat).to.eql(true);
      $scope.showstats();
      expect($scope.showstat).to.eql(false);
    });

    it("toggledisabled should toggle  disable from false/ true", function() {
      $scope.disabled = false;
      $scope.toggleDisabled();
      expect($scope.disabled).to.eql(true);
      $scope.toggleDisabled();
      expect($scope.disabled).to.eql(false);
    });

    it("toggledisabled should save correct value to storage", function() {
      $scope.disabled = false;
      $scope.toggleDisabled();
      var local = { disabled: true };
      expect($scope.disabled).to.eql(true);
      assert.ok(chrome.storage.local.set.calledWith(local));
      chrome.flush();

      $scope.toggleDisabled();
      local.disabled = false;
      expect($scope.disabled).to.eql(false);
      assert.ok(chrome.storage.local.set.calledWith(local));
    });
  });

  describe("Save this page function should send correct message to background script", function() {
    afterEach(function() {
      chrome.flush();
      //delete global.chrome;
    });
    var $scope = {};
    var controller;
    beforeEach(function() {
      chrome.flush();
      $scope = {};
      controller = $controller("PopupCtrl", {
        $scope: $scope
      });
    });

    it("should send Save this page message to background script", function() {
      var responseMessage = {
        message: "page saved"
      };
      chrome.runtime.sendMessage.yields(responseMessage);
      $scope.savePage();

      assert.ok(
        chrome.runtime.sendMessage.withArgs({
          type: "savetoWM",
          subtype: "fromPopup",
          url: undefined,
          tabid: undefined
        }).calledOnce
      );
    });
  });

  describe("loadAll1pLinks functionality should work as expected", function() {
    afterEach(function() {
      chrome.flush();
    });
    var $scope = {};
    var controller;
    beforeEach(function() {
      chrome.flush();
      $scope = {};
      controller = $controller("PopupCtrl", {
        $scope: $scope
      });
    });

    it("loadAll1pLinks should send message to tab, then background script", function() {
      var data = { data: "some urls" };
      chrome.tabs.sendMessage.yields({ data });
      $scope.loadAll1pLinks("pathSelector");
      assert.ok(
        chrome.tabs.sendMessage.calledWith(undefined, {
          type: "getAllFirstPartylinks"
        })
      );

      assert.ok(
        chrome.runtime.sendMessage.calledWith({
          type: "openAllLinks",
          subtype: "fromPopup",
          data: data,
          tabid: undefined,
          selector: "pathSelector"
        })
      );
    });

    it("loadAll1pLinks should not proceed if selector is empty", function() {
      var data = { data: "some urls" };
      chrome.tabs.sendMessage.yields({ data });
      $scope.loadAll1pLinks("");
      assert.ok(chrome.tabs.sendMessage.notCalled);
      assert.ok(chrome.runtime.sendMessage.notCalled);
    });

    it("loadAll1pLinks should not proceed if selector is placeholder", function() {
      var data = { data: "some urls" };
      chrome.tabs.sendMessage.yields({ data });
      $scope.loadAll1pLinks("Enter a selector");
      assert.ok(chrome.tabs.sendMessage.notCalled);
      assert.ok(chrome.runtime.sendMessage.notCalled);
    });
  });

  describe("Apply temporary changes to permanent should send correct message to background script", function() {
    afterEach(function() {
      chrome.flush();
      redirectsInitial = [
        {
          description: "Wayback Everywhere Rules",
          exampleUrl: "http://example.org",
          exampleResult: "https://web.archive.org/web/2/http://example.org",
          error: null,
          includePattern: "*",
          excludePattern:
            "*web.archive.org*|*archive.org*|*gnu.org*|*raw.githubusercontent.com*|*youtube.com*|*github.com*|*imgur.com*|*reddit.com*|*archive.is*|*quora.com*|*techcrunch.com*|*amazon.in*|*amazon.com*"
        }
      ];
    });

    var $scope = {};
    var controller;
    beforeEach(function() {
      chrome.flush();
      $scope = {};
      controller = $controller("PopupCtrl", {
        $scope: $scope
      });
    });

    it("Apply tempExclude to Permanent should send correct message to background script", function() {
      var responseMessage = {
        message: "Applid temporary changes to permanenet"
      };
      chrome.runtime.sendMessage.yields(responseMessage);
      $scope.domain = "gnu.org";
      $scope.applyTemptoPermanent("excludes");

      assert.ok(
        chrome.runtime.sendMessage.withArgs({
          type: "clearTemps",
          domain: "gnu.org",
          subtype: "fromPopup",
          url: undefined,
          tabid: undefined,
          toClear: "cleartempExcludes"
        }).calledOnce
      );
      var updateProperties = { active: true };
      assert.ok(chrome.tabs.update.calledOnce);
    });

    it("Apply tempInclude to Permanent should send correct message to background script", function() {
      var responseMessage = {
        message: "Applid temporary changes to permanenet"
      };
      var spy = sinon.spy($scope, "removeSitefromexclude");

      chrome.runtime.sendMessage
        .withArgs({
          type: "clearTemps",
          domain: "gnu.org",
          subtype: "fromPopup",
          url: undefined,
          tabid: undefined,
          toClear: "cleartempIncludes"
        })
        .yields(responseMessage);

      $scope.redirectslist = [];
      chrome.runtime.sendMessage
        .withArgs({
          type: "getredirects"
        })
        .yields({ redirects: redirectsInitial });

      $scope.domain = "gnu.org";
      $scope.applyTemptoPermanent("includes");

      spy.restore();
      redirectsInitial[0].excludePattern =
        "*web.archive.org*|*archive.org*|*raw.githubusercontent.com*|*youtube.com*|*github.com*|*imgur.com*|*reddit.com*|*archive.is*|*quora.com*|*techcrunch.com*|*amazon.in*|*amazon.com*";

      sinon.assert.calledWith(spy, true);

      assert.ok(
        chrome.runtime.sendMessage.withArgs({
          type: "clearTemps",
          domain: "gnu.org",
          subtype: "fromPopup",
          url: undefined,
          tabid: undefined,
          toClear: "cleartempIncludes"
        }).calledOnce
      );
      assert.ok(
        chrome.runtime.sendMessage.withArgs({
          type: "saveredirects",
          redirects: redirectsInitial
        }).calledOnce
      );
    });
  });

  describe("See First Archived version function should send correct message to background script", function() {
    afterEach(function() {
      chrome.flush();
      //delete global.chrome;
    });
    var $scope = {};
    var controller;
    beforeEach(function() {
      chrome.flush();
      $scope = {};
      controller = $controller("PopupCtrl", {
        $scope: $scope
      });
    });

    it("should send Save this page message to background script", function() {
      $scope.seefirstversion();

      assert.ok(
        chrome.runtime.sendMessage.withArgs({
          type: "seeFirstVersion",
          subtype: "fromPopup",
          url: undefined,
          tabid: undefined
        }).calledOnce
      );
    });
  });

  describe("removeSitefromexcludeTemp functionality", function() {
    afterEach(function() {
      chrome.flush();
      //delete global.chrome;
    });
    var $scope = {};
    var controller;
    beforeEach(function() {
      chrome.flush();
      $scope = {};
      controller = $controller("PopupCtrl", {
        $scope: $scope
      });
    });

    it("removeSitefromexcludeTemp should call removeSitefromexclude after saving temps ", function() {
      $scope.domain = "gnu.org";
      var getResponse = ["|*fsf.org*"];
      getResponse.push = function() {};
      chrome.storage.local.get.yields({ tempIncludes: getResponse });
      chrome.storage.local.set.yields([]);
      var stub = sinon.spy($scope, "removeSitefromexclude");

      $scope.removeSitefromexcludeTemp();
      stub.restore();
      //sinon.stub(Array.prototype, "push").returns(1);
      sinon.assert.calledOnce(stub);
      sinon.assert.calledWith(stub, false);
      assert.ok(chrome.storage.local.get.calledWith({ tempIncludes: [] }));
      assert.ok(
        chrome.storage.local.set.calledWith({
          tempIncludes: getResponse
        })
      );
      //assert(stub.withArgs(false).calledOnce);
    });

    it("removeSitefromexcludeTemp should do nothing if domain is empty ", function() {
      $scope.domain = "";
      var getResponse = ["|*fsf.org*"];
      getResponse.push = function() {};
      chrome.storage.local.get.yields({ tempIncludes: getResponse });
      chrome.storage.local.set.yields([]);
      var stub = sinon.spy($scope, "removeSitefromexclude");

      $scope.removeSitefromexcludeTemp();
      stub.restore();
      //sinon.stub(Array.prototype, "push").returns(1);
      sinon.assert.notCalled(stub);
      //sinon.assert.calledWith(stub, false);
      assert.ok(chrome.storage.local.get.notCalled);
      assert.ok(chrome.storage.local.set.notCalled);
      //assert(stub.withArgs(false).calledOnce);
    });

    it("removeSitefromexcludeTemp should do nothing if domain is web.archive.org ", function() {
      $scope.domain = "web.archive.org";
      var getResponse = ["|*fsf.org*"];
      getResponse.push = function() {};
      chrome.storage.local.get.yields({ tempIncludes: getResponse });
      chrome.storage.local.set.yields([]);
      var stub = sinon.spy($scope, "removeSitefromexclude");

      $scope.removeSitefromexcludeTemp();
      stub.restore();
      //sinon.stub(Array.prototype, "push").returns(1);
      sinon.assert.notCalled(stub);
      //sinon.assert.calledWith(stub, false);
      assert.ok(chrome.storage.local.get.notCalled);
      assert.ok(chrome.storage.local.set.notCalled);
      //assert(stub.withArgs(false).calledOnce);
    });
  });

  /* 	$scope.$apply = function() {};
			var tabs = [{ id: 1, url: "https://gnu.org" }];
			chrome.tabs.query.yields(tabs);
			$scope.getCurrentUrl1(); */

  describe("removeSitefromExclude (include) functionality should work as expected", function() {
    afterEach(function() {
      chrome.flush();
      //delete global.chrome;
    });
    var $scope = {};
    var controller;
    var redirectsInitial;
    var redirectsLater;
    beforeEach(function() {
      chrome.flush();
      $scope = {};
      controller = $controller("PopupCtrl", {
        $scope: $scope
      });

      $scope.domain = "github.com";
      redirectsInitial = [
        {
          description: "Wayback Everywhere Rules",
          exampleUrl: "http://example.org",
          exampleResult: "https://web.archive.org/web/2/http://example.org",
          error: null,
          includePattern: "*",
          excludePattern:
            "*web.archive.org*|*archive.org*|*raw.githubusercontent.com*|*youtube.com*|*github.com*|*imgur.com*|*reddit.com*|*archive.is*|*quora.com*|*techcrunch.com*|*amazon.in*|*amazon.com*"
        }
      ];

      redirectsLater = [
        {
          description: "Wayback Everywhere Rules",
          exampleUrl: "http://example.org",
          exampleResult: "https://web.archive.org/web/2/http://example.org",
          error: null,
          includePattern: "*",
          excludePattern:
            "*web.archive.org*|*archive.org*|*raw.githubusercontent.com*|*youtube.com*|*imgur.com*|*reddit.com*|*archive.is*|*quora.com*|*techcrunch.com*|*amazon.in*|*amazon.com*"
        }
      ];

      chrome.runtime.sendMessage
        .withArgs({
          type: "getredirects"
        })
        .yields({ redirects: redirectsInitial });

      chrome.runtime.sendMessage
        .withArgs({ type: "saveredirects", redirects: redirectsLater })
        .yields("saved redirects");
    });

    it("removeSitefromexclude with false should remove site from exclude and save to storage as expected", function() {
      $scope.removeSitefromexclude(false);

      assert.ok(chrome.runtime.sendMessage.calledTwice);
      assert.ok(
        chrome.runtime.sendMessage.calledWith({
          type: "getredirects"
        })
      );
      assert.ok(
        chrome.runtime.sendMessage.calledWith({
          type: "saveredirects",
          redirects: redirectsLater
        })
      );
      var obj = {
        active: true,
        url: "https://web.archive.org/web/2/undefined"
      };
      assert.ok(chrome.tabs.update.withArgs(undefined, obj).calledOnce);
    });

    it("removeSitefromexclude with true should remove site from exclude and save to storage as expected", function() {
      chrome.runtime.sendMessage
        .withArgs({
          type: "getredirects"
        })
        .yields({ redirects: redirectsInitial });

      chrome.runtime.sendMessage
        .withArgs({ type: "saveredirects", redirects: redirectsLater })
        .yields("saved redirects");

      $scope.removeSitefromexclude(true);

      assert.ok(chrome.runtime.sendMessage.calledTwice);
      assert.ok(
        chrome.runtime.sendMessage.calledWith({
          type: "getredirects"
        })
      );
      assert.ok(
        chrome.runtime.sendMessage.calledWith({
          type: "saveredirects",
          redirects: redirectsLater
        })
      );
      var obj = { active: true };
      assert.ok(chrome.tabs.update.withArgs(undefined, obj).calledOnce);
    });

    it("removeSitefromexclude should do nothing if domain is empty", function() {
      $scope.domain = "";
      chrome.runtime.sendMessage
        .withArgs({
          type: "getredirects"
        })
        .yields({ redirects: redirectsInitial });

      chrome.runtime.sendMessage
        .withArgs({ type: "saveredirects", redirects: redirectsLater })
        .yields("saved redirects");
      $scope.removeSitefromexclude(false);
      assert.ok(chrome.runtime.sendMessage.notCalled);
    });

    it("removeSitefromexclude should do nothing if domain is web.archive.org", function() {
      $scope.domain = "web.archive.org";
      chrome.runtime.sendMessage
        .withArgs({
          type: "getredirects"
        })
        .yields({ redirects: redirectsInitial });

      chrome.runtime.sendMessage
        .withArgs({ type: "saveredirects", redirects: redirectsLater })
        .yields("saved redirects");
      $scope.removeSitefromexclude(false);
      assert.ok(chrome.runtime.sendMessage.notCalled);
    });
  });

  describe("Clear Temporary rules", function() {
    afterEach(function() {
      chrome.flush();
      //delete global.chrome;
    });
    var $scope = {};
    var controller;
    beforeEach(function() {
      chrome.flush();
      $scope = {};
      controller = $controller("PopupCtrl", {
        $scope: $scope
      });
    });
    it("Should be able to clear temporary include rule", function() {
      $scope.tempIncludes = ["|*gnu.org*", "|*example.org*"];
      $scope.domain = "example.org";
      var tempIncludesExpected = ["|*gnu.org*"];
      chrome.storage.local.set.yields("response");
      var stub = sinon.stub($scope, "addSitetoExclude");

      $scope.clearTempRules("tempIncludes");

      stub.restore();
      assert.ok(chrome.storage.local.set.calledOnce);
      assert.ok(
        chrome.storage.local.set.calledWith({
          tempIncludes: tempIncludesExpected
        })
      );
      sinon.assert.calledOnce(stub);
    });

    it("Should be able to clear temporary exclude rule", function() {
      $scope.tempExcludes = ["|*gnu.org*", "|*example.org*"];
      $scope.domain = "example.org";
      var tempExcludesExpected = ["|*gnu.org*"];
      chrome.storage.local.set.yields("response");
      var stub = sinon.stub($scope, "removeSitefromexclude");

      $scope.clearTempRules("tempExcludes");

      stub.restore();
      assert.ok(chrome.storage.local.set.calledOnce);
      assert.ok(
        chrome.storage.local.set.calledWith({
          tempExcludes: tempExcludesExpected
        })
      );
      sinon.assert.calledOnce(stub);
      sinon.assert.calledWithExactly(stub, false);
    });
  });
  // -- Add Describes above this line --
});

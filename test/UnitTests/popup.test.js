describe("PopupApp", function() {
  var storage = chrome.storage.local;
  var sendMsg = chrome.runtime.sendMessage;
  beforeEach(function() {
    chrome.flush();
  });

  describe("Check variable initializations", function() {
    beforeEach(function() {
      chrome.flush();
    });

    it("variables need to be intialized", function() {
      expect(PopupApp.logging).to.eql(false);
      expect(PopupApp.tempIncludes).to.eql([]);
      expect(PopupApp.tempExcludes).to.eql([]);
      expect(PopupApp.isDomainTempIncluded).to.eql(false);
      expect(PopupApp.isDomainTempExcluded).to.eql(false);
      expect(PopupApp.isDomainInExcludesList).to.eql(false);
      expect(PopupApp.showRefreshAlert).to.eql(false);
    });

    /* it("provide a mock response for self calling function getCurrentUrl and updateDetails", function() {
      var tabs = [{ id: 1, url: "https://gnu.org" }];
      chrome.tabs.query.yields(tabs);
      var stub = sinon.stub(window, "updateDOM");

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
      getCurrentUrl(updateDetails);
      stub.restore();
      expect(PopupApp.isDomainTempExcluded).to.eql(true);
    }); */
  });

  describe("PopupApp.sendExcludeMessage helper function should send message to BG script as received", function() {
    beforeEach(function() {
      chrome.flush();
    });
    it("PopupApp.sendExcludeMessage helper function should send message to BG script as received", function() {
      var responseMessage = {
        message: "excluded"
      };
      chrome.runtime.sendMessage.yields(responseMessage);

      PopupApp.domain = "gnu.org";
      PopupApp.sendExcludeMessage("AddtoExcludesListfromJunit");
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
    beforeEach(function() {
      chrome.flush();
    });
    let e = {};
    e.target = { id: "" };

    it("main excludes button should pass category as AddtoExcludesList", function() {
      PopupApp.domain = "gnu.org";
      assert.ok(chrome.runtime.sendMessage.notCalled);

      e.target.id = "MainExcludesButton";
      var spy = sinon.spy(PopupApp, "sendExcludeMessage");
      PopupApp.listenForClicks(e);
      spy.restore();
      sinon.assert.calledOnce(spy);

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
      PopupApp.domain = "gnu.org";
      assert.ok(chrome.runtime.sendMessage.notCalled);

      e.target.id = "tempExcludebutton";
      var spy = sinon.spy(PopupApp, "sendExcludeMessage");
      PopupApp.listenForClicks(e);
      spy.restore();
      sinon.assert.calledOnce(spy);

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

  describe("PopupApp.sendExcludeMessage should handle invalid cases and not send to background script", function() {
    beforeEach(function() {
      chrome.flush();
    });

    it("PopupApp.sendExcludeMessage should not send Empty domain to background script", function() {
      PopupApp.domain = "";
      PopupApp.sendExcludeMessage("AddtoExcludesListfromJunit");
      assert.ok(chrome.runtime.sendMessage.notCalled);
    });

    it("PopupApp.sendExcludeMessage should not web.archive.org domain to background script", function() {
      PopupApp.domain = "web.archive.org";
      PopupApp.sendExcludeMessage("AddtoExcludesListfromJunit");
      assert.ok(chrome.runtime.sendMessage.notCalled);
    });
  });

  describe("Check toggle functions", function() {
    beforeEach(function() {
      chrome.flush();
    });
    let e = {};
    e.target = { id: "" };

    afterEach(function() {
      chrome.flush();
      //delete global.chrome;
    });

    it("showStats should toggle  stats from false/ true", function() {
      e.target.id = "statsButton";
      var spy = sinon.spy(DOM.popupDOM, "toggleStats");

      PopupApp.listenForClicks(e);
      spy.restore();
      sinon.assert.calledWith(spy, false);
    });

    it("toggledisabled should toggle  disable from false/ true", function() {
      e.target.id = "enablebutton";
      var spy = sinon.spy(PopupApp, "toggleDisabled");
      PopupApp.listenForClicks(e);
      spy.restore();
      sinon.assert.calledOnce(spy);
    });

    it("toggledisabled should save correct value to storage", function() {
      e.target.id = "enablebutton";
      var spy = sinon.spy(PopupApp, "toggleDisabled");
      PopupApp.listenForClicks(e);
      spy.restore();
      var local = { disabled: true };
      assert.ok(chrome.storage.local.set.calledWith(local));
    });
  });

  describe("Save this page function should send correct message to background script", function() {
    afterEach(function() {
      chrome.flush();
      //delete global.chrome;
    });
    beforeEach(function() {
      chrome.flush();
    });

    it("should send Save this page message to background script", function() {
      var responseMessage = {
        message: "page saved"
      };
      chrome.runtime.sendMessage.yields(responseMessage);
      let e = {};
      e.target = { id: "savePagebutton" };
      PopupApp.listenForClicks(e);

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

  describe("PopupApp.loadAll1pLinks functionality should work as expected", function() {
    afterEach(function() {
      chrome.flush();
    });

    beforeEach(function() {
      chrome.flush();
    });

    it("PopupApp.loadAll1pLinks should send message to tab, then background script", function() {
      var data = { data: "some urls" };
      chrome.tabs.sendMessage.yields({ data });
      PopupApp.loadAll1pLinks("pathSelector");
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

    it("PopupApp.loadAll1pLinks should not proceed if selector is empty", function() {
      var data = { data: "some urls" };
      chrome.tabs.sendMessage.yields({ data });
      PopupApp.loadAll1pLinks("");
      assert.ok(chrome.tabs.sendMessage.notCalled);
      assert.ok(chrome.runtime.sendMessage.notCalled);
    });

    it("PopupApp.loadAll1pLinks should not proceed if selector is placeholder", function() {
      var data = { data: "some urls" };
      chrome.tabs.sendMessage.yields({ data });
      PopupApp.loadAll1pLinks("Enter a selector");
      assert.ok(chrome.tabs.sendMessage.notCalled);
      assert.ok(chrome.runtime.sendMessage.notCalled);
    });
  });

  describe("Apply temporary changes to permanent should send correct message to background script", function() {
    let redirectsInitial = [];
    beforeEach(function() {
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
      chrome.flush();
    });

    it("Apply tempExclude to Permanent should send correct message to background script", function() {
      var responseMessage = {
        message: "Applid temporary changes to permanenet"
      };
      chrome.runtime.sendMessage.yields(responseMessage);
      PopupApp.domain = "gnu.org";
      PopupApp.applyTemptoPermanent("excludes");

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
      var spy = sinon.spy(PopupApp, "removeSitefromexclude");

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

      PopupApp.redirectslist = [];
      chrome.runtime.sendMessage
        .withArgs({
          type: "getredirects"
        })
        .yields({ redirects: redirectsInitial });

      PopupApp.domain = "gnu.org";
      PopupApp.applyTemptoPermanent("includes");

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
    });

    it("should send Save this page message to background script", function() {
      let e = {};
      e.target = { id: "firstArchivedButton" };
      PopupApp.listenForClicks(e);
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
  // TODO TODO
  describe("PopupApp.applyTemptoPermanent functionality", function() {
    afterEach(function() {
      chrome.flush();
      //delete global.chrome;
    });
    var $scope = {};
    var controller;
    redirects = [
      {
        description: "Wayback Everywhere Rules",
        exampleUrl: "http://example.org",
        exampleResult: "https://web.archive.org/web/2/http://example.org",
        error: null,
        appliesTo: ["main_frame"],
        includePattern: "*",
        excludePattern: "*web.archive.org*|*archive.org*|*gnu.org*|*quora.com*"
      }
    ];
    beforeEach(function() {
      chrome.flush();
      $scope = {};
    });
    //TODO mock sendmessage response to check
    it("PopupApp.applyTemptoPermanent should call PopupApp.removeSitefromexclude after saving temps ", function() {
      PopupApp.domain = "gnu.org";
      var getResponse = ["|*fsf.org*"];
      chrome.runtime.sendMessage.yields(redirects);
      getResponse.push = function() {};
      chrome.storage.local.get.yields({ tempIncludes: getResponse });
      chrome.storage.local.set.yields([]);
      var stub = sinon.stub(PopupApp, "removeSitefromexclude");
      chrome.runtime.sendMessage.yields([]);
      PopupApp.applyTemptoPermanent("includes");
      stub.restore();
      //sinon.stub(Array.prototype, "push").returns(1);
      sinon.assert.calledOnce(stub);
      sinon.assert.calledWith(stub, true);
      assert.ok(
        chrome.runtime.sendMessage.calledWith({
          type: "clearTemps",
          domain: PopupApp.domain,
          subtype: "fromPopup",
          url: PopupApp.currentUrl,
          tabid: PopupApp.tabid,
          toClear: "cleartempIncludes"
        })
      );
      /*assert.ok(chrome.storage.local.get.calledWith({ tempIncludes: [] }));
      assert.ok(
        chrome.storage.local.set.calledWith({
          tempIncludes: getResponse
        })
      );*/
      //assert(stub.withArgs(false).calledOnce);
    });

    it("PopupApp.applyTemptoPermanent should applyTemptoPermanent for exclues ", function() {
      PopupApp.domain = "";
      var getResponse = ["|*fsf.org*"];
      getResponse.push = function() {};
      var stub = sinon.stub(PopupApp, "removeSitefromexclude");
      chrome.runtime.sendMessage.yields([]);
      PopupApp.applyTemptoPermanent("excludes");
      stub.restore();
      sinon.assert.notCalled(stub);
      assert.ok(
        chrome.runtime.sendMessage.calledWith({
          type: "clearTemps",
          domain: PopupApp.domain,
          subtype: "fromPopup",
          url: PopupApp.currentUrl,
          tabid: PopupApp.tabid,
          toClear: "cleartempExcludes"
        })
      );
      assert.ok(
        chrome.tabs.update.calledWith(PopupApp.tabid, { active: true })
      );
      //sinon.assert.calledWith(stub, false);
    });
  });

  describe("PopupApp.removeSitefromexclude (include) functionality should work as expected", function() {
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

      PopupApp.domain = "github.com";
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

    it("PopupApp.removeSitefromexclude with false should remove site from exclude and save to storage as expected", function() {
      PopupApp.removeSitefromexclude(false);

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

    it("PopupApp.removeSitefromexclude with true should remove site from exclude and save to storage as expected", function() {
      chrome.runtime.sendMessage
        .withArgs({
          type: "getredirects"
        })
        .yields({ redirects: redirectsInitial });

      chrome.runtime.sendMessage
        .withArgs({ type: "saveredirects", redirects: redirectsLater })
        .yields("saved redirects");

      PopupApp.removeSitefromexclude(true);

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

    it("PopupApp.removeSitefromexclude should do nothing if domain is empty", function() {
      PopupApp.domain = "";
      chrome.runtime.sendMessage
        .withArgs({
          type: "getredirects"
        })
        .yields({ redirects: redirectsInitial });

      chrome.runtime.sendMessage
        .withArgs({ type: "saveredirects", redirects: redirectsLater })
        .yields("saved redirects");
      PopupApp.removeSitefromexclude(false);
      assert.ok(chrome.runtime.sendMessage.notCalled);
    });

    it("PopupApp.removeSitefromexclude should do nothing if domain is web.archive.org", function() {
      PopupApp.domain = "web.archive.org";
      chrome.runtime.sendMessage
        .withArgs({
          type: "getredirects"
        })
        .yields({ redirects: redirectsInitial });

      chrome.runtime.sendMessage
        .withArgs({ type: "saveredirects", redirects: redirectsLater })
        .yields("saved redirects");
      PopupApp.removeSitefromexclude(false);
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
    });
    it("Should be able to clear temporary include rule", function() {
      PopupApp.tempIncludes = ["|*gnu.org*", "|*example.org*"];
      PopupApp.domain = "example.org";
      var tempIncludesExpected = ["|*gnu.org*"];
      chrome.storage.local.set.yields("response");

      PopupApp.clearTempRules("tempIncludes");

      assert.ok(chrome.storage.local.set.calledOnce);
      assert.ok(
        chrome.storage.local.set.calledWith({
          tempIncludes: tempIncludesExpected
        })
      );
    });

    it("Should be able to clear temporary exclude rule", function() {
      PopupApp.tempExcludes = ["|*gnu.org*", "|*example.org*"];
      PopupApp.domain = "example.org";
      var tempExcludesExpected = ["|*gnu.org*"];
      chrome.storage.local.set.yields("response");
      //var stub = sinon.stub($scope, "PopupApp.removeSitefromexclude");

      PopupApp.clearTempRules("tempExcludes");

      assert.ok(chrome.storage.local.set.calledOnce);
      assert.ok(
        chrome.storage.local.set.calledWith({
          tempExcludes: tempExcludesExpected
        })
      );
    });
  });
  // -- Add Describes above this line --
});

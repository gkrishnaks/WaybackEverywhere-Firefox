describe("Background script tests", function() {
  var storage = chrome.storage.local;
  var sendMsg = chrome.runtime.sendMessage;
  beforeEach(function() {
    chrome.flush();
  });

  describe("Temporary Excludes need to be updated correctly", function() {
    beforeEach(function() {
      chrome.flush();
    });
    it("tempExcludes array should be updated", function() {
      var tempExcludes = ["|*fsf.org*"];
      //log.enabled = true;
      checkTempExcludes("gnu.org", tempExcludes);
      tempExcludes.push("|*gnu.org*");
      assert.ok(
        storage.set.calledWith({
          tempExcludes: tempExcludes
        })
      );
    });

    it("tempExcludes array should not updated when already exists", function() {
      var tempExcludes = ["|*gnu.org*"];
      // log.enabled = true;
      checkTempExcludes("gnu.org", tempExcludes);
      //tempExcludes.push("|*gnu.org*");
      assert.ok(storage.set.notCalled);
    });

    it("tempExcludes array should do nothing if tempExcludes null or undefined", function() {
      var tempExcludes = null;
      //log.enabled = true;
      checkTempExcludes("gnu.org", tempExcludes);
      //tempExcludes.push("|*gnu.org*");
      assert.ok(storage.set.notCalled);
      tempExcludes = undefined;
      checkTempExcludes("gnu.org", tempExcludes);
      //tempExcludes.push("|*gnu.org*");
      assert.ok(storage.set.notCalled);
    });
  });

  describe("Counts should be stored to storage when saved", function() {
    beforeEach(function() {
      chrome.flush();
      oldcounts = {
        archivedPageLoadsCount: 10,
        waybackSavescount: 5
      };
    });

    it("counts should be stored to storage when both redirected and saves values changed", function() {
      counts = {
        archivedPageLoadsCount: 20,
        waybackSavescount: 10
      };
      storeCountstoStorage();
      assert.ok(storage.set.calledOnce);
      assert.ok(storage.set.calledWith({ counts: counts }));
    });

    it("counts should be stored to storage when only redirected value changed", function() {
      counts = {
        archivedPageLoadsCount: 20,
        waybackSavescount: 5
      };
      storeCountstoStorage();
      assert.ok(storage.set.calledOnce);
      assert.ok(storage.set.calledWith({ counts: counts }));
    });

    it("counts should be stored to storage when only saved value changed", function() {
      counts = {
        archivedPageLoadsCount: 10,
        waybackSavescount: 10
      };
      storeCountstoStorage();
      assert.ok(storage.set.calledOnce);
      assert.ok(storage.set.calledWith({ counts: counts }));
    });

    it("counts should not be stored to storage when neither redirected nor saved value got changed", function() {
      counts = {
        archivedPageLoadsCount: 10,
        waybackSavescount: 5
      };
      storeCountstoStorage();
      assert.ok(storage.set.notCalled);
      // assert.ok(storage.set.calledWith({ counts: counts }));
    });
  });

  describe("URLs should be cleaned using filters before redirecting to WM", function() {
    beforeEach(function() {
      chrome.flush();
      filters = ["?utm", "?smid", "?CMP"];
    });

    it("should clear URLs using filters when needed and filters available", function() {
      var url = "https://gnu.org/path/places/?utm=something";
      var cleanUrl = cleanUrlsOnFilters(url);
      expect(cleanUrl).to.not.include("?utm=something");
      expect(cleanUrl).to.eql("https://gnu.org/path/places/");
      //assert(cleanUrl).notInclude("?utm=something");
    });

    it("should do nothing when filters are not avaiable", function() {
      filters = [];

      var url = "https://gnu.org/path/places/?utm=something";
      var cleanUrl = cleanUrlsOnFilters(url);
      expect(cleanUrl).to.include("?utm=something");
      expect(cleanUrl).to.eql(url);
      //assert(cleanUrl).notInclude("?utm=something");
    });

    it("should do nothing when filters are avaiable but no matching filter is found", function() {
      filters = ["alpha"];
      var url = "https://gnu.org/path/places/?utm=something";
      var cleanUrl = cleanUrlsOnFilters(url);
      expect(cleanUrl).to.include("?utm=something");
      expect(cleanUrl).to.eql(url);
      //assert(cleanUrl).notInclude("?utm=something");
    });
  });

  describe("Listeners subscription", function() {
    beforeEach(function() {
      chrome.flush();
    });
    it("should subscribe on onInstalled", function() {
      subscribeListeners();
      assert.ok(chrome.runtime.onInstalled.addListener.calledOnce);
      assert.ok(
        chrome.runtime.onInstalled.addListener.calledWith(onInstalledfn)
      );
    });

    it("should subscribe on onStartup", function() {
      subscribeListeners();
      assert.ok(chrome.runtime.onStartup.addListener.calledOnce);
      assert.ok(chrome.runtime.onStartup.addListener.calledWith(handleStartup));
    });

    it("should subscribe on storage onChanged", function() {
      subscribeListeners();
      assert.ok(chrome.storage.onChanged.addListener.calledOnce);
      assert.ok(
        chrome.storage.onChanged.addListener.calledWith(monitorChanges)
      );
    });

    it("should subscribe on send_Headers", function() {
      subscribeListeners();
      assert.ok(chrome.webRequest.onBeforeSendHeaders.addListener.calledOnce);
      assert.ok(
        chrome.webRequest.onBeforeSendHeaders.addListener.calledWith(
          headerHandler,
          {
            urls: ["https://web.archive.org/save/*"]
          },
          ["requestHeaders", "blocking"]
        )
      );
    });

    it("should subscribe on tabs Updated", function() {
      subscribeListeners();
      assert.ok(chrome.tabs.onUpdated.addListener.calledOnce);
      assert.ok(
        chrome.tabs.onUpdated.addListener.calledWith(tabsUpdatedListner)
      );
    });

    it("should subscribe on runtime Messages", function() {
      subscribeListeners();
      assert.ok(chrome.runtime.onMessage.addListener.calledOnce);
      assert.ok(
        chrome.runtime.onMessage.addListener.calledWith(MessageHandler)
      );
    });
  });

  describe("Headers Useragent updated", function() {
    beforeEach(function() {
      chrome.flush();
    });
    it("should update useragent in header to comply with request from Wayback Machine team", function() {
      var details = {};
      var a = [
        { name: "Host", value: "web.archive.org" },
        {
          name: "User-Agent",
          value: "some browser Useragent"
        },
        { name: "Accept", value: "*/*" },
        { name: "Accept-Language", value: "en-GB,en;q=0.5" },
        { name: "Accept-Encoding", value: "gzip, deflate, br" },
        {
          name: "Referer",
          value: "https://web.archive.org/save/http://www.gnu.org/"
        },
        {
          name: "Cookie",
          value: "have some cookies"
        },
        { name: "Connection", value: "keep-alive" },
        { name: "Origin", value: "some origin" }
      ];
      details.requestHeaders = a;

      var response = headerHandler(details);

      var headersupdated = [
        { name: "Host", value: "web.archive.org" },
        {
          name: "User-Agent",
          value: "Save Page Request from WaybackEverywhere Browser Extension"
        },
        { name: "Accept", value: "*/*" },
        { name: "Accept-Language", value: "en-GB,en;q=0.5" },
        { name: "Accept-Encoding", value: "gzip, deflate, br" },
        {
          name: "Referer",
          value: "https://web.archive.org/save/http://www.gnu.org/"
        },
        {
          name: "Cookie",
          value: ""
        },
        { name: "Connection", value: "keep-alive" },
        { name: "Origin", value: "some origin" }
      ];

      expect(response.requestHeaders).to.be.eql(headersupdated);
    });
  });

  describe("setUpRedirectListener function", function() {
    var redirects;
    beforeEach(function() {
      chrome.flush();
      redirects = [
        {
          description: "Wayback Everywhere Rules",
          exampleUrl: "http://example.org",
          exampleResult: "https://web.archive.org/web/2/http://example.org",
          error: null,
          appliesTo: ["main_frame"],
          includePattern: "*",
          excludePattern:
            "*web.archive.org*|*archive.org*|*gnu.org*|*raw.githubusercontent.com*|*youtube.com*|*github.com*|*imgur.com*|*reddit.com*|*archive.is*|*quora.com*|*techcrunch.com*|*amazon.in*|*amazon.com*"
        }
      ];
    });
    it("should remove any existing listener before proceeding, just in case there are any changes in stored redirects", function() {
      setUpRedirectListener();
      assert.ok(chrome.webRequest.onBeforeRequest.removeListener.calledOnce);
      assert.ok(
        chrome.webRequest.onBeforeRequest.removeListener.calledWithExactly(
          checkRedirects
        )
      );
    });

    it("should setup redirect listener to wayback machine when rules are valid", function() {
      chrome.storage.local.get.yields({ redirects });
      var spy = sinon.spy(window, "getRegex");
      var spy1 = sinon.spy(window, "createPartitionedRedirects");
      var spy2 = sinon.spy(window, "createFilter");
      var filt = {
        urls: ["https://*/*", "http://*/*"],
        types: ["main_frame"]
      };
      setUpRedirectListener();
      spy.restore();
      spy1.restore();
      spy2.restore();

      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(
        spy,
        "*web.archive.org*|*archive.org*|*gnu.org*|*raw.githubusercontent.com*|*youtube.com*|*github.com*|*imgur.com*|*reddit.com*|*archive.is*|*quora.com*|*techcrunch.com*|*amazon.in*|*amazon.com*"
      );
      sinon.assert.calledOnce(spy1);
      sinon.assert.calledWith(spy1, redirects);
      sinon.assert.calledOnce(spy2);
      sinon.assert.calledWith(spy2, redirects);
      assert.ok(
        chrome.webRequest.onBeforeRequest.addListener.calledWithExactly(
          checkRedirects,
          filt,
          ["blocking"]
        )
      );
    });

    it("should not setup redirect listener when rules are missing", function() {
      let redirects = [];
      chrome.storage.local.get.yields({ redirects });

      setUpRedirectListener();

      assert.ok(chrome.webRequest.onBeforeRequest.addListener.notCalled);
    });

    describe("helper functions for redirect listener setup", function() {
      var redirects, expectedFilter, expectedRegex, expectedPartitioned;
      beforeEach(function() {
        chrome.flush();
        redirects = [
          {
            description: "Wayback Everywhere Rules",
            exampleUrl: "http://example.org",
            exampleResult: "https://web.archive.org/web/2/http://example.org",
            error: null,
            appliesTo: ["main_frame"],
            includePattern: "*",
            excludePattern:
              "*web.archive.org*|*archive.org*|*gnu.org*|*raw.githubusercontent.com*|*youtube.com*|*github.com*|*imgur.com*|*reddit.com*|*archive.is*|*quora.com*|*techcrunch.com*|*amazon.in*|*amazon.com*"
          }
        ];

        expectedFitler = {
          urls: ["https://*/*", "http://*/*"],
          types: ["main_frame"]
        };

        expectedRegex = /^(.*?)web\.archive\.org(.*?)|(.*?)archive\.org(.*?)|(.*?)gnu\.org(.*?)|(.*?)raw\.githubusercontent\.com(.*?)|(.*?)youtube\.com(.*?)|(.*?)github\.com(.*?)|(.*?)imgur\.com(.*?)|(.*?)reddit\.com(.*?)|(.*?)archive\.is(.*?)|(.*?)quora\.com(.*?)|(.*?)techcrunch\.com(.*?)|(.*?)amazon\.in(.*?)|(.*?)amazon\.com(.*?)$/gi;
      });

      it("should generate filters from the rule correctly", function() {
        var response = createFilter(redirects);
        expect(response).to.be.eql(expectedFitler);
      });

      /* it.only("should generate exclude pattern regex from the rule", function() {
                var response = createPartitionedRedirects(redirects);
                console.log("repsonse is");
                console.log(response.main_frame);
                expect(response.main_frame).to.be.eql([
                    {
                        description: "Wayback Everywhere Rules",
                        exampleUrl: "http://example.org",
                        exampleResult:
                            "https://web.archive.org/web/2/http://example.org",
                        error: null,
                        includePattern: "*",
                        excludePattern:
                            "*web.archive.org*|*archive.org*|*gnu.org*|*raw.githubusercontent.com*|*youtube.com*|*github.com*|*imgur.com*|*reddit.com*|*archive.is*|*quora.com*|*techcrunch.com*|*amazon.in*|*amazon.com*",
                        redirectUrl: "",
                        patternType: "W",
                        processMatches: "noProcessing",
                        disabled: false,
                        appliesTo: ["main_frame"],
                        _rxInclude: {},
                        _rxExclude: {}
                    }
                ]);
                // expect(excludePatterns).to.be.eql(expectedRegex);
            });*/
    });
  });

  describe("Tabs updated listener handler", function() {
    var tabId, changeInfo, tab;
    beforeEach(function() {
      isReaderModeEnabled = false;
      chrome.flush();
      tabId = 2;
      changeInfo = { isArticle: true };
      tab = { url: "https://gnu.org/path/to/something" };
      justUpdatedReader = {
        1: "https://web.archive.org/web/2/https://fsf.org"
      };
    });

    it("should show page action icon when in normal websites", function() {
      chrome.flush();
      tabsUpdatedListner(tabId, changeInfo, tab);
      assert.ok(chrome.pageAction.show.calledOnce);
      assert.ok(chrome.pageAction.show.calledWithExactly(2));
    });

    it("should not show page action icon when in about: pages or file or ftp pages", function() {
      var list = [
        "about:addons",
        "about:config",
        "about:preferences",
        "file://user/home/somefile.json",
        "ftp://somepath",
        "about:debug",
        "about:log",
        "about:fir",
        "about:downloads",
        "about:mem"
      ];
      for (var item of list) {
        tab.url = item;
        tabsUpdatedListner(tabId, changeInfo, tab);
        assert.ok(chrome.pageAction.show.notCalled);
        assert.ok(chrome.pageAction.hide.calledWithExactly(2));
        chrome.flush();
      }
    });

    it("should not toggle readermode for live sites", function() {
      chrome.tabs.toggleReaderMode = function() {};
      var stub = sinon.stub(chrome.tabs, "toggleReaderMode");
      tabsUpdatedListner(tabId, changeInfo, tab);
      stub.restore();
      sinon.assert.notCalled(stub);
    });

    it("should toggle readermode for archived sites and setting is enabled", function() {
      isReaderModeEnabled = true;
      tab.url =
        "https://web.archive.org/web/2324234/https://gnu.org/path/to/something";
      chrome.tabs.toggleReaderMode = function(id) {};
      var stub = sinon.stub(chrome.tabs, "toggleReaderMode");
      tabsUpdatedListner(tabId, changeInfo, tab);
      stub.restore();
      sinon.assert.calledOnce(stub);
      sinon.assert.calledWith(stub, 2);
    });

    it("should toggle readermode for archived sites on same tab for new url than the one stored in obj", function() {
      isReaderModeEnabled = true;
      tab.url =
        "https://web.archive.org/web/2324234/https://gnu.org/path/to/something";
      chrome.tabs.toggleReaderMode = function(id) {};
      var stub = sinon.stub(chrome.tabs, "toggleReaderMode");
      tabsUpdatedListner(tabId, changeInfo, tab);
      sinon.assert.calledOnce(stub);
      sinon.assert.calledWith(stub, 2);
      tab.url =
        "https://web.archive.org/web/2324234/https://fsf.org/path/to/something/something";
      tabsUpdatedListner(tabId, changeInfo, tab);
      sinon.assert.calledTwice(stub);
      sinon.assert.calledWith(stub, 2);
      stub.restore();
    });

    it("should not toggle readermode 2nd time for archived sites and setting is enabled - this is needed so that user is able to exit the readermode - need this until mozilla resolves this", function() {
      isReaderModeEnabled = true;
      tab.url =
        "https://web.archive.org/web/2324234/https://gnu.org/path/to/something";
      chrome.tabs.toggleReaderMode = function(id) {};
      var stub = sinon.stub(chrome.tabs, "toggleReaderMode");
      tabsUpdatedListner(tabId, changeInfo, tab);
      stub.restore();
      sinon.assert.calledOnce(stub);
      sinon.assert.calledWith(stub, 2);
    });

    it("should not toggle readermode 2nd time for archived sites and setting is enabled - this is needed so that user is able to exit the readermode - need this until mozilla resolves this", function() {
      isReaderModeEnabled = true;
      tab.url =
        "https://web.archive.org/web/2324234/https://gnu.org/path/to/something";
      chrome.tabs.toggleReaderMode = function(id) {};
      var stub = sinon.stub(chrome.tabs, "toggleReaderMode");
      tabsUpdatedListner(tabId, changeInfo, tab);
      sinon.assert.calledOnce(stub);
      sinon.assert.calledWith(stub, 2);
      stub.reset();
      chrome.tabs.toggleReaderMode = function(id) {};
      tabsUpdatedListner(tabId, changeInfo, tab);
      sinon.assert.notCalled(stub);
      stub.restore();
    });

    it("justUpdatedReader object should be cleaned of closed tabs to avoid size increase", function() {
      isReaderModeEnabled = true;
      //log.enabled = true;
      tab.url =
        "https://web.archive.org/web/2324234/https://gnu.org/path/to/something";
      chrome.tabs.toggleReaderMode = function(id) {};
      var stub = sinon.stub(chrome.tabs, "toggleReaderMode");
      tabsUpdatedListner(tabId, changeInfo, tab);
      stub.restore();
      sinon.assert.calledOnce(stub);
      sinon.assert.calledWith(stub, 2);
      expect(justUpdatedReader).to.have.ownPropertyDescriptor(2);

      assert.include(justUpdatedReader, {
        2: "https://web.archive.org/web/2324234/https://gnu.org/path/to/something"
      });

      var removeInfo = {};
      handleRemoved(tabId, removeInfo);

      expect(justUpdatedReader).to.not.have.ownPropertyDescriptor("2");

      assert.notInclude(justUpdatedReader, {
        2: "https://web.archive.org/web/2324234/https://gnu.org/path/to/something"
      });
    });
  });

  describe("Handle version updates", function() {
    it("should be able to open update html when needed", function() {
      chrome.flush();
      chrome.extension.getURL.returns(
        "chrome:extension://somerandomstring/update.html"
      );
      openUpdatehtml();
      assert.ok(chrome.tabs.create.calledOnce);
      assert.ok(
        chrome.tabs.create.calledWithExactly({
          url: "chrome:extension://somerandomstring/update.html"
        })
      );
    });
  });

  describe("Clear temporary stored values to free size", function() {
    beforeEach(function() {
      isReaderModeEnabled = false;
      chrome.flush();
      justSaved = [
        "http://examples.com==WBE==9999999999999",
        "http://example.org==WBE==1533900112092"
      ];
      justreloaded = [
        "http://examples.com==WBE==9999999999999",
        "http://example.org==WBE==1533900112092"
      ];
    });

    it("should clear justsaved and justreloaded", function() {
      var stub = sinon.stub(Date, "now").returns("1533900352142");
      clearJustSaved();
      stub.restore();
      expect(justSaved.length).to.be.eql(1);
      expect(JSON.stringify(justSaved)).to.be.eql(
        JSON.stringify(["http://examples.com==WBE==9999999999999"])
      );
      expect(justreloaded.length).to.be.eql(1);
      expect(JSON.stringify(justreloaded)).to.be.eql(
        JSON.stringify(["http://examples.com==WBE==9999999999999"])
      );
    });
  });

  describe("Redirects", function() {
    var details;
    beforeEach(function() {
      chrome.flush();
      details = {};
      details.url = "https://gnu.org";
      details.method = "GET";
      details.tabId = 2;
    });
    it("Should return right away with empty object if request is not get", function() {
      let expected = {};
      details.method = "POST";
      var response = checkRedirects(details);
      expect(response).to.be.eql(expected);
    });

    it("Should return right away with empty object if request url is wayback machine save url", function() {
      details.url =
        "https://web.archive.org/save/https://gnu.org/path/to/something";
      var expected = {};
      var response = checkRedirects(details);
      expect(response).to.be.eql(expected);
    });

    it("Should return right away with empty object if request url is wayback machine save url", function() {
      details.url =
        "https://web.archive.org/save/https://gnu.org/path/to/something";
      var expected = {};

      var response = checkRedirects(details);
      expect(response).to.be.eql(expected);
    });

    it("Should return right away with empty object if user tries to load archived version of wayback machine itself", function() {
      var stub = sinon.stub(window, "getHostfromUrl").returns({
        hostname: "",
        url: ""
      });
      details.url = "https://web.archive.org/web/2222/https://web.archive.org/";
      var response = checkRedirects(details);
      var expected = {};
      stub.restore();
      expect(response).to.be.eql(expected);
    });

    it("Should add domain to temporary excludes if some selectors detected in archived URL like Login or register", function() {
      details.url =
        "https://web.archive.org/web/2213421/https://gnu.org/login/to/something";
      let request = {};
      request.subtype = "fromContent";
      request.category = "AddtoTempExcludesList";
      let sender = { tab: {} };
      // log.enabled = true;
      excludePatterns = getRegex(
        "*web.archive.org*|*archive.org*|*gnu.org*|*raw.githubusercontent.com*|*youtube.com*|*github.com*|*imgur.com*|*reddit.com*|*archive.is*|*quora.com*|*techcrunch.com*|*amazon.in*|*amazon.com*"
      );
      sender.tab = {};
      sender.tab.id = details.tabId;
      sender.tab.url = details.url;

      chrome.storage.local.get.yields({});
      let sendResponse = function() {};
      //  var stub = sinon.stub(window, "addSitetoExclude");
      var fake = sinon.fake();
      /*let print = function() {
                console.log("fake was called");
            };
            var fake = sinon.fake(print); */

      sinon.replace(window, "addSitetoExclude", fake);
      var response = checkRedirects(details);
      sinon.restore();
      expect(fake.callCount).to.be.eql(1);
      // sinon.assert.calledOnce(stub);
      //  sinon.assert.calledWith(stub, request, sender, sendResponse);
      expect(response).to.be.eql({ cancel: true });
      assert.ok(chrome.storage.local.get.notCalled);
    });

    it("Should return live url if archived URL contains ambiguous hostnames", function() {
      details.url = "https://web.archive.org/web/2/https://t.co/something";
      var response = checkRedirects(details);
      expect(response).to.be.eql({
        redirectUrl: "https://t.co/something"
      });

      //to avoid infinite looping, should return empty when same domain live :D
      details.url = "https://t.co/something";
      response = checkRedirects(details);
      expect(response).to.be.eql({});
    });

    it("Should add to excludes and load live if archived site tries to do medium globalredirect. This is needed to avoid infinite looping in WM itself between site and global redirects", function() {
      details.url =
        "https://web.archive.org/web/22342/https://medium.com/m/global-identity?redirectUrl=https://blog.mapbox.com/hd-v";
      let url =
        "https://medium.com/m/global-identity?redirectUrl=https://blog.mapbox.com/hd-v";
      let request = {};
      request.subtype = "fromContent";
      request.category = "addtoExclude";
      let sender = { tab: {} };
      sender.tab = {};
      sender.tab.id = details.tabId;
      let index = url.indexOf("redirectUrl=") + 12;
      sender.tab.url =
        "https://web.archive.org/web/2/" +
        decodeURIComponent(url.substring(index));
      let sendResponse = function() {};
      // addSitetoExclude(request, sender, sendResponse);
      var fake = sinon.fake();
      sinon.replace(window, "addSitetoExclude", fake);

      var response = checkRedirects(details);

      sinon.restore();
      expect(fake.callCount).to.be.eql(1);
      // sinon.assert.calledOnce(stub);
      //  sinon.assert.calledWith(stub, request, sender, sendResponse);
      expect(response).to.be.eql({ cancel: true });
    });

    it("Should return live url if url ends with a common file extension", function() {
      details.url =
        "https://web.archive.org/web/22342/https://somesite.org/somepackage/source.zip/";
      let url = "https://somesite.org/somepackage/source.zip/";
      let request = {};
      let sender = { tab: {} };
      sender.tab = {};
      sender.tab.id = details.tabId;
      commonExtensions = [".zip", ".tar.gz", ".exe"];
      let sendResponse = function() {};
      var response = checkRedirects(details);
      expect(response).to.be.eql({ redirectUrl: url });
    });
  });

  describe("tabsUpdate should load the url given in the provided tabId", function() {
    beforeEach(function() {
      chrome.flush();
    });
    it("tabsUpdate should pass the correct message to API", function() {
      let url = "https://gnu.org";
      let activetab = true;
      let tabid = 2;
      let obj = {
        active: true,
        url: "https://gnu.org"
      };
      tabsUpdates(url, activetab, tabid);
      assert.ok(chrome.tabs.update.withArgs(2, obj).calledOnce);

      /* assert.ok(chrome.tabs.update.calledWith({    type: "https://gnu.org",activetab: true,tabid: 2,})); */
    });
  });

  describe("AddtoExclude functionality", function() {
    var request, sender, redirects;
    var sendResponse = function() {};
    beforeEach(function() {
      chrome.flush();
      sender = { tab: {} };
      request = {
        subtype: "fromPopup",
        url: "https://web.archive.org/web/20180810112330/http://www.gnu.org/",
        tabid: 11,
        category: "AddtoExcludesList"
      };
      sender.tab.id = 2;
      sender.tab.url = "https://web.archive.org/web/2323/https://gnu.org";
      redirects = [
        {
          description: "Wayback Everywhere Rules",
          exampleUrl: "http://example.org",
          exampleResult: "https://web.archive.org/web/2/http://example.org",
          error: null,
          appliesTo: ["main_frame"],
          includePattern: "*",
          excludePattern:
            "*web.archive.org*|*archive.org*|*gnu.org*|*raw.githubusercontent.com*|*youtube.com*|*github.com*|*imgur.com*|*reddit.com*|*archive.is*|*quora.com*|*techcrunch.com*|*amazon.in*|*amazon.com*"
        }
      ];

      chrome.storage.local.get
        .withArgs({ redirects: [] })
        .yields({ redirects });
    });

    it("should add domain to excludesList if not already exists and load live page", function() {
      //  log.enabled = true;
      request.url = "https://web.archive.org/web/2322/https://fsf.org";
      chrome.storage.local.set.yields("saved");

      var stub = sinon.spy(window, "tabsUpdates");
      addSitetoExclude(request, sender, sendResponse);
      stub.restore();
      sinon.assert.calledOnce(stub);
      sinon.assert.calledWithExactly(stub, "https://fsf.org/", true, 11);
    });

    it("should not add duplicate entry if domain name already exists and just reload live page", function() {
      // log.enabled = true;
      chrome.storage.local.set.yields("saved");

      var stub = sinon.stub(window, "tabsUpdates");
      addSitetoExclude(request, sender, sendResponse);
      stub.restore();
      sinon.assert.calledOnce(stub);
      sinon.assert.calledWithExactly(stub, "http://www.gnu.org/", true, 11);
    });

    it("should also add a site to tempexcludesList if needed", function() {
      //    log.enabled = true;
      chrome.storage.local.set.yields("saved");

      request.category = "AddtoTempExcludesList";
      tempExcludes = [];
      var stub = sinon.stub(window, "tabsUpdates");
      var stub1 = sinon.stub(window, "checkTempExcludes");

      addSitetoExclude(request, sender, sendResponse);
      stub.restore();
      stub1.restore();
      sinon.assert.calledOnce(stub);
      sinon.assert.calledWithExactly(stub, "http://www.gnu.org/", true, 11);
      sinon.assert.calledOnce(stub1);
      sinon.assert.calledWithExactly(stub1, "gnu.org", tempExcludes);
    });

    it("should handle addSitetoExclude request from content script", function() {
      // log.enabled = true;
      request.category = "AddtoExcludesList";
      request.subtype = "fromContent";
      tempExcludes = ["example1.org"];
      sender.tab.url = "https://web.archive.org/web/2323/https://example1.org";

      var stub = sinon.stub(window, "tabsUpdates");
      redirectsExpected = [
        {
          description: "Wayback Everywhere Rules",
          exampleUrl: "http://example.org",
          exampleResult: "https://web.archive.org/web/2/http://example.org",
          error: null,
          appliesTo: ["main_frame"],
          includePattern: "*",
          excludePattern:
            "*web.archive.org*|*archive.org*|*gnu.org*|*raw.githubusercontent.com*|*youtube.com*|*github.com*|*imgur.com*|*reddit.com*|*archive.is*|*quora.com*|*techcrunch.com*|*amazon.in*|*amazon.com*|*example1.org*"
        }
      ];
      chrome.storage.local.set
        .withArgs({ redirects: redirectsExpected })
        .yields("saved");
      addSitetoExclude(request, sender, sendResponse);
      stub.restore();
      sinon.assert.calledOnce(stub);
      sinon.assert.calledWithExactly(stub, "https://example1.org/", false, 2);
    });

    it("should clear tempIncludes if content script sends a addtoExclude message -- because wayback machine cannot support such a site", function() {
      //  log.enabled = true;
      request.category = "AddtoExcludesList";
      request.subtype = "fromContent";
      tempExcludes = ["example1.org"];
      sender.tab.url = "https://web.archive.org/web/2323/https://example1.org";

      var stub = sinon.spy(window, "tabsUpdates");
      redirectsExpected = [
        {
          description: "Wayback Everywhere Rules",
          exampleUrl: "http://example.org",
          exampleResult: "https://web.archive.org/web/2/http://example.org",
          error: null,
          appliesTo: ["main_frame"],
          includePattern: "*",
          excludePattern:
            "*web.archive.org*|*archive.org*|*gnu.org*|*raw.githubusercontent.com*|*youtube.com*|*github.com*|*imgur.com*|*reddit.com*|*archive.is*|*quora.com*|*techcrunch.com*|*amazon.in*|*amazon.com*|*example1.org*"
        }
      ];
      chrome.storage.local.set
        .withArgs({ redirects: redirectsExpected })
        .yields("saved");
      tempIncludes = ["|*example1.org*"];
      addSitetoExclude(request, sender, sendResponse);
      stub.restore();
      sinon.assert.calledOnce(stub);
      sinon.assert.calledWithExactly(stub, "https://example1.org/", false, 2);
      assert.ok(
        chrome.tabs.update.calledWithExactly(2, {
          active: false,
          url: "https://example1.org/"
        })
      );
      assert.ok(chrome.storage.local.set.calledWith({ tempIncludes: [] }));
    });

    it("should also add a site to tempexcludesList if requested from content script", function() {
      //   log.enabled = true;
      request.category = "AddtoTempExcludesList";
      request.subtype = "fromContent";
      tempExcludes = ["example1.org"];
      sender.tab.url = "https://web.archive.org/web/2323/https://example1.org";
      tempExcludes = ["|*gnu.org*"];
      var stub = sinon.stub(window, "checkTempExcludes");
      redirectsExpected = [
        {
          description: "Wayback Everywhere Rules",
          exampleUrl: "http://example.org",
          exampleResult: "https://web.archive.org/web/2/http://example.org",
          error: null,
          appliesTo: ["main_frame"],
          includePattern: "*",
          excludePattern:
            "*web.archive.org*|*archive.org*|*gnu.org*|*raw.githubusercontent.com*|*youtube.com*|*github.com*|*imgur.com*|*reddit.com*|*archive.is*|*quora.com*|*techcrunch.com*|*amazon.in*|*amazon.com*|*example1.org*"
        }
      ];
      chrome.storage.local.set
        .withArgs({ redirects: redirectsExpected })
        .yields("saved");
      addSitetoExclude(request, sender, sendResponse);
      stub.restore();
      sinon.assert.calledOnce(stub);
      sinon.assert.calledWithExactly(stub, "example1.org", ["|*gnu.org*"]);
    });
  });

  describe("Page action icon for firefox", function() {
    var tab = {};
    var tabs = {};
    beforeEach(function() {
      chrome.flush();
      tab.tabId = 5;
      tabs = [
        { url: "https://gnu.org", id: 2 },
        { url: "https://example.com", id: 3 }
      ];
      chrome.tabs.query.yields(tabs);
    });
    it("Should show page action for normal sites loaded in curren tab", function() {
      tabOnActivatedListener(tab);
      assert.ok(chrome.pageAction.show.calledOnce);
      assert.ok(chrome.pageAction.show.calledWithExactly(5));
    });

    it("Should hide page action for non http tabs", function() {
      tabs[0].url = "about:memory";
      tabOnActivatedListener(tab);
      assert.ok(chrome.pageAction.show.notCalled);
      assert.ok(chrome.pageAction.hide.calledOnce);
      assert.ok(chrome.pageAction.hide.calledWithExactly(5));
    });
  });

  describe("StartUp handlers", function() {
    var STORAGE = chrome.storage.local;

    beforeEach(function() {
      chrome.flush();
    });
    it("Should check if app enabled or disabled and set it accordingly", function() {
      operationMode = true;
      STORAGE.get.withArgs({ operationMode: false }).yields({ operationMode });
      handleStartup();
      assert.ok(STORAGE.get.calledWith({ operationMode: false }));
      expect(appDisabled).to.be.eql(true);
      operationMode = false;
      STORAGE.get.withArgs({ operationMode: false }).yields({ operationMode });
      handleStartup();
      expect(appDisabled).to.be.eql(false);
    });

    it("Should call clearAllTemps when addon starts", function() {
      var stub = sinon.stub(window, "clearAllTemps");
      handleStartup();
      stub.restore();
      sinon.assert.calledOnce(stub);
    });

    it("Should set logging to false upon app start", function() {
      handleStartup();
      assert.ok(STORAGE.set.calledWith({ logging: false }));
    });

    it("Should check if app enabled or disabled and set it accordingly", function() {
      isLoadAllLinksEnabledreturn = true;
      STORAGE.get
        .withArgs({
          isLoadAllLinksEnabled: false
        })
        .yields({ isLoadAllLinksEnabled: isLoadAllLinksEnabledreturn });

      handleStartup();
      assert.ok(
        STORAGE.get.calledWith({
          isLoadAllLinksEnabled: false
        })
      );
      expect(isLoadAllLinksEnabled).to.be.eql(true);
      isLoadAllLinksEnabledreturn = false;
      STORAGE.get
        .withArgs({
          isLoadAllLinksEnabled: false
        })
        .yields({ isLoadAllLinksEnabled: isLoadAllLinksEnabledreturn });

      handleStartup();
      expect(isLoadAllLinksEnabled).to.be.eql(false);
    });

    it("Should check if app enabled or disabled and set it accordingly", function() {
      readermode = true;
      STORAGE.get
        .withArgs({
          readermode: false
        })
        .yields({ readermode });

      handleStartup();
      assert.ok(
        STORAGE.get.calledWith({
          readermode: false
        })
      );
      expect(isReaderModeEnabled).to.be.eql(true);

      readermode = false;
      STORAGE.get
        .withArgs({
          readermode: false
        })
        .yields({ readermode });

      handleStartup();

      expect(isReaderModeEnabled).to.be.eql(false);
    });
  });

  describe("Addon's On-Installed functionality", function() {
    var details = {};
    var store;
    var fake = sinon.fake();
    sinon.replace(window, "loadinitialdata", fake);

    beforeEach(function() {
      chrome.flush();
      details.reason = "install";
      details.temporary = "false";
      store = chrome.storage.local;
    });

    it("Should call load Initial data function to setup the settings", function() {
      var fake = sinon.fake();
      sinon.replace(window, "loadinitialdata", fake);
      onInstalledfn(details);
      expect(fake.callCount).to.be.eql(1);
      expect(fake.lastArg).to.be.eql("init");
    });

    it("Should set counts to 0 in storage", function() {
      let c = { archivedPageLoadsCount: 0, waybackSavescount: 0 };
      onInstalledfn(details);

      assert.ok(store.set.calledWith({ counts: c }));
    });

    it("Should set tempIncludes and tempExcludes as empty in storage", function() {
      let c = [];
      onInstalledfn(details);

      assert.ok(store.set.calledWith({ tempIncludes: c }));
      assert.ok(store.set.calledWith({ tempExcludes: c }));
    });

    it("Should open help.html upon addon install", function() {
      chrome.extension.getURL.returns("chrome-extension://a23423234/help.html");

      onInstalledfn(details);

      assert.ok(chrome.tabs.create.calledOnce);
      assert.ok(
        chrome.tabs.create.calledWithExactly({
          url: "chrome-extension://a23423234/help.html"
        })
      );
    });
    sinon.restore();
  });

  describe("Save to Wayback Machine functionality", function() {
    var request, sender, sendResponse;
    beforeEach(function() {
      chrome.flush();
      request = {};
      sender = { tab: {} };
      sender.tab.id = 4;
      sender.tab.url =
        "https://web.archive.org/web/223423/https://gnu.org/path/tosomething/";
      request.subtype = "fromContent";
      request.tabid = 5;
      request.url = "https://gnu.org/somotherpath/tosomething/";
      sendResponse = function() {};
      chrome.tabs.update.yields("Saved");
    });
    it("Should handle SavePage Request from Content script", function() {
      request.subtype = "fromContent";
      savetoWM(request, sender, sendResponse);
      assert.ok(chrome.tabs.update.calledOnce);

      assert.ok(
        chrome.tabs.update.calledWith(4, {
          active: false,
          url: "https://web.archive.org/save/https://gnu.org/path/tosomething/"
        })
      );
    });

    it("Should handle SavePage Request from Popup menu when currently loaded page is live site", function() {
      request.subtype = "fromPopup";
      savetoWM(request, sender, sendResponse);
      assert.ok(chrome.tabs.update.calledOnce);
      assert.ok(
        chrome.tabs.update.calledWith(5, {
          active: true,
          url:
            "https://web.archive.org/save/https://gnu.org/somotherpath/tosomething/"
        })
      );
    });

    it("Should handle SavePage Request from Popup menu when currently loaded page is archived version of the site in WM", function() {
      request.subtype = "fromPopup";
      request.url =
        "https://web.archive.org/web/2231421312/https://gnu.org/somotherpath/tosomething/";
      savetoWM(request, sender, sendResponse);
      assert.ok(chrome.tabs.update.calledOnce);
      assert.ok(
        chrome.tabs.update.calledWith(5, {
          active: true,
          url:
            "https://web.archive.org/save/https://gnu.org/somotherpath/tosomething/"
        })
      );
    });

    it("Should clean URL off filters before loading Save Page url", function() {
      var stub = sinon.stub(window, "cleanUrlsOnFilters");
      request.subtype = "fromPopup";
      savetoWM(request, sender, sendResponse);
      stub.restore();
      sinon.assert.calledOnce(stub);
      sinon.assert.calledWithExactly(
        stub,
        "https://gnu.org/somotherpath/tosomething/"
      );
    });

    it("Should increment save counter upon save request success", function() {
      savetoWM(request, sender, sendResponse);
      counts.waybackSavescount = 100;
      savetoWM(request, sender, sendResponse);
      expect(counts.waybackSavescount).to.be.eql(101);
    });

    it("Should add to justSaved Array so that even from excluded sites, saved pages are shown from archive", function() {
      let index = justSaved.length;
      var stub = sinon.stub(Date, "now").returns("1533900352142");
      request.subtype = "fromPopup";
      savetoWM(request, sender, sendResponse);

      expect(justSaved[index]).to.be.eql(
        "https://gnu.org/somotherpath/tosomething/" +
          "==WBE==" +
          "1533900352142"
      );
      request.url =
        "https://web.archive.org/web/213123123/https://fsf.org/somotherpath/tosomething/";
      savetoWM(request, sender, sendResponse);
      stub.restore();
      expect(justSaved[index + 1]).to.be.eql(
        "https://fsf.org/somotherpath/tosomething/" +
          "==WBE==" +
          "1533900352142"
      );
    });
  });

  describe("Logging setup for debugging", function() {
    beforeEach(function() {
      chrome.flush();
    });
    it("should log only when enabled", function() {
      var fake = sinon.fake();

      sinon.replace(console, "log", fake);

      log.enabled = true;
      let msg = "hello";
      log(msg);
      log.enabled = false;
      sinon.restore();
      expect(fake.callCount).to.be.eql(1);
      expect(fake.lastArg).to.include("WaybackEverywhere: hello at ");
    });

    it("Update logging function should enable or disable logging", function() {
      var fake = sinon.fake();

      sinon.replace(console, "log", fake);

      chrome.storage.local.get
        .withArgs({ logging: false })
        .yields({ logging: true });
      updateLogging();
      log.enabled = false;
      sinon.restore();
      expect(fake.callCount).to.be.eql(1);
      expect(fake.lastArg).to.include(
        "WaybackEverywhere: logging for Wayback Everywhere toggled to..true"
      );
    });
  });

  describe("Should handle incoming messages from popup, settings page and content script", function() {
    var request, sender, redirects, obj;
    function sendResponse(obj1) {
      obj = obj1;
    }

    beforeEach(function() {
      chrome.flush();
      request = {};
      sender = { tab: {} };
      request = {
        data: "some data for notification",
        type: "",
        subtype: "fromPopup",
        url: "https://web.archive.org/web/20180810112330/http://www.gnu.org/",
        tabid: 11,
        category: "AddtoExcludesList"
      };
      sender.tab.id = 2;
      sender.tab.url = "https://web.archive.org/web/2323/https://gnu.org";
      redirects = [
        {
          description: "Wayback Everywhere Rules",
          exampleUrl: "http://example.org",
          exampleResult: "https://web.archive.org/web/2/http://example.org",
          error: null,
          appliesTo: ["main_frame"],
          includePattern: "*",
          excludePattern:
            "*web.archive.org*|*archive.org*|*gnu.org*|*quora.com*"
        }
      ];
    });

    it("Should handle getRedirects message and provide redirect rules from storage", function() {
      request.type = "getredirects";
      chrome.storage.local.get.yields(redirects);
      MessageHandler(request, sender, sendResponse);
      assert.ok(chrome.storage.local.get.calledOnce);
      assert.ok(chrome.storage.local.get.calledWith({ redirects: [] }));
      expect(obj).to.be.eql(redirects);
    });

    it("Should handle saveredirects message and save redirects to storage", function() {
      request.type = "saveredirects";
      chrome.storage.local.set.yields("saved");
      MessageHandler(request, sender, sendResponse);
      assert.ok(chrome.storage.local.set.calledOnce);
      assert.ok(chrome.storage.local.set.calledWith(request));
      expect(obj).to.be.eql({
        message: "Redirects saved"
      });
    });

    it("Should handle excludethisSite message and call Excludesite function", function() {
      request.type = "excludethisSite";
      var stub = sinon.stub(window, "addSitetoExclude");
      MessageHandler(request, sender, sendResponse);
      stub.restore();
      sinon.assert.calledWithExactly(stub, request, sender, sendResponse);
    });

    it("Should handle notify message and trigger notifications", function() {
      request.type = "notify";
      MessageHandler(request, sender, sendResponse);
      assert.ok(chrome.notifications.create.calledOnce);
      assert.ok(
        chrome.notifications.create.calledWithExactly({
          type: "basic",
          title: "Wayback Everywhere",
          message: "some data for notification"
        })
      );
    });

    it("Should handle doFullReset message to do settings reset", function() {
      request.type = "doFullReset";
      var fake = sinon.fake();
      sinon.replace(window, "loadinitialdata", fake);
      MessageHandler(request, sender, sendResponse);
      sinon.restore();
      sinon.assert.calledOnce(fake);
      expect(fake.lastArg).to.be.eql("doFullReset");
    });

    it("should handle savetoWM message and load Save url", function() {
      request.type = "savetoWM";
      var stub = sinon.stub(window, "savetoWM");
      MessageHandler(request, sender, sendResponse);
      stub.restore();
      sinon.assert.calledOnce(stub);
      sinon.assert.calledWith(stub, request, sender, sendResponse);
    });
  });

  describe("Monitor stored value changes", function() {
    var changes, namespace;

    beforeEach(function() {
      chrome.flush();
      redirects = [
        {
          description: "Wayback Everywhere Rules",
          exampleUrl: "http://example.org",
          exampleResult: "https://web.archive.org/web/2/http://example.org",
          error: null,
          appliesTo: ["main_frame"],
          includePattern: "*",
          excludePattern:
            "*web.archive.org*|*archive.org*|*gnu.org*|*quora.com*"
        }
      ];
      changes = {
        disabled: {},
        redirects: { newValue: redirects },
        logging: {},
        tempIncludes: {},
        tempExcludes: {},
        readermode: {},
        filters: {},
        isLoadAllLinksEnabled: {},
        counts: { newValue: {}, oldValue: {} },
        commonExtensions: {}
      };
      changes.counts.newValue.archivedPageLoadsCount = 100;
      changes.counts.newValue.waybackSavescount = 50;
      changes.counts.oldValue.archivedPageLoadsCount = 80;
      changes.counts.oldValue.waybackSavescount = 30;
      namespace = "";
    });

    it("should react to appDisabled true", function() {
      changes.disabled.newValue = true;
      var stub = sinon.stub(window, "setUpRedirectListener");

      changes.disabled.oldValue = !changes.disabled.newValue;
      monitorChanges(changes, namespace);
      stub.restore();
      expect(appDisabled).to.be.eql(true);
      expect(chrome.webRequest.onBeforeRequest.removeListener).to.be.calledOnce;
      expect(chrome.webRequest.onBeforeRequest.removeListener).to.be.calledWith(
        checkRedirects
      );
      expect(stub).to.not.be.called; // Never setup redirect listener if appdisabled..
    });

    it("should react to appDisabled false i.e enabled", function() {
      changes.disabled.newValue = false;
      changes.disabled.oldValue = !changes.disabled.newValue;
      var stub = sinon.stub(window, "setUpRedirectListener");
      monitorChanges(changes, namespace);
      expect(appDisabled).to.be.eql(false);
      stub.restore();
      expect(stub).to.be.calledTwice; //once for changes.disabled, once for changes.redirects
    });

    it("should react to redirect rule changes", function() {
      appDisabled = false;
      var stub = sinon.stub(window, "setUpRedirectListener");
      monitorChanges(changes, namespace);
      stub.restore();
      expect(stub).to.be.calledTwice; //once for changes.disabled, once for changes.redirects
    });

    it("should react to logging rule changes", function() {
      appDisabled = false;
      var stub = sinon.stub(window, "updateLogging");
      monitorChanges(changes, namespace);
      stub.restore();
      expect(stub).to.be.calledOnce; //once for changes.disabled, once for changes.redirects
    });

    it("should react to tempincludes and tempExcludes changes", function() {
      changes.tempIncludes.newValue = ["|*fsf.org*"];
      changes.tempExcludes.newValue = ["|*gnu.org*"];

      monitorChanges(changes, namespace);
      expect(tempIncludes).to.be.eql(["|*fsf.org*"]);
      expect(tempExcludes).to.be.eql(["|*gnu.org*"]);
    });

    it("should react to changes in common file extensions", function() {
      changes.commonExtensions.newValue = [".appImage"];
      monitorChanges(changes, namespace);
      expect(commonExtensions).to.be.eql([".appImage"]);
    });
  });

  describe("Checking if domain is in any list", function() {
    var redirects;
    beforeEach(function() {
      chrome.flush();
      redirects = [
        {
          description: "Wayback Everywhere Rules",
          exampleUrl: "http://example.org",
          exampleResult: "https://web.archive.org/web/2/http://example.org",
          error: null,
          appliesTo: ["main_frame"],
          includePattern: "*",
          excludePattern:
            "*web.archive.org*|*archive.org*|*gnu.org*|*quora.com*"
        }
      ];
    });
    it("should return if domain is only in Excludes List", function() {
      excludePatterns = getRegex(redirects[0].excludePattern);
      var response = checkifDomaininAnyList("gnu.org");
      expect("domainInExcludes").to.be.eql(response);
    });

    it("should return if domain is only in TempExcludes List", function() {
      tempIncludes = ["|*somexample.com*"];
      //excludePatterns = getRegex(redirects[0].excludePattern);
      var response = checkifDomaininAnyList("somexample.com");
      expect("domainTempIncluded").to.be.eql(response);
    });

    it("should return if domain is only in TempExcludes List", function() {
      tempExcludes = ["|*someotherexample.com*"];
      //excludePatterns = getRegex(redirects[0].excludePattern);
      var response = checkifDomaininAnyList("someotherexample.com");
      expect("domainTempExcluded").to.be.eql(response);
    });

    it("should handle if domain is not in any list", function() {
      tempIncludes = ["|*somexample.com*"];
      tempExcludes = ["|*someotherexample.com*"];
      excludePatterns = getRegex(redirects[0].excludePattern);
      var response = checkifDomaininAnyList("google.com");

      expect("notInAnyList").to.be.eql(response);
    });

    it("should handle empty domain or undefined", function() {
      let domain = "";
      tempIncludes = ["|*somexample.com*"];
      tempExcludes = ["|*someotherexample.com*"];
      excludePatterns = getRegex(redirects[0].excludePattern);
      var response = checkifDomaininAnyList(domain);
      expect("notInAnyList").to.be.eql(response);
      let domain2;
      let response2 = checkifDomaininAnyList(domain2);
      expect("notInAnyList").to.be.eql(response);
    });
  });

  // -- Add Describes above this --
});

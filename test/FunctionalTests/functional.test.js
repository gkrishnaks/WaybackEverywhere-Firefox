const path = require("path");
const assert = require("assert");

const webExtensionsGeckoDriver = require("webextensions-geckodriver");
const { webdriver, firefox } = webExtensionsGeckoDriver;
const { until, By } = webdriver;
let Context = firefox.Context;
const manifestPath = path.resolve(
  path.join(__dirname, "../../src/manifest.json")
);

describe("Wayback Everywhere", () => {
  let geckodriver, helper;

  before(async () => {
    const webExtension = await webExtensionsGeckoDriver(manifestPath);
    geckodriver = webExtension.geckodriver;

    //In firefox, we use page action and not browser action. Use this for chrome version
    // see why : https://gitlab.com/gkrishnaks/WaybackEverywhere-Firefox/issues/2
    /*  helper = {
      toolbarButton() {
  //      geckodriver.setContext(Context.CHROME);
        return geckodriver.wait(until.elementLocated(
          By.id('gokulakrishnaks_gmail_com-browser-action')
        ), 2000);
      }
    }; */
  });
  //In firefox, we use page action and not browser action. Use this for chrome version
  // see why : https://gitlab.com/gkrishnaks/WaybackEverywhere-Firefox/issues/2
  /* it('should have a Browser action Button', async () => {
    const button = await helper.toolbarButton();
    assert.equal(await button.getAttribute('tooltiptext'), 'Wayback Everywhere');
  });  */

  it("should load archived version of example.org", async () => {
    await geckodriver.sleep(3000);
    geckodriver.setContext(Context.CONTENT);
    await geckodriver.get("http://example.com");
    let currentUrl = await geckodriver.getCurrentUrl();
    assert(currentUrl, " is truthy");
    // console.log(currentUrl);
    assert(validateArchiveUrl(currentUrl, "example.com"), "is true");
  });

  it("should load live version of status.fsf.org", async () => {
    //   await geckodriver.sleep(6000);
    geckodriver.setContext(Context.CONTENT);
    await geckodriver.get("http://status.fsf.org");
    let currentUrl = await geckodriver.getCurrentUrl();
    assert(currentUrl, " is truthy");
    assert(validatePlainUrl(currentUrl, "status.fsf.org"), "is true");
  });

  it("should load live version if web.archive.org prefixed url is loaded and domain is in Excludes", async () => {
    geckodriver.setContext(Context.CONTENT);
    await geckodriver.get("https://web.archive.org/web/2/https://frama.link");
    let currentUrl = await geckodriver.getCurrentUrl();
    assert(currentUrl, " is truthy");
    assert(validatePlainUrl(currentUrl, "frama.link"), "is true");
  });

  it("should auto-Addtoexcludes List and load live version if a domain that is not supported by wayback is routed to WM", async () => {
    geckodriver.setContext(Context.CONTENT);
    await geckodriver.get("https://www.quora.com");
    let currentUrl = await geckodriver.getCurrentUrl();
    assert(currentUrl, " is truthy");
    //assert(validateArchiveSaveUrl(currentUrl, "omgubuntu.co.uk"), "is true");
    await geckodriver.sleep(5000);

    await geckodriver.get(
      "https://web.archive.org/web/2/https://www.quora.com/about"
    );
    let currentUrl2 = await geckodriver.getCurrentUrl();
    assert(currentUrl2, " is truthy");
    assert(
      validatePlainUrl(currentUrl2, "quora.com"),
      "is true for validatePlainUrl"
    );
  });

  it("should autoaddtoTempExcludes List and load live version if archived url has login or other selectors in url", async () => {
    geckodriver.setContext(Context.CONTENT);
    await geckodriver.get(
      "https://web.archive.org/web/2/https://example.com/login"
    );
    await geckodriver.sleep(5000);

    let currentUrl = await geckodriver.getCurrentUrl();
    assert(currentUrl, " is truthy");
    //assert(validateArchiveSaveUrl(currentUrl, "omgubuntu.co.uk"), "is true");
    assert(
      validatePlainUrl(currentUrl, "example.com"),
      "is true for validatePlainUrl"
    );
  });

  // if the url is used once, cannot be used again. Commenting this case for now.
  /*( it("should auto-add Excludes List and load live version if a site does medium global identity redirect to avoid endless loop from WM", async () => {
    geckodriver.setContext(Context.CONTENT);
    await geckodriver.get(
      "https://m.signalvnoise.com/new-in-basecamp-see-where-projects-really-stand-with-the-hill-chart-ca5a6c47e987"
    );
    await geckodriver.sleep(9000);

    let currentUrl = await geckodriver.getCurrentUrl();
    assert(currentUrl, " is truthy");
    assert(
      validatePlainUrl(currentUrl, "m.signalvnoise.com"),
      "is true for validatePlainUrl"
    );
  });  */

  // This page is not available on the web because of server error
  /*

  it("should auto-AddtoTempexcludes List and load live version if a domain that is not supported by wayback is routed to WM", async () => {
    geckodriver.setContext(Context.CONTENT);
    await geckodriver.get("https://studentblogs.warwick.ac.uk");
    let currentUrl3 = await geckodriver.getCurrentUrl();
    assert(currentUrl3, " is truthy");
    //assert(validateArchiveSaveUrl(currentUrl3, "warwick.ac.uk"), "is true");

    await geckodriver.sleep(5000);
    await geckodriver.get(
      "https://web.archive.org/web/2/https://studetblogs.warwick.ac.uk"
    );
    let currentUrl4 = await geckodriver.getCurrentUrl();
    assert(currentUrl4, " is truthy");
    assert(
      validatePlainUrl(currentUrl4, "warwick.ac.uk"),
      "is true for validatePlainUrl"
    );
  });
*/

  /*
  it('should auto-exclude download links when url ends with a known file extension', async() => {
  //   await geckodriver.sleep(6000);
     geckodriver.setContext(Context.CONTENT);
     await geckodriver.get("https://web.archive.org/web/2/https://www.gnu.org/software/make/manual/make.txt.gz");
     let currentUrl = await geckodriver.getCurrentUrl();
     assert(currentUrl," is truthy");
     //let check1 = validateArchiveUrl(currentUrl, "gnu.org/software");
     await geckodriver.findElement(By.partialLinkText('ASCII text compressed')).click();
     assert(validatePlainUrl(currentUrl,"gnu.org"), "is true");
  }); */

  function validateArchiveUrl(url, expected) {
    if (
      url.indexOf("https://web.archive.org/web") > -1 &&
      url.indexOf(expected) > -1
    ) {
      return true;
    }
    return false;
  }

  function validateArchiveSaveUrl(url, expected) {
          console.log("validatePlainURL received url as " + url);

    if (
      url.indexOf("https://web.archive.org/save") > -1 &&
      url.indexOf(expected) > -1
    ) {
      return true;
    }
    return false;
  }

  function validatePlainUrl(url, expected) {
    console.log("validatePlainURL received url as " + url);
    if (
      url.indexOf(expected) > -1 &&
      url.indexOf("web.archive.org/web") === -1
    ) {
      return true;
    }
    return false;
  }

  after(function() {
    geckodriver.quit();
  });
});

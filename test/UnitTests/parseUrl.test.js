/*
const chai = require('chai')
//const expect = chai.expect
const parseUrl = require('../../js/parseUrl')

      const should = chai.should()
      const expect = chai.expect
*/
describe("URL Parser", function() {
  it("can return live when archived url is passed to function", function() {
    var result = UrlHelper.getHostfromUrl(
      "https://web.archive.org/web/21234/https://gnu.org/manuals/make"
    ).url; // my_add is definied in calculator.js
    expect(result).to.eql("https://gnu.org/manuals/make");
  });

  it("can return hostname when archived url is passed to function", function() {
    var result = UrlHelper.getHostfromUrl(
      "https://web.archive.org/web/21234/https://gnu.org"
    ).hostname; // my_add is definied in calculator.js
    expect(result).to.eql("gnu.org");
  });

  it("can return hostname when live url is passed to function", function() {
    var result = UrlHelper.getHostfromUrl("https://gnu.org/manual/make")
      .hostname; // my_add is definied in calculator.js
    expect(result).to.eql("gnu.org");
  });

  it("can return full url when live url is passed to function", function() {
    var result = UrlHelper.getHostfromUrl("https://gnu.org/manual/make").url; // my_add is definied in calculator.js
    expect(result).to.eql("https://gnu.org/manual/make");
  });

  it("can return live url when save url is passed to function", function() {
    var result = UrlHelper.getHostfromUrl(
      "https://web.archive.org/save/https://gnu.org/manuals/make"
    ).url; // my_add is definied in calculator.js
    expect(result).to.eql("https://gnu.org/manuals/make");
  });

  it("can return live url when save url is passed without https to function", function() {
    var result = UrlHelper.getHostfromUrl(
      "https://web.archive.org/save/http://gnu.org/manuals/make"
    ).url; // my_add is definied in calculator.js
    expect(result).to.eql("http://gnu.org/manuals/make");
  });

  it("can return live url when archive url is passed without https to function", function() {
    var result = UrlHelper.getHostfromUrl(
      "https://web.archive.org/web/201822/http://gnu.org/manuals/make"
    ).url; // my_add is definied in calculator.js
    expect(result).to.eql("http://gnu.org/manuals/make");
  });

  it("can return live url when double http invalid url is passed to function", function() {
    var result = UrlHelper.getHostfromUrl(
      "https://web.archive.org/web/201822/http://http//www.fsf.org/something"
    ).url; // my_add is definied in calculator.js
    expect(result).to.eql("http://www.fsf.org/something");
  });

  it("can return live url when double https invalid url is passed to function", function() {
    var result = UrlHelper.getHostfromUrl(
      "https://web.archive.org/web/201822/https://https//www.fsf.org/something"
    ).url; // my_add is definied in calculator.js
    expect(result).to.eql("https://www.fsf.org/something");
  });

  it("can return live fully qualified url from archived url without www", function() {
    var result = UrlHelper.getHostfromUrl(
      "https://web.archive.org/web/201822/fsf.org/something"
    ).url; // my_add is definied in calculator.js
    expect(result).to.eql("http://fsf.org/something");
  });

  it("should return fully qualified urls if url is excluded", function() {
    var urls = [
      "https://web.archive.org/web/2/https://www.quora.com",
      "https://web.archive.org/web/2/http://www.quora.com",
      "https://web.archive.org/web/2/www.quora.com",
      "https://web.archive.org/web/2/quora.com"
    ];

    expect(UrlHelper.getHostfromUrl(urls[0]).url).to.eql(
      "https://www.quora.com/"
    );
    expect(UrlHelper.getHostfromUrl(urls[1]).url).to.eql(
      "http://www.quora.com/"
    );
    expect(UrlHelper.getHostfromUrl(urls[2]).url).to.eql(
      "http://www.quora.com/"
    );
    expect(UrlHelper.getHostfromUrl(urls[3]).url).to.eql("http://quora.com/");
  });
});

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
var UrlHelper = {};
UrlHelper.getHostfromUrl = url => {
  let parser = document.createElement("a");
  // Urls can look like ..
  /*  var urls=["https://www.google.com/asdasd",
              "http://www.google.com/asdasd",
              "google.com/asdasdasd",
              "https://web.archive.org/web/2321423/https://google.com/asdasd",
              "https://web.archive.org/web/234234/google.com/asdasd",
              "https://web.archive.org/web/234234/https://mail.google.com",
              "https://web.archive.org/web/234234/mail.google.com",
              "https://web.archive.org/save/https://mail.google.com"]
  */
  let temp;
  let url2 = url;

  if (url2.indexOf("web.archive.org") > -1) {
    if (url2.indexOf("archive.org/save") > -1) {
      url2 = url2.replace("/save", "/web/2");
    }
    url2 = url2.split("web.archive.org/").pop();
    let index = url2.indexOf("/");
    //console.log(url2)
    temp = url2.substring(index + 1);
    //console.log(temp)
    temp = temp.substring(temp.indexOf("/") + 1);

    // The if Block below is for this weird error I faced when I loaded https://web.archive.org/web/2/http://fsf.org/
    // in address bar and that somehow resulted in wayback machine adding "http://http//www.fsf.org" as URL which is invalid!
    if (
      temp.indexOf("http://http//") === 0 ||
      temp.indexOf("https://https//") === 0
    ) {
      if (temp.indexOf("http://http//") === 0) {
        temp = temp.replace("http//", "");
      } else {
        temp = temp.replace("https//", "");
      }
    }
  } else {
    temp = url;
  }

  if (temp.indexOf("http://") < 0 && temp.indexOf("https://") < 0) {
    temp = "http://" + temp;
  }
  parser.href = temp;

  let isWww = parser.hostname.indexOf("www.");
  let isWww2 = parser.hostname.indexOf("www2.");
  //Other subdomains are fine, let's just remove www or www2 anyway ..
  let obj = {
    hostname: "",
    url: ""
  };

  if (isWww == 0 || isWww2 == 0) {
    obj.hostname = parser.hostname.substring(parser.hostname.indexOf(".") + 1);
  } else {
    obj.hostname = parser.hostname;
  }
  obj.url = parser.href;
  //  console.log(obj);

  return obj;
};

UrlHelper.hasRepeatedLetters = str => {
  var patt = /^([a-z.A-Z])\1+$/;
  var result = patt.test(str);
  return result;
};

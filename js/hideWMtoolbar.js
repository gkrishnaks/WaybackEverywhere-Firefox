//to hide wayback hideWaybackToolbat
// We hide for 2 cases
// 1. In desktop firefox user ties to click save as pdf button
// 2. In Firefox Android, as there`s limited screen space,  let's hide it for Android firefox


chrome.runtime.onMessage.addListener(msgHandler);

function msgHandler(request, sender, sendResponse) {
    // console.log(' Received : ' + JSON.stringify(request));
    if (request.type == 'hideWaybackToolbar') {
      hideToolbar(sendResponse);
    }
    return false; //sync, let's wait till toolbar hidden
  }



if (navigator.userAgent.match(/Android/i)) {
  hideWaybackToolbar();
chrome.runtime.onMessage.removeListener(msgHandler);
//remove listener as android firefox does not support save page as pdf anyway
}


function hideToolbar(sendResponse) {
  hideWaybackToolbar();
  sendResponse('toolbar hidden');
}


function hideWaybackToolbar() {
  let c = document.getElementById("wm-tb-close");
  if (c != null) {
    c.click();
  }
}



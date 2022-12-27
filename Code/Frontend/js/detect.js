// Inject the iframe to retrieve camera sources
//注入iframe以检索相机源
var iframe = document.createElement('iframe');
iframe.style.display = "none";
iframe.src = chrome.extension.getURL('./html/sources.html');
iframe.allow = "camera";
document.body.appendChild(iframe);

var iframe = document.createElement('iframe');
iframe.style.display = "none";
iframe.src = chrome.extension.getURL('./html/audiosources.html');
iframe.allow = "microphone";
document.body.appendChild(iframe);
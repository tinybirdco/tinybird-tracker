var e=window.localStorage;function n(r,o,i,s){i=i||"tracker_ga";var a=function(e){for(var n=document.cookie.split(";"),t=0;t<n.length;++t){for(var r=n[t];" "===r.charAt(0);)r=r.substring(1,r.length);if(0===r.indexOf("_track="))return r.substring("_track=".length,r.length)}return null}(),u=JSON.parse(e.getItem("tinybird_events")||"[]"),c=t(),l=!1;function d(n){if(!l)if(u.length>0){l=!0;var t=(s||"https://api.tinybird.co")+"/v0/datasources?mode=append&name=tracker&token="+r,o=new FormData;o.append("csv",u.map(function(e){return e.map(function(e){return"string"==typeof e?('"'===(e=e.replace(/\"/g,'""'))[0]&&'"'===e[e.length-1]||(e='"'+e+'"'),e):e}).join(",")}).join("\n")),function(e,n){return n=n||{},new Promise(function(t,r){var o=new XMLHttpRequest,i=[],s=[],a={},u=function(){return{ok:2==(o.status/100|0),statusText:o.statusText,status:o.status,url:o.responseURL,text:function(){return Promise.resolve(o.responseText)},json:function(){return Promise.resolve(JSON.parse(o.responseText))},blob:function(){return Promise.resolve(new Blob([o.response]))},clone:u,headers:{keys:function(){return i},entries:function(){return s},get:function(e){return a[e.toLowerCase()]},has:function(e){return e.toLowerCase()in a}}}};for(var c in o.open(n.method||"get",e,!0),o.onload=function(){o.getAllResponseHeaders().replace(/^(.*?):[^\S\n]*([\s\S]*?)$/gm,function(e,n,t){i.push(n=n.toLowerCase()),s.push([n,t]),a[n]=a[n]?a[n]+","+t:t}),t(u())},o.onerror=r,o.withCredentials="include"==n.credentials,n.headers)o.setRequestHeader(c,n.headers[c]);o.send(n.body||null)})}(t,{method:"POST",body:o}).then(function(e){return e.json()}).then(function(n){n?(u=[],e.setItem("tinybird_events","[]"),f(2e3,5)):i(),l=!1}).catch(function(){i()})}else f(2e3,5);function i(){n>0&&(l=!1,f(2e3,n-1))}}function f(e,n){setTimeout(function(){d(n)},e)}function x(){e.setItem("tinybird_events",JSON.stringify(u)),d()}a||(a="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(e){var n=16*Math.random()|0;return("x"==e?n:3&n|8).toString(16)}),document.cookie="_track="+(a||"")+"; path=/"),f(2e3,5),n.flush=d,window[i]=function(){var e=[t(),c,o,a,document.location.href,encodeURIComponent(navigator.userAgent)].concat(Array.prototype.slice.call(arguments));e.length<14&&(e=e.concat(Array(14-e.length).fill(""))),u.push(e),"pageload"===arguments[0]&&d()},window.addEventListener("beforeunload",x),window.addEventListener("unload",x,!1)}function t(e){return(e=e||new Date).toISOString().replace("T"," ").split(".")[0]}window.tracker=n;export default n;
//# sourceMappingURL=tinybird-tracker.modern.js.map

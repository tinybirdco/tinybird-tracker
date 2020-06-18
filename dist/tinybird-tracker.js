var tinybirdTrackerJs=function(){var e=function(e){if(e&&e.document.currentScript){var n,t,r,o,i,a=e.localStorage,s=function(e){for(var n=document.cookie.split(";"),t=0;t<n.length;++t){for(var r=n[t];" "===r.charAt(0);)r=r.substring(1,r.length);if(0===r.indexOf("_track="))return r.substring("_track=".length,r.length)}return null}(),c=JSON.parse(a.getItem("tinybird_events")||"[]"),u=h(),l=!1;s||(s="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(e){var n=16*Math.random()|0;return("x"==e?n:3&n|8).toString(16)}),document.cookie="_track="+(s||"")+"; path=/"),e.addEventListener("beforeunload",x),e.addEventListener("unload",x,!1),function(){if(!g("t"))throw new Error("token is needed for sending events");n=decodeURIComponent(g("t")),t=g("a")||"main",o=g("f")||"tbt",r=g("d")||"tracker",i=g("h")&&decodeURIComponent(g("h"))||"https://api.tinybird.co"}(),p(e[o]),e[o]={push:function(e){p(arguments.length>1?Array.prototype.slice.call(arguments):[e])}},f(2e3,5)}function d(e){if(!l)if(c.length>0){l=!0;var t=i+"/v0/datasources?mode=append&name="+r+"&token="+n+"&dialect_escapechar="+encodeURIComponent(","),o=new FormData;o.append("csv",c.map(function(e){return e.map(function(e){return"string"==typeof e?('"'===(e=e.replace(/\"/g,'""'))[0]&&'"'===e[e.length-1]||(e='"'+e+'"'),e):e}).join(",")}).join("\n")),function(e,n){return n=n||{},new Promise(function(t,r){var o=new XMLHttpRequest,i=[],a=[],s={},c=function(){return{ok:2==(o.status/100|0),statusText:o.statusText,status:o.status,url:o.responseURL,text:function(){return Promise.resolve(o.responseText)},json:function(){return Promise.resolve(JSON.parse(o.responseText))},blob:function(){return Promise.resolve(new Blob([o.response]))},clone:c,headers:{keys:function(){return i},entries:function(){return a},get:function(e){return s[e.toLowerCase()]},has:function(e){return e.toLowerCase()in s}}}};for(var u in o.open(n.method||"get",e,!0),o.onload=function(){o.getAllResponseHeaders().replace(/^(.*?):[^\S\n]*([\s\S]*?)$/gm,function(e,n,t){i.push(n=n.toLowerCase()),a.push([n,t]),s[n]=s[n]?s[n]+","+t:t}),t(c())},o.onerror=r,o.withCredentials="include"==n.credentials,n.headers)o.setRequestHeader(u,n.headers[u]);o.send(n.body||null)})}(t,{method:"POST",body:o}).then(function(e){return e.json()}).then(function(e){e?(c=[],a.setItem("tinybird_events","[]"),f(2e3,5)):s(),l=!1}).catch(function(){s()})}else f(2e3,5);function s(){e>0&&(l=!1,f(2e3,e-1))}}function f(e,n){setTimeout(function(){d(n)},e)}function p(e){function n(e){if(!Array.isArray(e))throw new Error("Only array events are allowed");!function(){var e=Array.prototype.slice.call(arguments)[0],n=[h(),u,t,s,document.location.href,"Mozilla/5.0 (Linux; Android 9; SM-A505GT Build/PPR1.180610.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/74.0.3729.157 Mobile Safari/537.36 Instagram 93.1.0.19.102 Android (28/9; 420dpi; 1080x2218; samsung; SM-A505GT; a50; exynos9610; pt_BR; 154400383)"].concat(e);n.length<14&&(n=n.concat(Array(14-n.length).fill(""))),c.push(n),"pageload"===e[0]&&d(5)}(e)}if(e){if(!Array.isArray(e))throw new Error("Events can only be sent as an array");for(var r=0,o=e.length;r<o;r++)n(Array.prototype.slice.call(e[r]))}}function x(){a.setItem("tinybird_events",JSON.stringify(c)),d()}function h(e){return(e=e||new Date).toISOString().replace("T"," ").split(".")[0]}function g(n,t){t||(t=e.document.currentScript.src||""),n=n.replace(/[\[\]]/g,"\\$&");var r=new RegExp("[?&]"+n+"(=([^&#]*)|&|#|$)").exec(t);return r?r[2]?decodeURIComponent(r[2].replace(/\+/g," ")):"":null}};return e(window),e}();
//# sourceMappingURL=tinybird-tracker.js.map

var tinybirdTrackerJs=function(){var e,t,n,r,o=this.localStorage,i="https://api.tinybird.co",s=function(e){for(var t=document.cookie.split(";"),n=0;n<t.length;++n){for(var r=t[n];" "===r.charAt(0);)r=r.substring(1,r.length);if(0===r.indexOf("_track="))return r.substring("_track=".length,r.length)}return null}(),a=JSON.parse(o.getItem("tinybird_events")||"[]"),c=x(),u=!1;function l(t){if(!u)if(a.length>0){u=!0;var i=n+"/v0/datasources?mode=append&name="+e+"&token="+r,s=new FormData;s.append("csv",a.map(function(e){return e.map(function(e){return"string"==typeof e?('"'===(e=e.replace(/\"/g,'""'))[0]&&'"'===e[e.length-1]||(e='"'+e+'"'),e):e}).join(",")}).join("\n")),function(e,t){return t=t||{},new Promise(function(n,r){var o=new XMLHttpRequest,i=[],s=[],a={},c=function(){return{ok:2==(o.status/100|0),statusText:o.statusText,status:o.status,url:o.responseURL,text:function(){return Promise.resolve(o.responseText)},json:function(){return Promise.resolve(JSON.parse(o.responseText))},blob:function(){return Promise.resolve(new Blob([o.response]))},clone:c,headers:{keys:function(){return i},entries:function(){return s},get:function(e){return a[e.toLowerCase()]},has:function(e){return e.toLowerCase()in a}}}};for(var u in o.open(t.method||"get",e,!0),o.onload=function(){o.getAllResponseHeaders().replace(/^(.*?):[^\S\n]*([\s\S]*?)$/gm,function(e,t,n){i.push(t=t.toLowerCase()),s.push([t,n]),a[t]=a[t]?a[t]+","+n:n}),n(c())},o.onerror=r,o.withCredentials="include"==t.credentials,t.headers)o.setRequestHeader(u,t.headers[u]);o.send(t.body||null)})}(i,{method:"POST",body:s}).then(function(e){return e.json()}).then(function(e){e?(a=[],o.setItem("tinybird_events","[]"),f(2e3,5)):c(),u=!1}).catch(function(){c()})}else f(2e3,5);function c(){t>0&&(u=!1,f(2e3,t-1))}}function f(e,t){setTimeout(function(){l(t)},e)}function d(o){function u(o){if(!Array.isArray(o))throw new Error("Only array events are allowed");if(!o.length)throw new Error("Event type is needed");switch(o[0]){case"init":!function(){var o=Array.prototype.slice.call(arguments);if(!o[0][0])throw new Error("token is needed for sending events");if(r)throw new Error("tracker already initialized");r=o[0][0],t=o[0][1]||"main",e=o[0][2]||"tracker",n=o[0][3]||i}(o.slice(1));break;case"send":!function(){var e=[x(),c,t,s,document.location.href,navigator.userAgent].concat(Array.prototype.slice.call(arguments)[0]);e.length<14&&(e=e.concat(Array(14-e.length).fill(""))),a.push(e),"pageload"===arguments[0]&&l()}(o.slice(1));break;case"flush":l();break;default:throw new Error(o[0]+" type does not exist")}}if(!Array.isArray(o))throw new Error("Events can only be sent as an array");for(var f=0,d=o.length;f<d;f++)u(Array.prototype.slice.call(o[f]))}function h(){o.setItem("tinybird_events",JSON.stringify(a)),l()}function x(e){return(e=e||new Date).toISOString().replace("T"," ").split(".")[0]}s||(s="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(e){var t=16*Math.random()|0;return("x"==e?t:3&t|8).toString(16)}),document.cookie="_track="+(s||"")+"; path=/"),this.addEventListener("beforeunload",h),this.addEventListener("unload",h,!1),d(this.tbt.q),this.tbt=function(){d([arguments])},f(2e3,5)}();
//# sourceMappingURL=tinybird-tracker.js.map

!function(){var e="/VxvkyYzP+g99/adnSjSgROcr5MovXOHo82WGCB4XZs=",n=["https://article.biliimg.com/bfs/article/2cd47d31fdb293195a8edf0e7a6595aa897e98c0.png","https://pic2.zhimg.com/80/v2-7536fabbb0e9978dab2533f830f88e58.png"],t=120;function r(e){return e.split("?")[0].replace(/[^/]+$/,"")}self.document?function(){var o=document.documentElement;function a(e){var n=document.getElementsByTagName("noscript");n.length>0&&(e=n[0].innerHTML),o.innerHTML=e}var i,c=document.currentScript,s=c.src;if(s){var u=navigator.serviceWorker;if(!u)return void a("Service Worker is not supported");var f=u.register(s)["catch"]((function(e){a(e.message)}));i=r(s)}else i=c.dataset.root;function l(n,r){var o=JSON.stringify({hash:e,time:Date.now()}),a=new Response(o),c=[r.put(i+".cache-info",a),f],s=function(e){var n=e.indexOf(13),r=e.subarray(0,n),o=(new TextDecoder).decode(r),a=JSON.parse(o),i=n+1;for(var c in a){var s=a[c],u=/\.html$/.test(c)?5:t;s["cache-control"]="max-age="+u;var f=s["content-length"],l=e.subarray(i,i+f);a[c]=new Response(l,{headers:s}),i+=f}return a}(n);for(var u in s)a=s[u],c.push(r.put(i+u,a));Promise.all(c).then((function(){location.reload()}))}function h(n){n?crypto.subtle.digest("SHA-256",n).then((function(t){var r=new Uint8Array(t),o=btoa(String.fromCharCode.apply(null,r));if(e!==o)return console.warn("[web2img] bad hash. exp:",e,"but got:",o),void m();var a,i,c,s=(a=new Uint32Array(n),i=new Uint8Array(3*a.length),c=0,a.forEach((function(e){i[c++]=e,i[c++]=e>>8,i[c++]=e>>16})),i);caches["delete"](".web2img").then((function(){caches.open(".web2img").then((function(e){l(s,e)}))}))})):m()}var d=function(e){var n=e.data,t=new Image;t.onload=function(){clearInterval(r);var e=document.createElement("canvas");e.width=t.width,e.height=t.height;var o=e.getContext("2d");o.drawImage(t,0,0);var a=o.getImageData(0,0,t.width,t.height).data.buffer;2===n.privacy?parent.postMessage(a,"*",[a]):h(a)},t.onerror=function(){clearInterval(r),2===n.privacy?parent.postMessage("","*"):h()},1===n.privacy&&(t.referrerPolicy="no-referrer"),t.crossOrigin=1,t.src=n.url;var r=setTimeout((function(){console.log("[web2img] timeout:",n.url),t.onerror(),t.onerror=t.onload=null,t.src=""}),n.timeout)},p=document.createElement("iframe");p.src="data:text/html,<script>onmessage="+d+"<\/script>",p.style.display="none",p.onload=m,o.appendChild(p);var g=p.contentWindow;function m(){var e=n.shift();if(e){var t={url:e,privacy:2,timeout:1e4};g.postMessage(t,"*")}else a("failed to load resources")}self.onmessage=function(e){e.source===g&&h(e.data)}}():function(){var e,n=location.href,t=r(n),o=1;function a(e){return caches.open(".web2img").then((function(n){return n.match(e)}))}function i(){a(t+".cache-info").then((function(t){t&&t.json().then((function(t){Date.now()-t.time<12e4||("cache"in Request.prototype?fetch(n,{cache:"no-cache"}):fetch(n+"?t="+Date.now())).then((function(n){n.text().then((function(n){-1===n.indexOf(t.hash)&&(e=n,console.log("[web2img] new version found"))}))}))}))}))}setInterval(i,12e4),onfetch=function(n){o&&(o=0,i());var r=n.request;if(!r.url.indexOf(t)){var c;if(e&&"navigate"===r.mode)c=new Response('<script data-root="'+t+'">'+e+"<\/script>",{headers:{"content-type":"text/html"}}),e="",console.log("[web2img] updating");else{var s=new URL(r.url).pathname.replace(/\/{2,}/g,"/").replace(/\/$/,"/index.html");c=a(s).then((function(e){return e||a(t+"404.html").then((function(e){return e||new Response("file not found: "+s,{status:404})}))}))}n.respondWith(c)}},oninstall=function(){skipWaiting()}}()}();
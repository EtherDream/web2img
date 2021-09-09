function pageEnv() {
  var container = document.documentElement

  function fallback(html) {
    var noscript = document.getElementsByTagName('noscript')
    if (noscript.length > 0) {
      html = noscript[0].innerHTML
    }
    container.innerHTML = html
  }

  function reload() {
    location.reload()
  }

  var currentScript = document.currentScript
  var jsUrl = currentScript.src
  var rootPath

  if (jsUrl) {
    var sw = navigator.serviceWorker
    if (!sw) {
      fallback('Service Worker is not supported')
      return
    }
    var swPending = sw.register(jsUrl).catch(function(err) {
      fallback(err.message)
    })
    rootPath = getRootPath(jsUrl)
  } else {
    rootPath = currentScript.dataset.root
  }

  function parseImgBuf(buf) {
    if (!buf) {
      loadNextUrl()
      return
    }
    crypto.subtle.digest('SHA-256', buf).then(function(digest) {
      var hashBin = new Uint8Array(digest)
      var hashB64 = btoa(String.fromCharCode.apply(null, hashBin))
      if (typeof HASH !== 'undefined' && HASH !== hashB64) {
        loadNextUrl()
        return
      }
      var bytes = decode1Px3Bytes(buf)

      caches.delete('.web2img').then(function() {
        caches.open('.web2img').then(function(cache) {
          unpack(bytes, cache).then(function() {
            if (swPending) {
              swPending.then(reload)
            } else {
              reload()
            }
          })
        })
      })
    })
  }

  // run in iframe
  var loadImg = function(e) {
    var img = new Image()

    img.onload = function() {
      var canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height

      var ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      var imgData = ctx.getImageData(0, 0, img.width, img.height)
      var buf = imgData.data.buffer

      // inline
      if (typeof PRIVACY === 'undefined' || PRIVACY === 2) {
        parent.postMessage(buf, '*', [buf])
      } else {
        parseImgBuf(buf)
      }
    }

    img.onerror = function() {
      if (typeof PRIVACY === 'undefined' || PRIVACY === 2) {
        parent.postMessage('', '*')
      } else {
        parseImgBuf()
      }
    }
    if (typeof PRIVACY !== 'undefined' && PRIVACY === 1) {
      img.referrerPolicy = 'no-referrer'
    }
    img.crossOrigin = 1
    img.src = e.data
  }

  if (PRIVACY === 2) {
    // hide origin header
    var iframe = document.createElement('iframe')

    if (typeof RELEASE !== 'undefined') {
      iframe.src = 'data:text/html,<script>onmessage=' + loadImg + '</script>'
    } else {
      iframe.src = 'data:text/html;base64,' + btoa('<script>onmessage=' + loadImg + '</script>')
    }
    iframe.style.display = 'none'
    iframe.onload = loadNextUrl

    container.appendChild(iframe)
    var iframeWin = iframe.contentWindow

    self.onmessage = function(e) {
      if (e.source === iframeWin) {
        parseImgBuf(e.data)
      }
    }
  } else {
    loadNextUrl()
  }

  function loadNextUrl() {
    var url = URLS.shift()
    if (!url) {
      fallback('failed to load resources')
      return
    }
    if (PRIVACY === 2) {
      iframeWin.postMessage(url, '*')
    } else {
      loadImg({data: url})
    }
  }

  function decode1Px3Bytes(pixelBuf) {
    var u32 = new Uint32Array(pixelBuf)
    var out = new Uint8Array(u32.length * 3)
    var p = 0
    u32.forEach(function(rgba) {
      out[p++] = rgba
      out[p++] = rgba >>  8
      out[p++] = rgba >> 16
    })
    return out
  }

  function unpack(bytes, cache) {
    var confEnd = bytes.indexOf(13)   // '\r'
    var confBin = bytes.subarray(0, confEnd)
    var confStr = new TextDecoder().decode(confBin)
    var confObj = JSON.parse(confStr)

    var offset = confEnd + 1
    var pendings = []

    for (var file in confObj) {
      var headers = confObj[file]
      headers['cache-control'] = 'max-age=60'

      var len = headers['content-length']
      var bin = bytes.subarray(offset, offset + len)
      var req = new Request(rootPath + file)
      var res = new Response(bin, {
        headers: headers
      })
      pendings.push(
        cache.put(req, res)
      )
      offset += len
    }
    return Promise.all(pendings)
  }
}

function swEnv() {
  var jsUrl = location.href
  var rootPath = getRootPath(jsUrl)
  var hasUpdate
  var currJs

  // check update
  setInterval(function() {
    var p = 'cache' in Request.prototype
      ? fetch(jsUrl, {cache: 'no-cache'})
      : fetch(jsUrl + '?t=' + Date.now())

    p.then(function(res) {
      res.text().then(function(js) {
        if (currJs !== js) {
          if (currJs) {
            hasUpdate = 1
            console.log('update')
          }
          currJs = js
        }
      })
    })
  }, 1000 * 120)

  onfetch = function(e) {
    var req = e.request
    if (req.url.indexOf(rootPath)) {
      // url not starts with rootPath
      return
    }
    var res

    if (hasUpdate && req.mode === 'navigate') {
      var html = '<script data-root="' + rootPath + '">' + currJs + '</script>'
      res = new Response(html, {
        headers: {
          'content-type': 'text/html'
        }
      })
      hasUpdate = 0
    } else {
      var path = new URL(req.url).pathname
        .replace(/\/{2,}/g, '/')
        .replace(/\/$/, '/index.html')

      res = caches.open('.web2img').then(function(cache) {
        return cache.match(path).then(function(res) {
          return res || cache.match(rootPath + '404.html').then(function(res) {
            return res || new Response('file not found: ' + path, {
              status: 404
            })
          })
        })
      })
    }
    e.respondWith(res)
  }
}

function getRootPath(url) {
  // e.g.
  // 'https://mysite.com/'
  // 'https://xx.github.io/path/to/'
  return url.split('?')[0].replace(/[^/]+$/, '')
}

if (self.document) {
  pageEnv()
} else {
  swEnv()
}
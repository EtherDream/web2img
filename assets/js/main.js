function bytesToImgData(bytes) {
  const nPixel = Math.ceil(bytes.length / 3)
  const side = Math.ceil(Math.sqrt(nPixel))
  const u32 = new Uint32Array(side * side)

  // out of bounds => 0
  for (let i = 0, j = 0; i < nPixel; i++, j += 3) {
    u32[i] =                // 0xAABBGGRR
      bytes[j + 0] <<  0 |  // R 
      bytes[j + 1] <<  8 |  // G
      bytes[j + 2] << 16 |  // B
      0xff000000            // A (255)
  }
  u32.fill(0xff000000, nPixel)

  const u8 = new Uint8ClampedArray(u32.buffer)
  return new ImageData(u8, side, side)
}


let hashExp

function canvasToBlob(canvas) {
  return new Promise(resolve => {
    canvas.toBlob(blob => {
      resolve(blob)
    })
  })
}

let canvas

async function pack() {
  const bytes = bundle()
  const imgData = bytesToImgData(bytes)
  console.log(imgData.width + '*' + imgData.height, 'bytes:', bytes.length)

  hashExp = await sha256(imgData.data)

  canvas = document.createElement('canvas')
  canvas.width = imgData.width
  canvas.height = imgData.height

  const ctx = canvas.getContext('2d')
  ctx.putImageData(imgData, 0, 0)

  const blob = await canvasToBlob(canvas)
  imgPreview.src = URL.createObjectURL(blob)
  divPreview.hidden = false

  const {width, height} = canvas
  const size = blob.size.toLocaleString()
  imgPreview.title = `${width}*${height} [${size} Bytes]`
}

let previewWin

self.onmessage = function(e) {
  if (e.source === previewWin && e.data === 'GET_PREVIEW_DATA') {
    const imgDataUrl = canvas.toDataURL()
    previewWin.postMessage(imgDataUrl, '*')
  }
}

function getPreviewFile() {
  if (confMap['index.html']) {
    return ''
  }
  const files = Object.keys(confMap)
  const html = files.find(v => v.endsWith('.html'))
  if (html) {
    return html
  }
  return files[0]
}

btnPreview.onclick = function() {
  const rand = (Math.random() * 0xffffffff >>> 0).toString(36)
  const site = `https://web2img-preview-${rand}.etherdream.com/`

  previewWin = open(site + getPreviewFile())
}


function verifyConf(str) {
  const conf = parseJson(str)
  if (!conf || typeof conf !== 'object') {
    return 'invalid conf'
  }
  const pairs = Object.entries(conf)
  if (pairs.length === 0) {
    return 'empty conf'
  }
  for (const [path, headers] of pairs) {
    const data = dataMap[path]
    if (!data) {
      return `file not found: ${path}`
    }
    if (typeof headers !== 'object') {
      return `invalid header type: ${path}`
    }
    if (headers['content-length'] != data.length) {
      headers['content-length'] = data.length
      console.warn('fix content-length:', path)
    }
    try {
      var res = new Response('', {headers})
    } catch (err) {
      return `invalid headers: ${path}`
    }
    for (const k in headers) {
      if (!res.headers.has(k)) {
        return `unsupported header: ${k} (${path})`
      }
    }
    conf[path] = Object.fromEntries(res.headers)
  }
  confMap = conf
  return ''
}

let lastConf

txtConf.onchange = async function() {
  if (lastConf === this.value) {
    return
  }
  lastConf = this.value

  const err = verifyConf(lastConf)
  showConfWarn(err)
  if (err) {
    return
  }
  await pack()
}

function bundle() {
  const confStr = JSON.stringify(confMap) + '\r'
  const confBin = strToBytes(confStr)
  const bufs = [confBin]

  for (const path of Object.keys(confMap)) {
    const data = dataMap[path]
    bufs.push(data)
  }
  return concatBufs(bufs)
}

//
// utils
//
function strToBytes(str) {
  return new TextEncoder().encode(str)
}

function bytesToB64(bytes) {
  return btoa(String.fromCharCode.apply(null, bytes))
}

function parseJson(str) {
  try {
    return JSON.parse(str)
  } catch (err) {
  }
}

function parseUrl(url) {
  try {
    return new URL(url)
  } catch (err) {
  }
}

function parseRegExp(str) {
  try {
    return RegExp(str)
  } catch (err) {
  }
}

function concatBufs(bufs) {
  let size = 0
  for (const buf of bufs) {
    size += buf.length
  }
  const ret = new Uint8Array(size)
  let pos = 0
  for (const v of bufs) {
    ret.set(v, pos)
    pos += v.length
  }
  return ret
}

async function sha256(bytes) {
  const buf = await crypto.subtle.digest('SHA-256', bytes)
  return new Uint8Array(buf)
}

function isArrayEqual(b1, b2) {
  if (b1.length !== b2.length) {
    return false
  }
  for (let i = 0; i < b1.length; i++) {
    if (b1[i] !== b2[i]) {
      return false
    }
  }
  return true
}

function showConfUI() {
  const confStr = JSON.stringify(confMap, null, '\t')
  if (confStr === '{}') {
    return
  }
  txtConf.value = confStr
  txtConf.classList.remove('fold')
  txtConf.readOnly = false
  txtUrls.value = ''
  txtJs.value = ''
  txtJs.classList.add('fold')
  optPrivacy.disabled = true
  chkMinify.disabled = true
  pack()
}

function showConfWarn(msg) {
  txtConfWarn.textContent = msg
}

function showUrlsWarn(msg) {
  txtUrlsWarn.textContent = msg
}

function showCodeWarn(msg) {
  txtCodeWarn.textContent = msg
}

function verifyImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = async () => {
      if (!hashExp) {
        resolve()
        return
      }
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      const imgData = ctx.getImageData(0, 0, img.width, img.height)
      const hashGot = await sha256(imgData.data)

      if (isArrayEqual(hashGot, hashExp)) {
        resolve()
      } else {
        reject('hash incorrect')
      }
    }
    img.onerror = () => {
      reject('failed to load')
    }
    img.crossOrigin = true
    img.referrerPolicy = 'no-referrer'
    img.src = url
  })
}

async function verifyUrls(urls) {
  for (const url of urls) {
    const urlObj = parseUrl(url)
    if (!urlObj || !/^https?:/.test(urlObj.protocol)) {
      return `invalid url: ${url}`
    }
    try {
      await verifyImage(url)
    } catch(err) {
      return `${err}: ${url}`
    }
  }
  return ''
}

let tmplCode
let imgUrls

async function genCode() {
  try {
    const res = await fetch('assets/js/tmpl.js')
    tmplCode = await res.text()
  } catch (err) {
    showCodeWarn('failed to load code')
    return
  }
  const privacy = optPrivacy.options[optPrivacy.selectedIndex].value
  const hashStr = hashExp ? bytesToB64(hashExp) : ''
  const urlsStr = imgUrls.join("', '")
  let pathPrefix = document.getElementById('pathPrefix').value.replaceAll('/', '').replaceAll('\\', '')
  let js = `\
var HASH = '${hashStr}'
var URLS = ['${urlsStr}']
var PRIVACY = ${privacy}
var UPDATE_INTERVAL = 120
var IMG_TIMEOUT = 10
var PATH_PREFIX = '${pathPrefix}'

${tmplCode}
`
  if (chkMinify.checked) {
    try {
      const ret = await Terser.minify(js, {
        enclose: true,
        compress: {
          global_defs: {
            RELEASE: 1,
          },
        },
        ie8: true,
      })
      js = ret.code
    } catch (err) {
      showCodeWarn(err.message)
      return
    }
  }
  txtJs.value = js
}

txtUrls.onchange = async function() {
  const urls = this.value.split(/\s+/).filter(Boolean)
  if (urls.length === 0) {
    txtJs.value = ''
    return
  }
  txtJs.value = 'generating...'

  const err = await verifyUrls(urls)

  showUrlsWarn(err)
  if (err) {
    txtJs.value = ''
    return
  }
  imgUrls = urls

  txtJs.classList.remove('fold')
  optPrivacy.disabled = false
  chkMinify.disabled = false
  await genCode()
}

optPrivacy.onchange = function() {
  genCode()
}

chkMinify.onchange = function() {
  genCode()
}


const MAX_BUNDLE_SIZE = 1024 * 1024 * 20
let dataMap = {}
let confMap = {}
let totalSize = 0

async function addFile(file, path) {
  if (checkIgnore(path)) {
    return
  }
  if (totalSize + file.size > MAX_BUNDLE_SIZE) {
    return
  }
  totalSize += file.size

  const data = await readFileData(file)
  dataMap[path] = data
  confMap[path] = {
    'content-type': file.type || 'application/octet-stream',
    'content-length': file.size,
  }
}

let isReading = false
let ignoreReg

function checkIgnore(path) {
  for (const s of path.split('/')) {
    if (ignoreReg.test(s)) {
      return true
    }
  }
  return false
}

txtIgnore.onchange = function() {
  ignoreReg = parseRegExp(this.value || '^$')
  if (!ignoreReg) {
    this.classList.add('bad')
    return
  }
  this.classList.remove('bad')
}
txtIgnore.onchange()


function startReading() {
  isReading = true
  totalSize = 0
  dataMap = {}
  confMap = {}
}

async function fileDialogHandler() {
  if (isReading) {
    return
  }
  if (this.files.length === 0) {
    return
  }
  startReading()

  for (const file of this.files) {
    const path = stripRootDir(file.webkitRelativePath)
    await addFile(file, path)
  }
  showConfUI()
  isReading = false
}

divDropZone.onclick = function() {
  const fileDialog = document.createElement('input')
  fileDialog.type = 'file'
  fileDialog.webkitdirectory = true
  fileDialog.onchange = fileDialogHandler
  fileDialog.click()
}

divDropZone.ondragover = function(e) {
  e.stopPropagation()
  e.preventDefault()
  e.dataTransfer.dropEffect = 'copy'
}

divDropZone.ondrop = async function(e) {
  e.stopPropagation()
  e.preventDefault()

  if (isReading) {
    return
  }
  const {items} = e.dataTransfer
  if (items.length !== 1) {
    return
  }
  const entry = items[0].webkitGetAsEntry()
  if (!entry.isDirectory) {
    return
  }
  startReading()

  await traverseDir(entry)
  showConfUI()
  isReading = false
}

async function traverseDir(entry) {
  const entires = await getDirEntries(entry)

  for (const entry of entires) {
    if (entry.isDirectory) {
      await traverseDir(entry)
    } else {
      const file = await entryToFile(entry)
      const path = stripRootDir(entry.fullPath)
      await addFile(file, path)
    }
  }
}

function stripRootDir(path) {
  return path.replace(/^\/?[^/]+\//, '')
}

function getDirEntries(entry) {
  return new Promise((resolve, reject) => {
    entry.createReader().readEntries(entries => {
      resolve(entries)
    }, err => {
      reject(err)
    })
  })
}

function entryToFile(entry) {
  return new Promise((resolve, reject) => {
    entry.file(ret => {
      resolve(ret)
    }, err => {
      reject(err)
    })
  })
}

function readFileData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const u8 = new Uint8Array(reader.result)
      resolve(u8)
    }
    reader.onerror = () => {
      reject()
    }
    reader.readAsArrayBuffer(file)
  })
}
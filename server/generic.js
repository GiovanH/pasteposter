const cheerio = require('cheerio')

var fetch;

async function ensureFetch(){
  if (!fetch) {
    fetch = (await import('node-fetch')).default
  }
}

async function getSiteMeta(url) {
  await ensureFetch()
  const resp = await fetch(url)
  const text = await resp.text()
  const $ = cheerio.load(text)
  return {
    title: ($('meta[property="og:title"]').attr('content') || $('title').text() || $('meta[name="title"]').attr('content')),
    description: ($('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content')),
    url: ($('meta[property="og:url"]').attr('content')),
    site_name: ($('meta[property="og:site_name"]').attr('content')),
    image: ($('meta[property="og:image"]').attr('content') || $('meta[property="og:image:url"]').attr('content')),
    icon: ($('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href')),
    keywords: ($('meta[property="og:keywords"]').attr('content') || $('meta[name="keywords"]').attr('content')  ),
  }
}

module.exports = {
  register(app) {
    app.post('/generic/getSiteMeta', (req, res) => {
      console.log(req.body)
      getSiteMeta(req.body.url)
        .then(metadata => {
          res.send(metadata)
        })
        .catch(error => res.send(error))
    })
    app.post('/generic/fetchJson', (req, res) => {
      console.log(req.body)
      ensureFetch().then(_ => {
        fetch(req.body.url, req.body.options)
          .then(resp => {
            return resp.json()
          })
          .then(json => res.send(json))
          .catch(error => res.send(error))
      })
    })
  }
}
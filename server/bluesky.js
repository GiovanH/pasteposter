// const cheerio = require('cheerio')

// var fetch
// import('node-fetch').then(resp => {
//   fetch = resp.default
//   console.log(fetch)
// })

module.exports = {
  register(app) {
//     app.post('/bsky/getLinkCard', (req, res) => {
//       console.log(req.body)
//       fetch(req.body.url)
//         .then(result => result.text())
//         .then(html => {
//           const $ = cheerio.load(html)
//           const title = $('meta[property="og:title"]').attr('content') || $('title').text() || $('meta[name="title"]').attr('content')
//           const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content')
//           const url = $('meta[property="og:url"]').attr('content')
//           // const site_name = $('meta[property="og:site_name"]').attr('content')
//           // const image = $('meta[property="og:image"]').attr('content') || $('meta[property="og:image:url"]').attr('content')
//           // const icon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href')
//           // const keywords = $('meta[property="og:keywords"]').attr('content') || $('meta[name="keywords"]').attr('content')
//           // do something with the variables
//           res.send({
//             title: title,
//             description: description,
//             url: url
//           })
//         }).catch(error => {
//           console.log(error)
//           res.send(error.code)
//         })
//     })
  }
}
// const tumblr = require('tumblr.js')

// const client_pool = {}

// function getClient(token, token_secret) {
//   console.log(token, token_secret)
//   const theClient = client_pool[token] ||
//     tumblr.createClient({
//       consumer_key: 'wsImElUZYOhLeiBNw9Gqtfx6vAKFz05D9LISEw4GrLl2bgVGI3',
//       consumer_secret: 'K0ItuPQCjn7cq5wp1ZyRGNQ1wfeumigNBR60XTTvAts18E72r3',
//       token,
//       token_secret
//     })
//   client_pool[token] = theClient
//   return theClient
// }

module.exports = {
  register(app) {
    app.get('/tumblr/printOauth', (req, res) => {
      console.log(req)
      res.send(req._parsedUrl.query)
    })

    // app.post('/tumblr/userInfo', (req, res) => {
    //   console.log(req.body)
    //   getClient(req.body.token, req.body.token_secret).userInfo()
    //     .then(resp => {
    //       res.send(resp)
    //       console.log(resp)
    //     })
    // })
  }
}
const megalodon = require('megalodon')

const masto_client_pool = {}

function mastoClient(host) {
  const megalodonClient = masto_client_pool[host] || megalodon.default('mastodon', host, {})
  masto_client_pool[host] = megalodonClient
  return megalodonClient
}

module.exports = {
  register(app) {
    app.post('/mastodon/generateAuthUrl', (req, res) => {
      console.log(req.body)

      const megalodonClient = mastoClient(req.body.host)

      megalodonClient.generateAuthUrl(
        req.body.clientId,
        req.body.clientSecret,
        req.body.options || {}
      )
        .then(appData => {
          console.log(appData)
          res.send(appData)
        })
        .catch(e => res.send(e))
    })

    app.post('/mastodon/fetchAccessToken', (req, res) => {
      console.log(req.body);

      const megalodonClient = mastoClient(req.body.host)

      megalodonClient.fetchAccessToken(
        req.body.clientId,
        req.body.clientSecret,
        req.body.oauthCode
      )
        .then((tokenData) => {
          console.log(tokenData)
          res.send(tokenData)
        })
        .catch(e => {
          console.log(Object.keys(e), e.response)
          res.send(e.response.data)
        })
    })
  }
}
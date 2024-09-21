module.exports = {
  register(app) {
    app.get('/tumblr/printOauth', (req, res) => {
      console.log(req)
      res.send(req._parsedUrl.query)
    })
  }
}
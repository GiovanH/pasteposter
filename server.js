const express = require('express');
const bodyParser = require('body-parser');

const app = express();

const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');

  // authorized headers for preflight requests
  // https://developer.mozilla.org/en-US/docs/Glossary/preflight_request
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();

  app.options('*', (req, res) => {
    // allowed XHR methods
    res.header('Access-Control-Allow-Methods', 'GET, PATCH, PUT, POST, DELETE, OPTIONS');
    res.send();
  });
});

require('./server/generic.js').register(app);
require('./server/mastodon.js').register(app);
require('./server/bluesky.js').register(app);
require('./server/tumblr.js').register(app);

app.listen(port, () => console.log(`Listening on port ${port}`));
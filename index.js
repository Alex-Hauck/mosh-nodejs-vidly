const winston = require('winston');
const express = require('express');
const config = require('config');

const app = express();
const mongodbConnectURI = config.get('db');

require('./startup/logging')(mongodbConnectURI);
require('./startup/routes')(app);
require('./startup/db')(mongodbConnectURI);
require('./startup/config')();
require('./startup/validation')();
require('./startup/prod')(app);

const port = process.env.PORT || 5000;
const server = app.listen(port, () => winston.info(`Listening on port ${port}...`));

module.exports = server;

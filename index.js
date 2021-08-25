const winston = require('winston');
const express = require('express');

const app = express();
const mongodbConnectURI = 'mongodb://vidly:password@localhost/playground';

require('./startup/logging')(mongodbConnectURI);
require('./startup/routes')(app);
require('./startup/db')(mongodbConnectURI);
require('./startup/config')();
require('./startup/validation')();

const port = process.env.PORT || 5000;
app.listen(port, () => winston.info(`Listening on port ${port}...`));

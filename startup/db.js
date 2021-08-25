const winston = require('winston');
const mongoose = require('mongoose');

module.exports = function (mongodbConnectURI) {
  mongoose
    .connect(mongodbConnectURI, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useCreateIndex: true
    })
    .then(() => winston.info('Connected to MongoDB...'));
};

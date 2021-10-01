//require('winston-mongodb');
require('express-async-errors');
const winston = require('winston');

module.exports = function (mongodbConnectURI) {
  winston.exceptions.handle(
    new winston.transports.File({
      filename: 'uncaughtExceptions.log'
    })
  );

  winston.exceptions.handle(
    new winston.transports.Console({
      format: winston.format.simple(),
      prettyPrint: true,
      colorize: true
    })
  );

  process.on('unhandledRejection', (ex) => {
    throw ex;
  });

  winston.add(
    new winston.transports.File({
      filename: 'logfile.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.prettyPrint()
      )
    })
  );

  /*winston.add(
    new winston.transports.MongoDB({
      db: mongodbConnectURI,
      level: 'error'
    })
  );*/

  winston.add(
    new winston.transports.Console({
      format: winston.format.simple(),
      colorize: true
    })
  );
};

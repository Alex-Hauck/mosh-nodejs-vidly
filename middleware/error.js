const winston = require('winston');

module.exports = function (error, req, res, next) {
  winston.error(error.message, { metadata: error.stack });
  return res.status(500).send('Sth. went wrong');
};

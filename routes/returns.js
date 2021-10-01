// Post /api/returns {customerId, movieId}

// Return 401 if client is not logged in
// Return 400 if customer id is not provided
// Return 400 if movie id is not provided
// Return 404 if no rental found for this customer and movie
// Return 400 if rental already processed

// Return 200 if valid request
// Set the return date
// Calculate the rental fee
// Increase the stock
// Return the rental

const express = require('express');
const moment = require('moment');
const Joi = require('joi')

const router = express.Router();
const auth = require('../middleware/auth');
const { Rental } = require('../models/rental');
const { Movie } = require('../models/movie');
const validate = require('../middleware/validate');

router.post('/', [auth, validate(validateReturn)], async (req, res) => {
  const rental = await Rental.lookup(req.body.customerId, req.body.movieId);

  if (!rental)
    return res
      .status(404)
      .send('Not rental for this customer and movie found.');
  if (rental.dateReturned)
    return res.status(400).send('Rental already has been processed');

  //Information Expert Principle

  rental.return();

  await rental.save();
  await Movie.updateOne(
    { _id: rental.movie._id },
    {
      $inc: { numberInStock: 1 }
    }
  );

  res.send(rental);
});

function validateReturn(rental) {
  const schema = Joi.object({
    customerId: Joi.objectId().required(),
    movieId: Joi.objectId().required()
  });

  return schema.validate(rental);
}

module.exports = router;

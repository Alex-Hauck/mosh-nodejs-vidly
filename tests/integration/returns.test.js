const mongoose = require('mongoose');
const request = require('supertest');
const moment = require('moment');
const { Rental } = require('../../models/rental');
const { User } = require('../../models/user');
const { Movie } = require('../../models/movie');
const { Genre } = require('../../models/genre');

describe('/api/returns', () => {
  let server;
  let customerId;
  let movieId;
  let rental;
  let token;
  let movie;
  const payload = {};
  beforeEach(async () => {
    server = require('../../index');
    customerId = mongoose.Types.ObjectId();
    movieId = mongoose.Types.ObjectId();
    payload.customerId = customerId;
    payload.movieId = movieId;
    const genre = new Genre({ name: 'testgenre' });
    movie = new Movie({
      _id: movieId,
      title: '12345',
      genre,
      numberInStock: 0,
      dailyRentalRate: 2
    });
    await movie.save();
    rental = new Rental({
      customer: {
        _id: customerId,
        name: '12345',
        phone: '12345'
      },
      movie: {
        _id: movieId,
        title: '12345',
        dailyRentalRate: 2
      }
    });
    await rental.save();
    token = new User({}).generateAuthToken();
  });

  afterEach(async () => {
    await server.close();
    await Rental.remove({});
    await Movie.remove({});
  });

  const exec = async () =>
    await request(server)
      .post('/api/returns')
      .set('x-auth-token', token)
      .send(payload);

  it('should return 401 if client is not logged in', async () => {
    token = '';

    const res = await exec();

    expect(res.status).toBe(401);
  });

  it('should return 400 if customerId is not provided', async () => {
    delete payload.customerId;
    const res = await exec();

    expect(res.status).toBe(400);
  });

  it('should return 400 if moviedId is not provided', async () => {
    delete payload.movieId;
    const res = await exec();

    expect(res.status).toBe(400);
  });

  it('should return 404 if no rental found for the customer/movie', async () => {
    await Rental.remove({});

    const res = await exec();

    expect(res.status).toBe(404);
  });

  it('should return 400 if return already processed', async () => {
    rental.dateReturned = new Date();
    await rental.save();

    const res = await exec();

    expect(res.status).toBe(400);
  });

  it('should return 200 if valid request', async () => {
    const res = await exec();
    expect(res.status).toBe(200);
  });

  it('should set the return date if input is valid', async () => {
    const res = await exec();
    const storedRental = await Rental.findById(rental._id);
    const diff = new Date() - storedRental.dateReturned;
    expect(diff).toBeLessThan(10 * 1000);
  });

  // more precise calculation
  /* it('should calculate the rental fee if input is valid', async () => {
    const res = await exec();
    const storedRental = await Rental.findById(rental._id);
    const expectedRentalFee = Math.ceil((storedRental.dateReturned.getTime() - storedRental.dateOut.getTime()) / (1000 * 3600 * 24)) * storedRental.movie.dailyRentalRate;
    expect(storedRental.rentalFee).toBe(expectedRentalFee);
  }); */

  // alternative implementation with moment
  it('should calculate the rental fee if input is valid', async () => {
    rental.dateOut = moment().add(-7, 'days').toDate();
    await rental.save();
    const res = await exec();
    const storedRental = await Rental.findById(rental._id);

    expect(storedRental.rentalFee).toBe(14);
  });

  it('should increase the stock number of movies if input is valid', async () => {
    const res = await exec();

    const movieInDb = await Movie.findById(movie._id);
    expect(movieInDb.numberInStock).toBe(movie.numberInStock + 1);
  });

  it('should return the rental', async () => {
    const res = await exec();

    expect(Object.keys(res.body)).toEqual(
      expect.arrayContaining([
        'dateOut',
        'dateReturned',
        'rentalFee',
        'customer',
        'movie',
        '_id'
      ])
    );
  });
});

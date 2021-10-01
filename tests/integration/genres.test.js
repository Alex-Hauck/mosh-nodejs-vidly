/* eslint-disable no-underscore-dangle */
const request = require('supertest');
const mongoose = require('mongoose');
const { Genre } = require('../../models/genre');
const { User } = require('../../models/user');

let server;

describe('/api/genres', () => {
  beforeEach(() => {
    server = require('../../index');
  });
  afterEach(async () => {
    await server.close();
    await Genre.remove({});
  });

  describe('GET /', () => {
    it('should return all genres', async () => {
      await Genre.collection.insertMany([
        { name: 'genre1' },
        { name: 'genre2' }
      ]);
      const res = await request(server).get('/api/genres/');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some((g) => g.name === 'genre1')).toBeTruthy();
    });
  });

  describe('GET /:id', () => {
    it('should return a genre if valid id is passed', async () => {
      const genre = new Genre({ name: 'genre1' });
      await genre.save();

      const res = await request(server).get(`/api/genres/${genre._id}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', genre.name);
    });

    it('should return 404 if invalid id is passed', async () => {
      const genre = new Genre({ name: 'name' });
      const res = await request(server).get(`/api/genres/${genre._id}`);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /', () => {
    let token;
    let name;
    const exec = async () =>
      await request(server)
        .post('/api/genres')
        .set('x-auth-token', token)
        .send({ name });

    beforeEach(() => {
      token = new User().generateAuthToken();
      name = 'genre1';
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 400 if genre is less than 5 characters', async () => {
      name = '1234';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if genre is less than 50 characters', async () => {
      name = new Array(52).join('a');

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should save the genre if it is valid', async () => {
      await exec();

      const genre = await Genre.find({ name: 'genre1' });

      expect(genre).not.toBeNull();
    });

    it('should return the genre if it is valid', async () => {
      const res = await exec();

      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('name');
    });
  });

  describe('DELETE /:id', () => {
    let token;
    let id;
    const exec = async () =>
      await request(server)
        .delete(`/api/genres/${id}`)
        .set('x-auth-token', token);

    beforeEach(() => {
      token = new User({
        _id: new mongoose.Types.ObjectId().toHexString(),
        isAdmin: true
      }).generateAuthToken();
      name = 'genre1';
    });

    it('should return the genre if valid id', async () => {
      const genre = new Genre({ name: 'genre1' });
      await genre.save();
      id = genre._id;
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', genre.name);
    });

    it('should delete the genre if valid id', async () => {
      let genre = new Genre({ name: 'genre1' });
      await genre.save();
      id = genre._id;
      const res = await exec();

      genre = await Genre.find({ name: 'genre1' });
      expect(genre).toHaveLength(0);
    });

    it('should return 404 if invalid id is passed', async () => {
      id = new Genre({ name: 'genre1' })._id;
      const res = await exec();
      expect(res.status).toBe(404);
    });
  });

  describe('PUT :/id', () => {
    let token;
    let id;
    let name;
    const exec = async () =>
      await request(server)
        .put(`/api/genres/${id}`)
        .set('x-auth-token', token)
        .send({ name });

    beforeEach(() => {
      token = new User({
        _id: new mongoose.Types.ObjectId().toHexString(),
        isAdmin: true
      }).generateAuthToken();
      name = 'genre1';
    });

    it('should return the updated genre', async () => {
      const genre = new Genre({ name });
      genre.save();

      id = genre._id;
      name = 'genre2';
      const res = await exec();

      expect(res.body).toHaveProperty('name', name);
    });

    it('should update the genre', async () => {
      let genre = new Genre({ name });
      genre.save();

      id = genre._id;
      name = 'genre2';
      const res = await exec();
      genre = await Genre.find({ name });

      expect(genre).not.toBeNull();
    });

    it('should return 400 name has less than 5 chars', async () => {
      name = '1234';
      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 name has more than 50 chars', async () => {
      name = new Array(52).join('a');
      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 404 if the genre to be updated cannot be found', async () => {
      const genre = new Genre({ name });
      id = genre._id;
      const res = await exec();

      expect(res.status).toBe(404);
    });
  });
});

const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');

// Get all movies
router.get('/', async (req, res) => {
  try {
    const movies = await Movie.find();
    console.log("entered page")
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific movie by ID
router.get('/:id', getMovie, (req, res) => {
  res.json(res.movie);
});

async function getMovie(req, res, next) {
  let movie;
  try {
    movie = await Movie.findById(req.params.id);
    if (movie == null) {
      return res.status(404).json({ message: 'Movie not found' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.movie = movie;
  next();
}

module.exports = router;

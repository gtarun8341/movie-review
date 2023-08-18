const mongoose = require('mongoose');

// Movie model
const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  }, // Add the 'year' field
  trailerLink: {
    type: String, // Assuming the link is stored as a string
  },

  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
    },
  ],
});

const Movie = mongoose.model('Movie', movieSchema);

// Review model
const reviewSchema = new mongoose.Schema({
  review: {
    type: String,
    required: true,
  },

  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
  },
  createdAt: {
    type: Date, // Store the date and time when the review is created
    default: Date.now, // Set the default value to the current date and time
  },
});

const Review = mongoose.model('Review', reviewSchema);

const userSchema = new mongoose.Schema({
  name: {
   type: String, required: true
    },
  email: {
     type: String, required: true, unique: true 
    },
  password: {
     type: String, required: true 
    },
});

const User = mongoose.model('User', userSchema);

module.exports = { Movie, Review, User };

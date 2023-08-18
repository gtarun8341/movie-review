const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const { Movie, Review,User } = require('./models/model'); // Import the models
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

const app = express();
const port = 5000;
app.use(cors());
app.use(express.json());

const SECRET_KEY = 'your_secret_key_here'; // Replace 'your_secret_key_here' with an actual secret key

// MongoDB Atlas connection URL (replace 'your-mongodb-uri' with your actual MongoDB Atlas URI)
const mongoURI =
  'mongodb+srv://jinxforever8341:3eXJhaVlOppEao6w@moviereview.esimakd.mongodb.net/?retryWrites=true&w=majority';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.once('open', () => {
  console.log('Connected to MongoDB Atlas');
});
db.on('error', (err) => {
  console.error('Error connecting to MongoDB Atlas:', err);
});

// Multer configuration for handling image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads'); // Set the destination folder for uploaded images
  },
  filename: (req, file, cb) => {
    const uniqueFilename = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueFilename); // Set a unique filename for the uploaded image
  },
});

const upload = multer({ storage });

  app.post('/api/movies', upload.single('image'), async (req, res) => {
    try {
      const { title, description, rating, year, trailerLink } = req.body;
      const imageUrl = req.file ? req.file.path : null;
      
      if (!title || !description || !rating || !imageUrl || !year || !trailerLink) {
        return res.status(400).json({ message: 'Please provide all required fields.' });
      }
  
      const movie = new Movie({
        title,
        description,
        rating,
        image: imageUrl,
        year,
        trailerLink, // Include the YouTube link in the movie document
      });
  
      await movie.save();
  
      res.status(201).json(movie);
    } catch (error) {
      console.error('Error adding movie:', error);
      res.status(500).json({ message: 'Failed to add movie' });
    }
  });
  

app.use('/uploads', express.static('uploads'));

// API endpoint for user registration
app.post('/api/users/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if a user with the same email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user document in the database
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Failed to register user' });
  }
});


// Route to handle user login and generate JWT token
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ email: user.email }, SECRET_KEY);
    res.json({ token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Failed to login' });
  }
});


app.get('/api/movies', async (req, res) => {
  try {
    const movies = await Movie.find({}).sort({ year: -1 });
    res.status(200).json(movies);
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ message: 'Failed to fetch movies' });
  }
});


app.get('/api/latest-movie-images', async (req, res) => {
  try {
    // Fetch the latest movies from the database
    const latestMovies = await Movie.find({}).sort({ _id: -1 }).limit(6);

    // Extract the movie data including _id and image URLs from the latest movies
    const latestMovieData = latestMovies.map((movie) => {
      return {
        _id: movie._id,
        image: movie.image,
        // Add other fields you want to include here
      };
    });

    res.status(200).json(latestMovieData);
  } catch (error) {
    console.error('Error fetching latest movie data:', error);
    res.status(500).json({ message: 'Failed to fetch latest movie data' });
  }
});


// API endpoint to add a review for a movie
app.post('/api/movies/:id/reviews', async (req, res) => {
  try {
    console.log(req.body);

    const { id } = req.params;
    const { review } = req.body;
console.log(review);
    // Check if the movie exists in the database
    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    // Create a new review document in the database
    const newReview = new Review({
      review,
      movie: movie._id,
    });

    // Save the review document to the database
    await newReview.save();

    // Add the review to the movie's reviews array
    movie.reviews.push(newReview._id);
    await movie.save();

    res.status(201).json(newReview);
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ message: 'Failed to add review' });
  }
});




// API endpoint to get all reviews for a movie
app.get('/api/movies/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the movie exists in the database
    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    // Populate the reviews for the movie and return them
    const reviews = await Review.find({ movie: movie._id });
    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

// Server code - index.js

// Add a new POST route to handle user ratings
app.post('/api/movies/:id/ratings', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    // Check if the movie exists in the database
    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    // Check if the rating is a valid number between 1 and 5
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Invalid rating value' });
    }

    // Add the user rating to the movie's ratings array
    movie.ratings.push(rating);
    await movie.save();

    res.status(201).json({ message: 'Rating added successfully' });
  } catch (error) {
    console.error('Error adding user rating:', error);
    res.status(500).json({ message: 'Failed to add user rating' });
  }
});


// API endpoint to get a specific movie by its ID
app.get('/api/movies/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the provided ID is a valid MongoDB ObjectId
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid movie ID' });
    }

    // Fetch the movie details from the database based on the ID
    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    res.status(200).json(movie);
  } catch (error) {
    console.error('Error fetching movie details:', error);
    res.status(500).json({ message: 'Failed to fetch movie details' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

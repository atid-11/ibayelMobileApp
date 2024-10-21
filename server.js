const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const User = require('./models/user'); // Ensure this path is correct

require('dotenv').config(); 

const app = express();
const PORT = process.env.PORT ;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});





const db = mongoose.connection;

db.on('error', (err) => {
  console.error('Connection error:', err);
});

db.once('open', () => {
  console.log('Database connected successfully!');
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const sectionsRouter = require('./routes/sections');
const typesRouter = require('./routes/types');
const productsRouter = require('./routes/products');
const authRoutes = require('./routes/auth');

app.use('/sections', sectionsRouter);
app.use('/types', typesRouter);
app.use('/products', productsRouter);
app.use('/api', authRoutes);

const createUser = async (username, plainPassword) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    console.log('User created successfully');
    mongoose.connection.close(); // Close the connection after saving
  } catch (error) {
    console.error('Error creating user:', error.message);
  }
};

// Call the function with the username and plain text password


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

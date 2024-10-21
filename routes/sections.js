const express = require('express');
const multer = require('multer');
const router = express.Router();
const Section = require('../models/section');
const Type = require("../models/type");
const Product = require("../models/product");

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' }); // Files will be saved in the 'uploads' folder

// Get all sections
router.get('/', async (req, res) => {
  try {
    const sections = await Section.find();
    res.json(sections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new section
router.post('/', upload.single('thumbnail'), async (req, res) => {
  const { name } = req.body;
  const thumbnail = req.file ? req.file.path : null;

  if (!name || !thumbnail) {
    return res.status(400).json({ message: 'Name and thumbnail are required' });
  }

  try {
    const section = new Section({ name, thumbnail });
    await section.save();
    res.status(201).json(section);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Middleware to get a section by ID
async function getSection(req, res, next) {
  let section;
  try {
    section = await Section.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
  res.section = section;
  next();
}

router.get('/:sectionId/types', async (req, res) => {
  const sectionId = req.params.sectionId;

  try {
    const types = await Type.find({ sectionId: sectionId }).exec();
    res.json(types);
  } catch (error) {
    console.error('Error fetching types:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get random product from random type for each section
router.get('/random-products', async (req, res) => {
  try {
    // Find all sections
    const sections = await Section.find().exec();
    let randomProducts = [];

    // Helper function to get all products from a specific type
    const getProductsFromType = async (type) => {
      const products = await Product.find({ typeId: type._id }).exec();
      return products;
    };

    // Loop through each section
    for (const section of sections) {
      // Find all types for the current section
      const types = await Type.find({ sectionId: section._id }).exec();
      if (types.length === 0) {
        console.log(`No types found for section ${section.name}`);
        continue; // Skip sections with no types
      }

      // Collect products from all types in the section
      for (const type of types) {
        const products = await getProductsFromType(type);
        if (products.length > 0) {
          randomProducts.push(...products);
        }
      }

      // If we gathered enough products, break out of the loop
      if (randomProducts.length >= 6) {
        break;
      }
    }

    // If we still have less than 6 products, duplicate random products from the available ones
    while (randomProducts.length < 6 && randomProducts.length > 0) {
      const productToDuplicate = randomProducts[Math.floor(Math.random() * randomProducts.length)];
      randomProducts.push(productToDuplicate);
    }

    // Ensure we return at least 6 products or handle the case where no products are found
    if (randomProducts.length === 0) {
      return res.status(404).json({ message: 'No products found' });
    }

    // Shuffle the products to return them in random order
    randomProducts = randomProducts.sort(() => Math.random() - 0.5).slice(0, 6);

    // Return only the product data
    res.json(randomProducts);
  } catch (error) {
    console.error('Error fetching random products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;


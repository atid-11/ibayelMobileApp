const express = require('express');
const multer = require('multer');
const router = express.Router();
const Section = require('../models/section');
const Type = require("../models/type");
const Product = require("../models/product");


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage }).fields([
  { name: "thumbnail", maxCount: 1 },
]);

router.get('/', async (req, res) => {
  try {
    const sections = await Section.find();
    res.json(sections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', upload, async (req, res) => {
  const { name } = req.body;
  const thumbnail = req.files["thumbnail"] ? req.files["thumbnail"][0].path : null;

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
router.get('/random-products', async (req, res) => {
  try {
    const sections = await Section.find().exec();
    let randomProducts = [];

    const getProductsFromType = async (type) => {
      const products = await Product.find({ typeId: type._id }).exec();
      return products;
    };

    for (const section of sections) {
      const types = await Type.find({ sectionId: section._id }).exec();
      if (types.length === 0) {
        console.log(`No types found for section ${section.name}`);
        continue; 
      }

      for (const type of types) {
        const products = await getProductsFromType(type);
        if (products.length > 0) {
          randomProducts.push(...products);
        }
      }

      if (randomProducts.length >= 8) {
        break;
      }
    }

    if (randomProducts.length > 8) {
      randomProducts = randomProducts.slice(0, 8);
    }

    if (randomProducts.length === 0) {
      return ('No products found' );
    }

    randomProducts = randomProducts.sort(() => Math.random() - 0.5);

    res.json(randomProducts);
  } catch (error) {
    console.error('Error fetching random products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



module.exports = router;
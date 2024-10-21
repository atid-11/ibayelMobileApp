const express = require("express");
const router = express.Router();
const Type = require("../models/type");
const Section = require("../models/section");
const Product = require("../models/product");
const multer = require("multer");

// Multer storage configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

// Multer middleware for handling multiple image uploads
const upload = multer({ storage: storage }).fields([
  { name: "images", maxCount: 15 },
  { name: "thumbnail", maxCount: 1 },
]);

// Get all types and populate associated section and products
router.get("/", async (req, res) => {
  try {
    const types = await Type.find()
      .populate("sectionId", "name")
      .populate("products", "name descriptions images thumbnail");
    res.json(types);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single type by ID
router.get("/:id", getType, async (req, res) => {
  try {
    const typeWithDetails = await Type.findById(req.params.id)
      .populate("sectionId", "name")
      .populate("products", "name descriptions images thumbnail");
    res.json(typeWithDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new type under a specific section
router.post("/", upload, async (req, res) => {
  const { name, sectionId } = req.body;
  const thumbnail = req.files["thumbnail"] ? req.files["thumbnail"][0].path : null;

  try {
    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(400).json({ message: "Invalid section ID" });
    }

    const type = new Type({ name, sectionId, thumbnail });
    await type.save();
    res.status(201).json(type);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add a new product to a type
router.post("/:typeId/products", upload, async (req, res) => {
  const { name, descriptions, caracteristique, price, Quantity } = req.body;
  const { typeId } = req.params;

  const images = req.files["images"] ? req.files["images"].map((file) => file.path) : [];
  const thumbnail = req.files["thumbnail"] ? req.files["thumbnail"][0].path : null;

  try {
    const type = await Type.findById(typeId);
    if (!type) {
      return res.status(400).json({ message: "Invalid type ID" });
    }

    const parsedCaracteristique = JSON.parse(caracteristique);

    const product = new Product({
      name,
      descriptions,
      images,
      thumbnail,
      typeId,
      caracteristique: parsedCaracteristique,
      price,
      Quantity,
    });

    await product.save();

    type.products.push(product._id);
    await type.save();

    res.status(201).json({
      product: {
        _id: product._id,
        name: product.name,
        descriptions: product.descriptions,
        images: product.images,
        thumbnail: product.thumbnail,
        typeId: product.typeId,
        caracteristique: product.caracteristique,
        price: product.price,
        Quantity: product.Quantity,
      },
      type,
    });
  } catch (error) {
    console.error("Error adding product to type:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update a type
router.patch("/:id", getType, async (req, res) => {
  if (req.body.name != null) {
    res.type.name = req.body.name;
  }

  if (req.body.descriptions != null) {
    res.type.descriptions = req.body.descriptions;
  }

  try {
    const updatedType = await res.type.save();
    res.json(updatedType);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a type and its associated products
router.delete("/:id", getType, async (req, res) => {
  try {
    await Product.deleteMany({ typeId: req.params.id });
    await res.type.deleteOne();
    res.json({ message: "Type and associated products deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Middleware to fetch a type by ID
async function getType(req, res, next) {
  try {
    const type = await Type.findById(req.params.id);
    if (type == null) {
      return res.status(404).json({ message: "Type not found" });
    }
    res.type = type;
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}


router.get('/:typeId/products', async (req, res) => {
  const typeId = req.params.typeId;

  try {
    const products = await Product.find({ typeId: typeId }).exec();
    res.json(products);
  } catch (error) {
    console.error('Error fetching types:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
module.exports = router;

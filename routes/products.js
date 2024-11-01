const express = require("express");
const router = express.Router();
const Product = require("../models/product");
const Type = require("../models/type");
const multer = require("multer");
const fs = require("fs"); 
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage }).fields([
  { name: "images", maxCount: 15 },
  { name: "thumbnail", maxCount: 1 },
]);

router.get("/", async (req, res) => {
  try {
    const products = await Product.find().populate("typeId", "name"); 
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", getProduct, (req, res) => {
  res.json(res.product);
});

router.post("/", upload, async (req, res) => {
  const {
    name,
    descriptions,
    typeId,
    productType,
    condition,
    manufacturer,
    caracteristique,
  } = req.body;

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
      productType,
      condition,
      manufacturer,
      caracteristique: parsedCaracteristique,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch("/:id", upload, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const {
      name,
      descriptions,
      typeId,
      productType,
      condition,
      manufacturer,
      caracteristique,
      deletedImages,
    } = req.body;

    product.name = name || product.name;
    product.descriptions = descriptions ? descriptions.split("\n") : product.descriptions;
    product.typeId = typeId || product.typeId;
    product.productType = productType || product.productType;
    product.condition = condition || product.condition;
    product.manufacturer = manufacturer || product.manufacturer;
    product.caracteristique = caracteristique ? JSON.parse(caracteristique) : product.caracteristique;

    if (req.files["thumbnail"] && req.files["thumbnail"].length > 0) {
      product.thumbnail = req.files["thumbnail"][0].path;
    }

    if (req.files["images"] && req.files["images"].length > 0) {
      const updatedImages = req.files["images"].map((file) => file.path);
      product.images.push(...updatedImages);
    }

    if (Array.isArray(deletedImages)) {
      deletedImages.forEach((deletedImage) => {
        const imagePathToDelete = path.join(__dirname, "..", deletedImage);
        if (fs.existsSync(imagePathToDelete)) {
          fs.unlinkSync(imagePathToDelete);
        }
        product.images = product.images.filter((image) => image !== deletedImage);
      });
    } else if (deletedImages) {
      const imagePathToDelete = path.join(__dirname, "..", deletedImages);
      if (fs.existsSync(imagePathToDelete)) {
        fs.unlinkSync(imagePathToDelete);
      }
      product.images = product.images.filter((image) => image !== deletedImages);
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(400).json({ message: "Failed to update product" });
  }
});

router.delete("/:id", getProduct, async (req, res) => {
  try {
    await res.product.deleteOne();
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

async function getProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id).populate("typeId", "name");
    if (product == null) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.product = product;
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = router;
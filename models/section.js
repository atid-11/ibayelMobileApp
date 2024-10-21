const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
    required: true,
  },
  types: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Type',
  }],
});

const Section = mongoose.model('Section', sectionSchema);

module.exports = Section;

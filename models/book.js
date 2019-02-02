let mongoose = require('mongoose');

// Article Schema
let bookSchema = mongoose.Schema({
  title:{
    type: String,
    required: true
  },
  genre:{
    type: String,
    lowercase: true,
    required: true
  },
  author:{
    type: String,
    required: true
  },
  uploader:{
    type: String,
    required: true
  },
  image_url:{
    type: String,
    required: true
  },
  body:{
    type: String,
    required: true
  },
  fname:{
    type: String,
    required: false
  }
});

let Book = module.exports = mongoose.model('Book', bookSchema);

let mongoose = require('mongoose');

// Article Schema
let uploadSchema = mongoose.Schema({
  name:{
    type: String,
    required: false
  }
});

let Upload = module.exports = mongoose.model('Upload', uploadSchema);

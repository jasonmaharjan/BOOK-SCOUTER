let mongoose = require('mongoose');

// Article Schema
let reviewSchema = mongoose.Schema({

  userid:{
    type: String,
  },
  bookid:{
    type: String,
  },
  review:{
    type: String
  }
});

let Review = module.exports = mongoose.model('Review', reviewSchema);

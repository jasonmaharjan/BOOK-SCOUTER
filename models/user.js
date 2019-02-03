const mongoose = require('mongoose');

// User Schema
const UserSchema = mongoose.Schema({
  name:{
    type: String,
    required: true
  },
  email:{
    type: String,
    required: true
  },
  username:{
    type: String,
    required: true
  },
  password:{
    type: String,
    required: true
  },
  recommender: [{
    genre:{
       type: String,
       lowercase: true
    },
    count:{
      type: Number,
      default: 0
    }
  }]
});

const User = module.exports = mongoose.model('User', UserSchema);

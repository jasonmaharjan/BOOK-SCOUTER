const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');

// Bring in User Model
let User = require('../models/user');

// Register Form

router.get('/register', function(req, res){
  res.render('register');
});

// Register Proccess
router.post('/register', function(req, res){
  // Parse the data coming from the form

  const name = req.body.name;
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;
  const password2 = req.body.password2;

  req.checkBody('name', 'Name is required').notEmpty();
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('email', 'Email is not valid').isEmail();
  req.checkBody('username', 'Username is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();
  req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

  let errors = req.validationErrors();

  if(errors){
    res.render('register', {
      errors:errors
    });
  }
  else
  {
    // Checking if email and username are already taken
    User.findOne({username:{"$regex": "^" + username + "\\b", "$options": "i"}}, function(err, username){
      User.findOne({email: {"$regex": "^" + email + "\\b", "$options": "i"}}, function(err, email){
        if (username){
          req.flash('danger', 'Username already taken. Try a different one');
          res.render('register');
        }
        else if (email){
          req.flash('danger', 'Email is already taken. Try a different one');
          res.render('register');
        }
        else if (username || email){
          req.flash('danger', 'Email and Username is already taken. Try a different one');
          res.render('register');
        }
        else{
          let newUser = new User();

          newUser.name = req.body.name;
          newUser.email = req.body.email;
          newUser.username = req.body.username;
          newUser.password = req.body.password;

          //newUser.recommender[0].genre = "horror";
          newUser.recommender[0] = {genre: "horror"};
          newUser.recommender[1] = {genre: "non fiction"};
          newUser.recommender[2] = {genre: "romance"};
          newUser.recommender[3] = {genre: "fantasy"};
          newUser.recommender[4] = {genre: "comedy"};
          newUser.recommender[5] = {genre: "course materials"};

          // Generate salt and hash for password encryption
          bcrypt.genSalt(10, function(err, salt){
            bcrypt.hash(newUser.password, salt, function(err, hash){
              if(err){
                console.log(err);
              }
              newUser.password = hash;
              newUser.save(function(err){
                if(err){
                  console.log(err);
                  return;
                } else {
                  req.flash('success','You are now registered and can log in');
                  res.redirect('/users/login');
                }
                });
              });
            });
        }
      });
    });
  }
});

// Login Form
router.get('/login', function(req, res){
  res.render('login');
});

// Login Process
router.post('/login', function(req, res, next){
  passport.authenticate('local', {
    successRedirect:'/books/home',
    failureRedirect:'/users/login',
    failureFlash: true
  })(req, res, next);
});

// logout
router.get('/logout', function(req, res){
  req.logout();
  req.flash('success', 'You are logged out');
  res.redirect('/users/login');
});

module.exports = router;

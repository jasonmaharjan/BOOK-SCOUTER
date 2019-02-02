var express = require('express');
var router = express.Router();

let Book = require('../models/book');

//Homepage (Index page)

router.get('/', ensureAuthenticated, function(req, res){
  Book.find({}, function(err, books){
    if(err){
      console.log(err);
    } else {
      res.render('library', {
        title:'BOOKSCOUTER LIBRARY',
        books: books
      });
    }
  });
});

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		req.flash('error_msg','You are not logged in');
		res.redirect('/users/login');
	}
}

module.exports = router;

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');

// Book Model
let Book = require('../models/book');

// User Model
let User = require('../models/user');

// Review Model
let Review = require('../models/review');

// Uploaded file's name model
let Upload = require('../models/uploads');

// Mongo URI
const mongoURI = 'mongodb://localhost:27017/BOOKSCOUTER';

// Create mongo connection
const conn = mongoose.createConnection(mongoURI);

// Middleware
app.use(bodyParser.json());
app.use(methodOverride('_method')); // Enables browser to understand put and delete requests also.

// Set Public Folder
app.use(express.static(path.join(__dirname, 'public')));

// Initialize gfs
let gfs;

conn.once('open', () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});

// Create storage engine
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {

      // Store the uploaded file's original filename
      let upload = new Upload;
      upload.name = file.originalname;
      upload.save(function(err){
        if(err){
          console.log(err);
        }
      })

      // Generate random 32 character for unique filename
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

//////////////////////////////////////////////////////////////////////

// Homepage (Index page)
app.get('/home', ensureAuthenticated, function(req, res){

  User.findById(req.user._id, function(err, user) {
        var a;
        var b;
        for (var i = 0; i < 3; i++)
        {
            for (var j = i + 1; j < 3; j++)
            {
                if (user.recommender[i].count < user.recommender[j].count)
                {
                    a = user.recommender[i].genre;
                    user.recommender[i].genre = user.recommender[j].genre;
                    user.recommender[j].genre = a;

                    b = user.recommender[i].count;
                    user.recommender[i].count = user.recommender[j].count;
                    user.recommender[j].count = b;

                    user.save();


                }
            }
        }

    Book.find({genre: user.recommender[0].genre}, function(err, books){
      if(err){
        console.log(err);
      }
      else {
        if (!books || books.length === 0) {
          Book.find({}, function(err, book){
            if(err){
              console.log(err);
            }else{
              res.render('home', {
                title:'BOOKSCOUTER',
                books: book
              });
           }
          });
        }else{
          res.render('home', {
            title:'BOOKSCOUTER',
            books: books
          });
        }
     }
    });
  });
});

// Library (Shows all the available books)
app.get('/library', ensureAuthenticated, function(req, res){
  Book.find({}, function(err, books){
    if(err){
      throw(err);
    }
    else{
      res.render('library',{
        title: 'BOOKSCOUTER LIBRARY',
        books: books
      });
    }
  });
});

// Contributed Books
app.get('/contributions', ensureAuthenticated, function(req, res){
  Book.find({uploader: req.user._id}, function(err, contributions){
    if(err){
      console.log(err);
    } else {
            if (!contributions || contributions.length === 0) {
              res.render('contributions',{
                title:'No books found',
                books:contributions
              });

            }else{
              res.render('contributions',{
                title:'Books Contributed:',
                books:contributions
              });
            }
          }
  });
});

// User comments
app.post('/comments/:id', ensureAuthenticated, function(req, res){
  Book.findById(req.params.id, function(err, book){
    User.findById(book.uploader, function(err, user){
      user.comment = req.body.body;

      user.save(function(err){
        if(err){
          console.log(err);
          return;
        }

    req.flash('success', 'Comment Added!');
    res.redirect('/books/home');
    });
  });
});
});

// Recommender Engine
app.post('/scout',ensureAuthenticated, function(req, res){
  Book.find({$or:[{title:req.body.title},{genre:req.body.genre} ] }, function(err,results){
    User.findById(results.uploader, function(err, user){
      if (err){
        console.log(err);
      }
      else{
        if (!results || results.length === 0) {
          req.flash('danger', 'Sorry, No Results were found');
          res.redirect('/books/home');
        }
        else{
          if(req.body.genre){
            res.render('scout', {
              title: 'Search Results',
              searchedTerm: req.body.genre,
              books: results,
              matchCount: results.length
            });
          }else if(req.body.title) {
            res.render('scout', {
              title: 'Search Results',
              searchedTerm: req.body.title,
              books: results,
              matchCount: results.length
            });
          }
        }
      }

      User.findOneAndUpdate({_id:req.user._id, "recommender": {$elemMatch: {genre: req.body.genre}}}, { $inc: { "recommender.$.count": 1 } }, function(err){
        if(err){
          console.log(err);
        }
      });
    });
  });
});

// Handling UPLOADS to GridFS
app.get('/uploads',ensureAuthenticated, function(req, res){
  res.render('uploads',{
    title: 'Upload Your Books'
  });
});

// Redirect files to add_info route
app.post('/uploads', upload.single('file'), function(req, res){
  res.redirect('/books/add_info');
});

// Provides links to add information
app.get('/add_info',ensureAuthenticated, function(req, res){
  gfs.files.find().toArray((err, files) => {
   // Check if files are available
   if (!files || files.length === 0) {
     res.render('add_info',{
       files: false
     });
   }
   else {
     Upload.find({}, function(err, results){
      res.render('add_info', {
       files: files,
       results: results
     });
   });
   }
 });
});

// Add Data into the Form Route
app.get('/add/:filename', ensureAuthenticated, function(req, res){
  gfs.files.findOne({ filename:req.params.filename }, function(err,result){
    res.render('add_book', {
    title: 'Enter the data for the book!',
    file: result
    });
  });
});

// Add Submit POST Route
app.post('/add/:filename', function(req, res){
  req.checkBody('title','Please put the Title').notEmpty();
  req.checkBody('genre', 'Please put the Genre').notEmpty();
  req.checkBody('author', 'Please put the Author').notEmpty();
  req.checkBody('image_url', 'Please put the Image URL').notEmpty();
  req.checkBody('body','Please put the Body').notEmpty();

  // Get Errors
  let errors = req.validationErrors();
  if(errors){
    res.render('add_book', {
      title:'Add Books',
      errors:errors
    });
  }
  else {
    gfs.files.findOne({ filename: req.params.filename}, function(err, result){
      let book = new Book();
      book.title = req.body.title;
      book.genre = req.body.genre;
      book.author = req.body.author;
      book.uploader = req.user._id;
      book.image_url = req.body.image_url;
      book.body = req.body.body;
      book.fname = result.filename;

      book.save(function(err){
        if (err){
          console.log(err);
          return;
        }

        req.flash('success', 'Book Added!');
        res.redirect('/books/library');
      });
    });
  }
});

// Load Edit Forms
app.get('/edit/:id', ensureAuthenticated, function(req, res){
  Book.findById(req.params.id, function(err, book){
    if(book.uploader != req.user._id){
      req.flash('danger', 'Not Authorized');
      res.redirect('/books/home');
    }
    res.render('edit_book', {
      title:'Edit book',
      book:book
    });
  });
});

// Update Submit POST Route
app.post('/edit/:id', function(req, res){
  let book = {};
  book.title = req.body.title;
  book.genre = req.body.genre;
  book.author = req.body.author;
  book.uploader = req.user._id;
  book.image_url = req.body.image_url;
  book.body = req.body.body;

  let query = {_id:req.params.id}

  Book.update(query, book, function(err){
    if(err){
      console.log(err);
      return;
    }
    else {
      req.flash('success', 'Book Updated');
      res.redirect('/books/home');
    }
  });
});

// Delete Book
app.delete('/:id', function(req, res){
  if(!req.user._id){
    res.status(500).send();
  }

  let query = {_id:req.params.id}

  Book.findById(req.params.id, function(err, book){
    if(book.uploader != req.user._id){
      res.status(500).send();
    }
    else {
      //Find the pdf from uploads collection
      gfs.files.findOne({filename:book.fname}, function(err, result){
      // Delete from gfs collection too
        gfs.collection('uploads').remove({_id:result._id}, function(err){
          if (err){
            console.log(err);
          }
          console.log('File Deleted');
        });
      });


      // Delete information from books collection
      Book.remove(query, function(err){
        if(err){
          console.log(err);
        }
        res.send('Success');
      });

      //Delete reviews of corresponding books
      Review.remove(query, function(err){
        if(err){
          console.log(err);
        }
      });
    }
  });
});

// Get Single Book
app.get('/:id',ensureAuthenticated, function(req, res){
  Book.findById(req.params.id, function(err, book){
    User.findById(book.uploader, function(err, user){
      Review.find({bookid:req.params.id}, function(err, reviews) {
        var reviewMap = {};

        reviews.forEach(function(review){
            reviewMap[review._id] = review;
        });
       res.render('book', {
         book:book,
         uploader: user.name,
         reviews: reviewMap
       });
     });
    });
  });
});

// DOWNLOAD File
app.get('/downloads/:filename', ensureAuthenticated, function(req, res){
  //mongoose.Types.ObjectId(req.articleId);
  gfs.files.findOne({ filename: req.params.filename }, function(err, file){
    // File exists
    res.set('Content-Type', file.contentType);
    res.set('Content-Disposition', 'attachment; filename="' + file.filename + '"');

    // streaming from gridfs
    var readstream = gfs.createReadStream({
      filename: req.params.filename
    });

    console.log('File Downloaded');

    //error handling, e.g. file does not exist
    readstream.on('error', function (err) {
      console.log('An error occurred!', err);
      throw err;
    });
    readstream.pipe(res)
  });
});

//add review
app.post('/review/:id', function(req, res){

  req.checkBody('review','No review to post').notEmpty();

  // Get Errors
  let errors = req.validationErrors();

  if(errors){
    res.redirect('/books/'+req.params.id);
  }
  else {
    Book.findById(req.params.id, function(err, book){
      User.findById(book.uploader, function(err, user){
        let review = new Review();
        review.review = req.body.review;
        review.bookid = req.params.id;
        review.userid = req.user.username;

        review.save(function(err){
          if(err){
            console.log(err);
            return;
          }else{
            req.flash('success', 'Thank you for your review');
            res.redirect('/books/'+book._id);
          }
        });
      });
    });
  }
});

// Access Control
function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    return next();
  } else {
    req.flash('danger', 'Please login!');
    res.redirect('/users/login');
  }
}

module.exports = app;

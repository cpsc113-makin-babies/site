var fs = require('fs');
var express = require('express');
var multer = require('multer'); //note this is for uploading individual files to the public/uploads folder
var exphbs  = require('express-handlebars');
var app = express();
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoDBStore = require('connect-mongodb-session')(session);
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URL || process.env.MONGODB_URI);
var Grid = require('gridfs-stream');
var GridFS = Grid(mongoose.connection.db, mongoose.mongo);

var Users = require('./models/users.js');
var Signups = require('./models/signups.js')
var Matches = require('./models/matches.js');

var store = new MongoDBStore({
  uri: process.env.MONGO_URL || process.env.MONGODB_URI,
  collection: 'sessions'
});

//configuration info
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(express.static('styles/img'));
app.use("/styles", express.static(__dirname + '/styles'));


app.use(session({ //   .use is express middleware, read about this
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: 'auto' },
  store: store
}))

app.use(function(req, res, next){
  if(req.session.userId){
    Users.findById(req.session.userId, function(err, user){
      if(!err){
        res.locals.currentUser = user;
      }
      next();
    })
  }else{
    next();
  }
})

function isLoggedIn(req, res, next){
  if(res.locals.currentUser){
    next();
  }else{
    res.sendStatus(403);
  }
}

app.get('/', function (req, res) {
      res.render('index');
});

app.get('/profile/', function (req, res) {
      res.render('profile');
});

app.get('/registration/', function (req, res) {
      res.render('registration');
});

app.post('/user/register', function (req, res) {
    if(req.body.password !== req.body.password_confirmation){
        return res.render('index', {errors: "Password and password confirmation dont match"});
    }

    var newUser = new Users();
    newUser.hashed_password = req.body.password;
    newUser.email = req.body.email;
    newUser.first_name = req.body.first;
    newUser.last_name = req.body.last;
    newUser.save(function(err, user){
       // If there are no errors, redirect to additional detail page
    if(user && !err){
      req.session.userId = user._id;
      res.redirect('/registration/');
    }
    var errors = "Error registering you.";
    if(err){
      if(err.errmsg && err.errmsg.match(/duplicate/)){
        errors = 'Account with this email already exists!';
      }
      return res.render('index', {errors: errors});
    }
  });
});

app.post('/leave-email', function(req, res) {
  console.log(req.body.emailAddress);
      if (!(req.body.emailAddress)){
          return res.render('index', {errors: "Invalid email."});
      }
      var newSignup = new Signups();
      newSignup.email = req.body.emailAddress;
      newSignup.save(function(err, signup) {
        return res.redirect('/');
      });
});

app.post('/leave-comment', function(req, res) {
  console.log(req.body.emailAddress);
      if (!(req.body.emailAddress)){
          return res.render('index', {errors: "Invalid email."});
      }
      var newComment = new Signups();
      newSignup.email = req.body.emailAddress;
      newSignup.name = req.body.commentName;
      newSignup.comment = req.body.comment;
      newSignup.save(function(err, signup) {
        return res.redirect('/');
      });
});

app.post('/user/profile', function (req, res) {
  console.log("current user _id is ", res.locals.currentUser._id);
  Users.findByIdAndUpdate(res.locals.currentUser._id, {
      //this is where I'm trying to find record by id and add new info. Not sure if I'm doing this right
      $set: {
        role: req.body.role,
        educ: req.body.educ,
        zip: req.body.zip,
        dob: req.body.dob,
      }
      //redirect to profile
    }, function (err, user) {
      var errors = "Error registering you.";
      if(err){
        return res.render('index', {errors: errors});
      }
      res.redirect('/profile/');
  });
});



app.post('/user/login', function (req, res) {
  var user = Users.findOne({email: req.body.email}, function(err, user){
    if(err || !user){
      res.render('index', {errors: 'Invalid email address'});
      return;
    }
    console.log('user =', user);
    console.log('actual password =', user.hashed_password);
    console.log('provided password =', req.body.password);

    user.comparePassword(req.body.password, function(err, isMatch){
      if(err || !isMatch){
        res.render('index', {errors: 'Invalid password'});
      }else{
        req.session.userId = user._id;
        res.redirect('/profile/')
      }
    });
  })
});

app.get('/user/logout', function(req, res){
  req.session.destroy();
  console.log("session destroyed")
  res.redirect('/');
})
//  All the controllers and routes below this require
//  the user to be logged in.
app.use(isLoggedIn);

app.listen(process.env.PORT, function () {
  console.log('Example app listening on port ' + process.env.PORT);
});

//this is for posting the profile pics to the public/uploads folder
var storage =   multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, 'public/uploads');
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + '-' + Date.now());
  }
});
var upload = multer({ storage : storage}).single('userPhoto');

function putFile(path, name, callback) {
    var writestream = GridFS.createWriteStream({
        filename: name
    });
    writestream.on('close', function (file) {
      callback(null, file);
    });
    fs.createReadStream(path).pipe(writestream);
}

app.post('/api/photo', upload, function(req,res){
        putFile(req.file.path, res.locals.currentUser._id, function(err, file){
          fs.unlink(req.file.path);
          if(err) {
              console.log('photo upload', err);
              return res.render('registration', {errors: 'Error uploading profile picture'});
          }
            console.log('file uploaded, name:', res.locals.currentUser._id);
          res.render('registration', {errors: 'Your profile picture has been uploaded!'});
        });
    });

app.get('/profpic/get/:id', function(req, res){
    var readstream = GridFS.createReadStream({
       filename: res.locals.currentUser._id
    });
    readstream.pipe(res);
  });

app.listen(3000,function(){
    console.log("Working on port 5000");
});

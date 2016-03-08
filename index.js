var express = require('express');
var exphbs  = require('express-handlebars');
var app = express();
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoDBStore = require('connect-mongodb-session')(session);
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URL);
var Users = require('./models/users.js');
var Tasks = require('./models/tasks.js');



//configure our app
var store = new MongoDBStore({ 
  uri: process.env.MONGO_URL,
  collection: 'sessions'
});
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


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

function loadUserTasks(req, res, next) {
  if(!res.locals.currentUser){
    return next();
  }
  Tasks.find({}).or([
      {owner: res.locals.currentUser},
      {collaborators: res.locals.currentUser.email}])
    .exec(function(err, tasks){
      if(!err){
        res.locals.tasks = tasks;
        for(var i = 0; i< tasks.length; i++){
          if(res.locals.currentUser._id.toString() == tasks[i].owner.toString()){
            
          }
        }
        
      }
      next();
  })
}


app.get('/', loadUserTasks, function (req, res) {
      res.render('index');
});

app.post('/user/register', function (req, res) {
    if(req.body.password !== req.body.password_confirmation){
        return res.render('index', {errors: "Password and password confirmation dont match"});
    }  
    
    
    var newUser = new Users();
    newUser.hashed_password = req.body.password;
    newUser.email = req.body.email;
    newUser.name = req.body.fl_name;
    newUser.save(function(err, user){
       // If there are no errors, redirect to home page
    if(user && !err){
      req.session.userId = user._id;
      res.redirect('/');
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
        res.redirect('/')          
      }
    });
  })
});

app.get('/user/logout', function(req, res){
  req.session.destroy();
  res.redirect('/');
})
//  All the controllers and routes below this require
//  the user to be logged in.
app.use(isLoggedIn);

app.post('/task/create', function(req, res){
  var newTask = new Tasks();
  newTask.owner = res.locals.currentUser._id;
  newTask.title = req.body.title;
  newTask.description = req.body.description;
  newTask.collaborators = [req.body.collaborator1, req.body.collaborator2, req.body.collaborator3];
  newTask.save(function(err, savedTask){
    if(err || !savedTask){
      res.send('Error saving task!');
    }else{
      res.redirect('/');
    }
  });
});

app.post('/task/delete/:id', function(req, res){
   //var currentUserID= res.locals.currentUser._Id;
 
 Tasks.findOne(req.params.id, function(err, task){
   
   console.log(res.locals.currentUser._id);
   console.log(typeof(res.locals.currentUser._id));
   
   if(res.locals.currentUser._id.toString() == task.owner.toString()){
     if(err){
       console.log('no delete');
     }
     else
     {
       console.log('deleted');
       task.remove();
     }
     res.redirect('/');
   }
 });
});


app.post('/task/complete/:id', function(req, res){
//this is used to mark tasks complete
Tasks.findById(req.params.id, function(err, task){
  if(err){
   }else{
     task.isComplete = true
   }
 res.redirect('/');
});
});

app.listen(process.env.PORT, function () {
  console.log('Example app listening on port ' + process.env.PORT);
});
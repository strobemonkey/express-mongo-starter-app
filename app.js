var express = require('express@1.0.8');
var fs = require('fs');
var Mongoose = require('mongoose@1.1.2');
var stylus = require('stylus@0.4.0');

var app = express.createServer();

app.configure(function() {
	app.use(express.logger());
  app.use(express.bodyDecoder());
  app.use(express.methodOverride());
  app.use(express.staticProvider(__dirname + '/public'));
  app.use(stylus.middleware({ src: __dirname + '/public' })); 
	app.use(express.cookieDecoder());
});

app.configure('development', function() {
	app.use(express.errorHandler({
		dumpExceptions: true,
		showStack: true
	}));
  db = Mongoose.connect('mongodb://localhost/express-starter-app-dev');
  app.use(express.session( { secret: 'ididaweeinaswimmingpool', cookie: { maxAge: 60000 } } ) );
});

app.configure('test', function() {
  app.use(express.errorHandler({
    dumpExceptions: true, 
    showStack: true
  }));
  db = Mongoose.connect('mongodb://localhost/express-starter-app-test');
  app.use(express.session( { secret: 'ididaweeinaswimmingpool', cookie: { maxAge: 60000 } } ) );
});

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.dynamicHelpers(
  {
    session: function(req, res) {
      return req.session;
    },
    flash: function(req, res) {
      return req.flash();
    }
  }
);

function requiresLogin (req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/sessions/new?redir=' +  req.url);
  };
}

app.get('/', function(req, res) {
  if (req.session.user) {
    res.redirect('/user');
  } else {
  	res.render('root');
	}
});

// create our user model from our schema
var UserSchema = require('./models/users').UserSchema;
Mongoose.model('User', UserSchema);
var User = db.model('User');

// Sessions

// New session
app.get('/sessions/new', function(req, res) {
  res.render('sessions/new', {locals: {
    redir: req.query.redir
  }});
});

// Create session
app.post('/sessions', function(req, res) {
  User.authenticate(req.body.login, req.body.password, function(user) {
    if (user) { 
      req.session.user = user;
      res.redirect(req.body.redir || '/');
    } else {
      req.flash('warn', 'Login failed');
      res.render('sessions/new', {locals: {redir: req.body.redir}});
    };
  });
});

// Delete session
app.get('/sessions/destroy', function(req, res) {
  delete req.session.user;
  res.redirect('/sessions/new');
});

// Users

// New user
app.get('/users/new', function(req, res) {
  res.render('users/new', {locals: {
    user: req.body && req.body.user || new User()
  }});
});

// Create user
app.post('/users', function(req, res) {
  var user = new User(req.body.user);
  user.save(function(error) {
    if (error) {
      req.flash('warn', 'Sign up failed');
      res.render('users/new', { locals: {
        user: req.body.user
      }});
    } else {
      req.flash('warn', 'Sign up successful. Please sign in');
      res.redirect('/sessions/new');
    }
  });
});

// Read user
app.get('/user', requiresLogin, function(req, res) {
  User.findById(req.session.user, function(error, user) {
    res.render('users/show', {locals: {
      user: user
    }});
  });
});


// Products

// create our product model from our schema
// done differently to user model for no reason
require('./models/products');
var Product = db.model('Product');

app.get('/products', function(req, res) {
  Product.find({}, function(err, products) {
    res.render('products/index', {locals: {
      products: products
    }});
  });
});

app.get('/products/new', requiresLogin, function(req, res) {
  res.render('products/new', {locals: {
    product: req.body && req.body.product || new Product()
  }});
});

app.post('/products', requiresLogin, function(req, res) {
  var product = new Product(req.body.product);
  product.save(function() {
    res.redirect('/products/' + product._id.toHexString());
  });
});

app.get('/products/:id', function(req, res) {
  Product.findById(req.params.id, function(err, product) {
    res.render('products/show', {locals: {
      product: product
    }});
  });
});

app.get('/products/:id/edit', requiresLogin, function(req, res) {
  Product.findById(req.params.id, function(err, product) {
    res.render('products/edit', {locals: {
      product: product
    }});
  });
});

app.put('/products/:id', requiresLogin, function(req, res) {
  var id = req.params.id;
  Product.findById(id, function(err, product) {
    product.name = req.body.product.name;
    product.description = req.body.product.description;
    product.price = req.body.product.price;
    product.save(function() {
      res.redirect('/products/' + product._id.toHexString());
    });
  });
});

// start our server
app.listen(3000);
console.log('Listening on port 3000...');
var Mongoose = require('mongoose')
    , Schema = Mongoose.Schema;

// use this for getting a random salt for password hashing
var RSG = require('./../lib/random_string_generator');

// use this for hashing the password
var sys = require('sys'), 
   hash = require('./../lib/hash');

function validatePresenceOf(value) {
  return value && value.length;
}

var UserSchema = new Schema({
  login         : { type: String, validate: [validatePresenceOf, 'a login is required'], index: { unique: true } },
  password_salt : String,
  password_hash : String,
  role          : { type: String, enum: ['admin', 'user'], default: 'user' },
  created_at    : { type: Date, default: Date.now },
  activated     : { type: Boolean, default: false },
  ip_address    : String
});

// static method for authentication
UserSchema.static('authenticate', function(login, password, callback) {
  this.findOne({login: login}, function (err, user) {
    if (!user) {
      callback(null);
      return;
    };
    if ( hash.md5(password, user.password_salt) == user.password_hash ) {
      callback(user.doc);
      return;
    };
    callback(null);
  });
  
});

// if our password is set then write the salt and hash instead
UserSchema.virtual('password')
  .set(function (password) {
    this._password = password;
    var rsg1 = RSG.create(40);
    salt = rsg1.generate();
    this.set('password_salt', salt);
    this.set('password_hash', hash.md5(password, salt));
  })
  .get(function() { return this._password; });

// is _password and _password_confirmation the securest way to do this?
UserSchema.virtual('password_confirmation')
  .set(function (password_confirmation) {
    this._password_confirmation = password_confirmation;
  })
  .get(function() { return this._password_confirmation; });
  
// confirm that password matches password_confirmation
UserSchema.pre('save', function (next) {
  if (this._password == this._password_confirmation) {
    next();
  } else {
    // something goes wrong
    next(new Error('something went wrong'));
  }
});

exports.UserSchema = UserSchema;

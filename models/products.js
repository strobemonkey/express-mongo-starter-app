var Mongoose = require('mongoose')
    , Schema = Mongoose.Schema;
    
var ProductSchema = new Schema({
  name        : String,
  description : String,
  price       : Number
});

Mongoose.model('Product', ProductSchema);
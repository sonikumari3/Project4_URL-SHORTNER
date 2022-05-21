//IMPORTING MONGOOSE PACKAGE-----
const mongoose = require("mongoose");

// INSTANTIATE A MONGOOSE SCHEMA----

const URLSchema = new mongoose.Schema({
  urlCode: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  longUrl: { 
      type: String,
       required: true, 
       lowercase: true, 
       trim: true
     },
     
  shortUrl: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
});

module.exports = mongoose.model("Url", URLSchema);

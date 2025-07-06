const mongoose = require("mongoose");

const networkscheme = new mongoose.Schema({
  name: String,
  position:String,
  location:String,
  description: String,
  email: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("network", networkscheme);

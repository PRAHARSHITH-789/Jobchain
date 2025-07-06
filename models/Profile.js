const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
  roleType: { type: String, enum: ["jobseeker", "recruiter"], required: true },
  name: String,
  contactNumber: String,
  jobRole: String,
  skills: String,
  experience: String,
  salary: String,
  description: String,
  email: String,
  filePath: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Profile", ProfileSchema);

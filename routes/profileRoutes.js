const express = require("express");
const multer = require("multer");
const path = require("path");
const Profile = require("../models/Profile");

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

router.get("/jobseekers", async (req, res) => {
  try {
    const seekers = await Profile.find({ roleType: "jobseeker" })
    res.json(seekers);
  } catch (err) {
    console.error("Error fetching jobseekers:", err); // Log the actual error
    res.status(500).json({ error: "Failed to fetch jobseekers" });
  }
});


router.get("/recruiter/:email", async (req, res) => {
  const email = req.params.email;
try {
    const recruiterProfile = await Profile.findOne({
      email: email,
      roleType: "recruiter"
    });

    if (!recruiterProfile) {
      return res.status(404).json({ message: "Recruiter profile not found" });
    }

    res.status(200).json(recruiterProfile);
  } catch (error) {
    console.error("Error checking recruiter:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/jobs", async (req, res) => {
  try {
    const { email } = req.body;

    const data = await Profile.findOne({ email: email, roleType: "recruiter", });
{data ?  res.status(200).json(data):res.send("data not found")};
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const {
      roleType, name, contactNumber, jobRole,
      skills, experience, salary, description, email
    } = req.body;
console.log("we got the data");
    const profile = new Profile({
      roleType,
      name,
      contactNumber,
      jobRole,
      skills,
      experience,
      salary,
      description,
      email,
      filePath: req.file ? req.file.path : null
    });

    await profile.save();
    res.status(201).json({ message: "Profile saved successfully", profile });
  } catch (err) {
    console.error("Profile Save Error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;

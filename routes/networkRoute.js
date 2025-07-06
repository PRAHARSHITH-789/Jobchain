const express = require("express");
const path = require("path");
const network = require("../models/Network");

const router = express.Router();

router.get("/posts",async(req,res)=>{

const data= await network.find();

res.status(200).json(data);




})

router.post("/post", async (req, res) => {
  try {
    const {
      name,
      position,
      location,
      description,
      email,
    } = req.body;

    const post = new network({
      name,
      position,
      location,
      description,
      email,
    });

    await post.save();
    res.status(201).json({ message: "Profile saved successfully", post });

    console.log(post);
  } catch (err) {
    console.error("Profile Save Error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;

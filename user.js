const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

app.post("/generate-story", (req, res) => {
  const { input } = req.body;

  if (!input) {
    return res.status(400).json({ error: "Input is required" });
  }

  const story = `Once upon a time, ${input} embarked on an incredible journey...`;

  res.json({ story });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
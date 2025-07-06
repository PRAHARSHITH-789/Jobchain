const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/JoBChain", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Connection Failed:", err));

// Expense Schema
const ExpenseSchema = new mongoose.Schema({
  name: String,
  amount: Number,
  date: Date,
  reference: String,
  file: String,
});

const Expense = mongoose.model("Expense", ExpenseSchema,"data");

// Multer Storage for File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

// Add Expense API
app.post("/add-expense", upload.single("file"), async (req, res) => {
  try {
    const { name, amount, date, reference } = req.body;
    if (!name || !amount || !date) return res.status(400).json({ message: "All fields (name, amount, date) are required" });

    const filePath = req.file ? `/uploads/${req.file.filename}` : null;

    const newExpense = new Expense({ name, amount: Number(amount), date, reference, file: filePath });
    await newExpense.save();

    res.status(201).json({ message: "Expense added successfully", expense: newExpense });
  } catch (error) {
    console.error("Error adding expense:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Get All Expenses API
app.get("/data", async (req, res) => {
  try {
    const data = await Expense.find();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch data", error });
  }
});

// Get User Expenses Based on Filter
app.get("/users/:filter/:value", async (req, res) => {
  try {
    const { filter, value } = req.params;
    let query = {};

    if (filter === "Daily") {
      const selectedDate = new Date(value);
      if (isNaN(selectedDate.getTime())) return res.status(400).json({ message: "Invalid date format" });

      const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

      query.date = { $gte: startOfDay, $lt: endOfDay };
    } 
    else if (filter === "Monthly") {
      const year = new Date().getFullYear();
      const monthIndex = Number(value);

      const startOfMonth = new Date(year, monthIndex, 1);
      const endOfMonth = new Date(year, monthIndex + 1, 0);

      query.date = { $gte: startOfMonth, $lt: endOfMonth };
    } 
    else if (filter === "Yearly") {
      const year = Number(value);
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year + 1, 0, 1);

      query.date = { $gte: startOfYear, $lt: endOfYear };
    } 
    else {
      return res.status(400).json({ message: "Invalid filter type" });
    }

    const expenses = await Expense.find(query);
    res.json(expenses);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

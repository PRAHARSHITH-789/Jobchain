const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jobs=require('./models/jobs');

dotenv.config();
const networkRoute=require("./routes/networkRoute");
const User = require("./models/User");
const profileRoutes = require("./routes/profileRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/recommend",jobs);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
 const { Connection } = require("@solana/web3.js");
const Payment = require("./models/Payment"); // <- import the model

const SOLANA_NETWORK = "https://api.devnet.solana.com";
const EXPECTED_AMOUNT = 0.01 * 1e9; // 0.01 SOL
const RECEIVER_WALLET = "Your_Receiver_Wallet"; // <- REPLACE with your actual wallet address

const connection = new Connection(SOLANA_NETWORK, "confirmed");

app.post("/verify-payment", async (req, res) => {
  const { txid, from, to } = req.body;

  try {
    const tx = await connection.getParsedTransaction(txid, { maxSupportedTransactionVersion: 0 });

    if (!tx || !tx.meta || tx.meta.err) {
      return res.status(400).json({ verified: false, error: "Transaction not found or failed" });
    }

    const { preBalances, postBalances, transaction } = tx;
    const sender = transaction.message.accountKeys[0].pubkey.toString();
    const receiver = transaction.message.accountKeys[1].pubkey.toString();
    const lamportsSent = preBalances[0] - postBalances[0];

    const isCorrectSender = sender === from;
    const isCorrectReceiver = receiver === to || to === RECEIVER_WALLET;
    const isCorrectAmount = lamportsSent >= EXPECTED_AMOUNT;

    if (isCorrectSender && isCorrectReceiver && isCorrectAmount) {
      // Save to DB
      const payment = new Payment({
        txid,
        from,
        to: RECEIVER_WALLET,
        amount: lamportsSent / 1e9,
        verified: true
      });
      await payment.save();

      return res.json({ verified: true });
    } else {
      return res.status(400).json({
        verified: false,
        reason: {
          senderCorrect: isCorrectSender,
          receiverCorrect: isCorrectReceiver,
          amountCorrect: isCorrectAmount
        }
      });
    }
  } catch (err) {
    console.error("Verification error:", err);
    return res.status(500).json({ verified: false, error: "Server error during verification" });
  }
});


app.use("/profile", profileRoutes);
app.use("/network",networkRoute);



app.post("/sign_in", async (req, res) => {
  const { email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hashedPassword,Appiled:''});

  try {
    await user.save();
    res.status(200).json({ message: "User created successfully" });
  } catch (err) {
    console.error("User creation error:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ email: user.email, id: user._id }, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });

    res.status(200).json({ token, user: { email: user.email } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

app.delete("/delete-all", async (req, res) => {
  try {
    const result = await User.deleteMany({});
    res.status(200).json({ message: "All users deleted successfully", result });
  } catch (error) {
    console.error("Error deleting users:", error);
    res.status(500).json({ message: "Server error", error });
  }
});


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("MongoDB Connected");
  app.listen(8080, () => {
    console.log("Server running on http://localhost:8080");
  });
}).catch(err => console.error("MongoDB Connection Error:", err));

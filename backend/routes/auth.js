const express = require("express");
const auth = require("../auth");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    const result = await auth.register({ name, email, password });
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const result = await auth.login({ email, password });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "login failed" });
  }
});

router.get("/me", auth.requireAuth, (req, res) => {
  const user = auth.getUserById(req.userId);
  if (!user) return res.status(404).json({ error: "user not found" });
  res.json({ user });
});

module.exports = router;

/**
 * HomeGuardian AI — Auth module
 * JWT + bcrypt auth backed by a simple JSON file "database" (users.json)
 * so the project needs zero external DB setup to run or demo.
 * Swap `readUsers`/`writeUsers` for a real DB (Postgres/Mongo) in production.
 */
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = "7d";
const USERS_FILE = path.join(__dirname, "data", "users.json");

function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeUsers(users) {
  fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, createdAt: u.createdAt };
}

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

async function register({ name, email, password }) {
  if (!name || !email || !password) {
    const err = new Error("name, email and password are required");
    err.status = 400;
    throw err;
  }
  if (password.length < 6) {
    const err = new Error("password must be at least 6 characters");
    err.status = 400;
    throw err;
  }
  const users = readUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    const err = new Error("an account with this email already exists");
    err.status = 409;
    throw err;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: uuidv4(),
    name,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeUsers(users);
  return { user: publicUser(user), token: signToken(user) };
}

async function login({ email, password }) {
  if (!email || !password) {
    const err = new Error("email and password are required");
    err.status = 400;
    throw err;
  }
  const users = readUsers();
  const user = users.find((u) => u.email.toLowerCase() === (email || "").toLowerCase());
  if (!user) {
    const err = new Error("invalid email or password");
    err.status = 401;
    throw err;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const err = new Error("invalid email or password");
    err.status = 401;
    throw err;
  }
  return { user: publicUser(user), token: signToken(user) };
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "missing bearer token" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    req.userEmail = payload.email;
    next();
  } catch {
    return res.status(401).json({ error: "invalid or expired token" });
  }
}

function getUserById(id) {
  const users = readUsers();
  const user = users.find((u) => u.id === id);
  return user ? publicUser(user) : null;
}

module.exports = { register, login, requireAuth, getUserById, publicUser };

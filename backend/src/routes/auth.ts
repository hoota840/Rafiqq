import { randomUUID } from "crypto";
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { createUser, findByEmail, findById, updateUser, User } from "../services/userStore";
import { requireAuth, AuthedRequest } from "../middleware/requireAuth";

const router = Router();
const TOKEN_TTL = "30d";

function publicUser(user: User) {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

function issueToken(userId: string): string {
  return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: TOKEN_TTL });
}

/** POST /api/auth/signup — { email, password } => { token, user } */
router.post("/signup", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  if (findByEmail(email)) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const user: User = {
    id: randomUUID(),
    email,
    passwordHash: await bcrypt.hash(password, 10),
    name: "",
    phone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    createdAt: Date.now(),
  };
  createUser(user);

  res.status(201).json({ token: issueToken(user.id), user: publicUser(user) });
});

/** POST /api/auth/login — { email, password } => { token, user } */
router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  const user = findByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  res.json({ token: issueToken(user.id), user: publicUser(user) });
});

/** GET /api/auth/me — requires Authorization: Bearer <token> */
router.get("/me", requireAuth, (req: AuthedRequest, res) => {
  const user = findById(req.userId!);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: publicUser(user) });
});

/** PATCH /api/auth/me — { name?, phone?, emergencyContactName?, emergencyContactPhone? } */
router.patch("/me", requireAuth, (req: AuthedRequest, res) => {
  const { name, phone, emergencyContactName, emergencyContactPhone } = req.body as Partial<
    Pick<User, "name" | "phone" | "emergencyContactName" | "emergencyContactPhone">
  >;
  const updated = updateUser(req.userId!, { name, phone, emergencyContactName, emergencyContactPhone });
  if (!updated) return res.status(404).json({ error: "User not found" });
  res.json({ user: publicUser(updated) });
});

export default router;

import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Request } from "express";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

const router = Router();

router.post("/register", async (req: Request, res) => {
  const { username, email, password } = req.body as {
    username?: string;
    email?: string;
    password?: string;
  };

  if (!username || !email || !password) {
    res.status(400).json({ error: "username, email, and password are required" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()))
    .limit(1);

  if (existing) {
    res.status(409).json({ error: "An account with that email already exists" });
    return;
  }

  const [takenUsername] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username.trim()))
    .limit(1);

  if (takenUsername) {
    res.status(409).json({ error: "That username is already taken" });
    return;
  }

  const password_hash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(usersTable)
    .values({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password_hash,
    })
    .returning({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
    });

  req.session.userId = user!.id;

  res.status(201).json({ user });
});

router.post("/login", async (req: Request, res) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  req.session.userId = user.id;

  res.json({
    user: { id: user.id, username: user.username, email: user.email },
  });
});

router.get("/me", async (req: Request, res) => {
  if (!req.session.userId) {
    res.json({ user: null });
    return;
  }

  const [user] = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
    })
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId))
    .limit(1);

  res.json({ user: user ?? null });
});

router.post("/logout", (req: Request, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

export default router;

import fs from "fs";
import path from "path";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  createdAt: number;
};

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DATA_FILE = path.join(DATA_DIR, "users.json");

/**
 * Flat-file JSON store — enough for a hackathon demo (no external DB to
 * provision). On free hosting tiers with ephemeral disks this resets on
 * redeploy/restart, but persists across requests while the instance is
 * running. Swap for a real database before this needs to survive redeploys.
 */
function readAll(): User[] {
  if (!fs.existsSync(DATA_FILE)) return [];
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  if (!raw.trim()) return [];
  return JSON.parse(raw) as User[];
}

function writeAll(users: User[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), "utf-8");
}

export function findByEmail(email: string): User | undefined {
  return readAll().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function createUser(user: User): void {
  const users = readAll();
  users.push(user);
  writeAll(users);
}

export function updateUser(id: string, patch: Partial<Omit<User, "id" | "email" | "passwordHash">>): User | undefined {
  const users = readAll();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return undefined;
  users[idx] = { ...users[idx], ...patch };
  writeAll(users);
  return users[idx];
}

export function findById(id: string): User | undefined {
  return readAll().find((u) => u.id === id);
}

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organization: string;
  passwordHash?: string;
  passwordSalt?: string;
  authProvider: 'email' | 'google';
  googleId?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  token: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  organization: string;
  stationId: string;
  nodeLocation: string;
  telemetryStatus: 'online' | 'synced';
  loginTimestamp: string;
  authProvider: 'email' | 'google';
  createdAt: number;
  expiresAt: number;
}

export interface ActiveOTP {
  email: string;
  hashedCode: string;
  purpose: '2fa_login' | 'email_verification' | 'enable_2fa';
  expiresAt: number;
  attempts: number;
  lastRequestedAt: number;
  resendCooldownUntil: number;
}

export interface PasswordResetToken {
  token: string;
  email: string;
  expiresAt: number;
  used: boolean;
}

export interface DispatchedEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  type: 'otp' | 'password_reset' | 'security_alert';
  timestamp: string;
  expiresAt?: string;
}

interface DatabaseSchema {
  users: Record<string, StoredUser>;
  sessions: Record<string, UserSession>;
  otps: Record<string, ActiveOTP>;
  resetTokens: Record<string, PasswordResetToken>;
  dispatchedEmails: DispatchedEmail[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'auth-db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper for hashing password securely with scrypt
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
  } catch {
    return false;
  }
}

export function hashOTP(code: string): string {
  return crypto.createHash('sha256').update(code.trim()).digest('hex');
}

// In-memory cache synced to disk
let dbCache: DatabaseSchema | null = null;

function loadDatabase(): DatabaseSchema {
  if (dbCache) return dbCache;

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(content);
      return dbCache!;
    } catch (e) {
      console.error('Error reading auth-db.json, re-initializing', e);
    }
  }

  // Initial seed with an initial verified commander user for immediate evaluation if desired
  const defaultSalt = crypto.randomBytes(16).toString('hex');
  const defaultHash = crypto.scryptSync('OrcaMarine#2026', defaultSalt, 64).toString('hex');

  const initialUser: StoredUser = {
    id: 'user_commander_01',
    email: 'commander@orca-marine.ai',
    name: 'Chief Telemetry Officer',
    role: 'Coastal Authorities',
    organization: 'Oceanic AI Research & Deep Ocean Telemetry',
    passwordHash: defaultHash,
    passwordSalt: defaultSalt,
    authProvider: 'email',
    emailVerified: true,
    twoFactorEnabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  dbCache = {
    users: {
      [initialUser.email.toLowerCase()]: initialUser,
    },
    sessions: {},
    otps: {},
    resetTokens: {},
    dispatchedEmails: [],
  };

  saveDatabase(dbCache);
  return dbCache;
}

function saveDatabase(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to persist auth-db.json:', e);
  }
}

// USER OPERATIONS
export function findUserByEmail(email: string): StoredUser | null {
  const db = loadDatabase();
  const normalized = email.trim().toLowerCase();
  return db.users[normalized] || null;
}

export function findUserById(id: string): StoredUser | null {
  const db = loadDatabase();
  for (const email in db.users) {
    if (db.users[email].id === id) {
      return db.users[email];
    }
  }
  return null;
}

export function createUser(userData: Omit<StoredUser, 'id' | 'createdAt' | 'updatedAt'>): StoredUser {
  const db = loadDatabase();
  const normalized = userData.email.trim().toLowerCase();
  
  if (db.users[normalized]) {
    throw new Error('User already exists');
  }

  const id = `usr_${crypto.randomBytes(12).toString('hex')}`;
  const now = new Date().toISOString();

  const newUser: StoredUser = {
    ...userData,
    email: normalized,
    id,
    createdAt: now,
    updatedAt: now,
  };

  db.users[normalized] = newUser;
  saveDatabase(db);
  return newUser;
}

export function updateUser(id: string, updates: Partial<Omit<StoredUser, 'id' | 'createdAt'>>): StoredUser | null {
  const db = loadDatabase();
  const user = findUserById(id);
  if (!user) return null;

  const oldEmail = user.email.toLowerCase();
  const updatedUser: StoredUser = {
    ...user,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // If email changed
  if (updates.email && updates.email.toLowerCase() !== oldEmail) {
    delete db.users[oldEmail];
    db.users[updates.email.toLowerCase()] = updatedUser;
  } else {
    db.users[oldEmail] = updatedUser;
  }

  saveDatabase(db);
  return updatedUser;
}

// SESSION OPERATIONS
export function createSession(user: StoredUser): UserSession {
  const db = loadDatabase();
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

  const session: UserSession = {
    token,
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organization: user.organization,
    stationId: 'NODE-PACIFIC-09',
    nodeLocation: 'Pacific Deep Basin • Grid 48.2N',
    telemetryStatus: 'online',
    loginTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    authProvider: user.authProvider,
    createdAt: now,
    expiresAt,
  };

  db.sessions[token] = session;
  saveDatabase(db);
  return session;
}

export function getSession(token: string): UserSession | null {
  const db = loadDatabase();
  const session = db.sessions[token];
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    delete db.sessions[token];
    saveDatabase(db);
    return null;
  }

  return session;
}

export function deleteSession(token: string): boolean {
  const db = loadDatabase();
  if (db.sessions[token]) {
    delete db.sessions[token];
    saveDatabase(db);
    return true;
  }
  return false;
}

export function deleteAllUserSessions(userId: string, exceptToken?: string): number {
  const db = loadDatabase();
  let count = 0;
  for (const token in db.sessions) {
    if (db.sessions[token].userId === userId && token !== exceptToken) {
      delete db.sessions[token];
      count++;
    }
  }
  saveDatabase(db);
  return count;
}

// OTP OPERATIONS
export function storeOTP(
  email: string,
  plainCode: string,
  purpose: '2fa_login' | 'email_verification' | 'enable_2fa',
  expiresInSeconds: number = 300 // 5 minutes
): ActiveOTP {
  const db = loadDatabase();
  const normalized = email.trim().toLowerCase();
  const key = `${normalized}:${purpose}`;
  const now = Date.now();
  const expiresAt = now + expiresInSeconds * 1000;
  const resendCooldownUntil = now + 60 * 1000; // 60 seconds rate limit

  const otpRecord: ActiveOTP = {
    email: normalized,
    hashedCode: hashOTP(plainCode),
    purpose,
    expiresAt,
    attempts: 0,
    lastRequestedAt: now,
    resendCooldownUntil,
  };

  db.otps[key] = otpRecord;
  saveDatabase(db);
  return otpRecord;
}

export function getOTP(email: string, purpose: '2fa_login' | 'email_verification' | 'enable_2fa'): ActiveOTP | null {
  const db = loadDatabase();
  const normalized = email.trim().toLowerCase();
  const key = `${normalized}:${purpose}`;
  return db.otps[key] || null;
}

export function incrementOTPAttempts(email: string, purpose: '2fa_login' | 'email_verification' | 'enable_2fa'): number {
  const db = loadDatabase();
  const normalized = email.trim().toLowerCase();
  const key = `${normalized}:${purpose}`;
  const otp = db.otps[key];
  if (!otp) return 0;

  otp.attempts += 1;
  saveDatabase(db);
  return otp.attempts;
}

export function invalidateOTP(email: string, purpose: '2fa_login' | 'email_verification' | 'enable_2fa'): void {
  const db = loadDatabase();
  const normalized = email.trim().toLowerCase();
  const key = `${normalized}:${purpose}`;
  if (db.otps[key]) {
    delete db.otps[key];
    saveDatabase(db);
  }
}

// PASSWORD RESET TOKEN OPERATIONS
export function createPasswordResetToken(email: string): string {
  const db = loadDatabase();
  const normalized = email.trim().toLowerCase();
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

  db.resetTokens[token] = {
    token,
    email: normalized,
    expiresAt,
    used: false,
  };

  saveDatabase(db);
  return token;
}

export function verifyPasswordResetToken(token: string): PasswordResetToken | null {
  const db = loadDatabase();
  const record = db.resetTokens[token];
  if (!record) return null;

  if (record.used || Date.now() > record.expiresAt) {
    return null;
  }

  return record;
}

export function markPasswordResetTokenUsed(token: string): void {
  const db = loadDatabase();
  if (db.resetTokens[token]) {
    db.resetTokens[token].used = true;
    saveDatabase(db);
  }
}

// EMAIL LOGGING
export function recordDispatchedEmail(email: Omit<DispatchedEmail, 'id' | 'timestamp'>): DispatchedEmail {
  const db = loadDatabase();
  const record: DispatchedEmail = {
    ...email,
    id: `msg_${crypto.randomBytes(8).toString('hex')}`,
    timestamp: new Date().toISOString(),
  };

  // Keep last 50 emails
  db.dispatchedEmails.unshift(record);
  if (db.dispatchedEmails.length > 50) {
    db.dispatchedEmails.pop();
  }

  saveDatabase(db);
  return record;
}

export function getDispatchedEmails(emailFilter?: string): DispatchedEmail[] {
  const db = loadDatabase();
  if (!emailFilter) return db.dispatchedEmails;
  const normalized = emailFilter.trim().toLowerCase();
  return db.dispatchedEmails.filter((m) => m.to.toLowerCase() === normalized);
}

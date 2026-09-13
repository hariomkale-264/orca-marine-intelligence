import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import {
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  createSession,
  getSession,
  deleteSession,
  deleteAllUserSessions,
  hashPassword,
  verifyPassword,
  storeOTP,
  getOTP,
  incrementOTPAttempts,
  invalidateOTP,
  createPasswordResetToken,
  verifyPasswordResetToken,
  markPasswordResetTokenUsed,
  getDispatchedEmails,
  StoredUser,
} from './db.js';
import { sendOTPEmail, sendPasswordResetEmail } from './email.js';

export const authRouter = Router();

// Helper to mask email for UI (e.g., u***@gmail.com)
export function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;
  const first = name.charAt(0);
  return `${first}***@${domain}`;
}

// Middleware to authenticate requests via Bearer token
export function requireAuth(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const session = getSession(token);
  if (!session) {
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    return;
  }

  (req as any).session = session;
  (req as any).user = findUserById(session.userId);
  next();
}

// 1. SIGN UP
authRouter.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, confirmPassword, name, organization, role } = req.body;

    if (!email || !email.trim()) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    if (!password || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match.' });
      return;
    }

    const existingUser = findUserByEmail(email);
    if (existingUser) {
      if (!existingUser.emailVerified) {
        // User initiated sign up earlier but didn't complete OTP verification.
        // Update credentials with new password, dispatch a fresh OTP, and allow them to verify!
        const { hash, salt } = hashPassword(password);
        updateUser(existingUser.id, {
          name: name?.trim() || existingUser.name,
          role: role || existingUser.role,
          organization: organization || existingUser.organization,
          passwordHash: hash,
          passwordSalt: salt,
        });

        const code = crypto.randomInt(100000, 1000000).toString();
        storeOTP(existingUser.email, code, 'email_verification', 300);
        await sendOTPEmail(existingUser.email, code, 'email_verification');

        res.status(200).json({
          success: true,
          requireVerification: true,
          email: maskEmail(existingUser.email),
          rawEmail: existingUser.email,
          message: 'Account pending verification. A fresh verification code has been dispatched.',
        });
        return;
      }

      res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
      return;
    }

    // Secure password hashing with scrypt
    const { hash, salt } = hashPassword(password);

    // Create user in inactive/unverified state
    const newUser = createUser({
      email: email.trim().toLowerCase(),
      name: name?.trim() || 'Oceanic Operator',
      role: role || 'Oceanographer',
      organization: organization || 'Maritime Telemetry Network',
      passwordHash: hash,
      passwordSalt: salt,
      authProvider: 'email',
      emailVerified: false,
      twoFactorEnabled: false,
    });

    // Generate random, cryptographically secure 6-digit OTP
    const code = crypto.randomInt(100000, 1000000).toString();
    storeOTP(newUser.email, code, 'email_verification', 300);

    // Send verification email immediately
    await sendOTPEmail(newUser.email, code, 'email_verification');

    res.status(201).json({
      success: true,
      requireVerification: true,
      email: maskEmail(newUser.email),
      rawEmail: newUser.email,
      message: 'Account created. Verification code sent to your email.',
    });
  } catch (err: any) {
    console.error('Sign up error:', err);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// 2. LOGIN
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Invalid email or password.' });
      return;
    }

    const user = findUserByEmail(email);
    if (!user || !user.passwordHash || !user.passwordSalt) {
      // Constant-time dummy verification to protect against timing attacks
      verifyPassword('dummy_password', 'a'.repeat(128), 'b'.repeat(32));
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isValid = verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Check if email is verified
    if (!user.emailVerified) {
      const code = crypto.randomInt(100000, 1000000).toString();
      storeOTP(user.email, code, 'email_verification', 300);
      await sendOTPEmail(user.email, code, 'email_verification');

      res.status(403).json({
        error: 'Please verify your email before continuing.',
        requireVerification: true,
        email: maskEmail(user.email),
        rawEmail: user.email,
      });
      return;
    }

    // Check if 2FA is ON
    if (user.twoFactorEnabled) {
      const code = crypto.randomInt(100000, 1000000).toString();
      storeOTP(user.email, code, '2fa_login', 300);
      await sendOTPEmail(user.email, code, '2fa_login');

      res.json({
        success: true,
        require2FA: true,
        email: maskEmail(user.email),
        rawEmail: user.email,
        message: 'Enter the 6-digit code sent to your verified email.',
      });
      return;
    }

    // Two-Step Verification is OFF: Create authenticated session directly
    const session = createSession(user);
    res.json({
      success: true,
      session,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organization: user.organization,
        twoFactorEnabled: user.twoFactorEnabled,
        authProvider: user.authProvider,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Authentication service error.' });
  }
});

// 3. VERIFY OTP (for 2FA, Email Verification, or 2FA Activation)
authRouter.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, code, purpose = '2fa_login' } = req.body;

    if (!email || !code) {
      res.status(400).json({ error: 'Email and verification code are required.' });
      return;
    }

    const cleanCode = code.toString().trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      res.status(400).json({ error: 'The verification code must be exactly 6 digits.' });
      return;
    }

    const validPurposes = ['2fa_login', 'email_verification', 'enable_2fa'];
    if (!validPurposes.includes(purpose)) {
      res.status(400).json({ error: 'Invalid verification purpose.' });
      return;
    }

    const otp = getOTP(email, purpose);
    if (!otp) {
      res.status(400).json({
        error: 'This verification code has expired. Please request a new code.',
        expired: true,
      });
      return;
    }

    // Check expiration (5 minutes)
    if (Date.now() > otp.expiresAt) {
      invalidateOTP(email, purpose);
      res.status(400).json({
        error: 'This verification code has expired. Please request a new code.',
        expired: true,
      });
      return;
    }

    // Check max attempts
    if (otp.attempts >= 5) {
      invalidateOTP(email, purpose);
      res.status(429).json({
        error: 'Too many verification attempts. Please try again later.',
        tooManyAttempts: true,
      });
      return;
    }

    // Validate code hash securely
    const submittedHash = crypto.createHash('sha256').update(cleanCode).digest('hex');
    if (submittedHash !== otp.hashedCode) {
      const attempts = incrementOTPAttempts(email, purpose);
      const remaining = Math.max(0, 5 - attempts);
      res.status(400).json({
        error: 'The verification code is incorrect.',
        remainingAttempts: remaining,
      });
      return;
    }

    // Code is valid! Invalidate OTP immediately
    invalidateOTP(email, purpose);

    const user = findUserByEmail(email);
    if (!user) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    if (purpose === 'email_verification') {
      updateUser(user.id, { emailVerified: true });
      const session = createSession(user);
      res.json({
        success: true,
        message: 'Email successfully verified.',
        session,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organization: user.organization,
          twoFactorEnabled: user.twoFactorEnabled,
          authProvider: user.authProvider,
        },
      });
      return;
    }

    if (purpose === '2fa_login') {
      const session = createSession(user);
      res.json({
        success: true,
        message: 'Authentication successful.',
        session,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organization: user.organization,
          twoFactorEnabled: user.twoFactorEnabled,
          authProvider: user.authProvider,
        },
      });
      return;
    }

    if (purpose === 'enable_2fa') {
      updateUser(user.id, { twoFactorEnabled: true });
      res.json({
        success: true,
        message: 'Two-step verification has been activated.',
        twoFactorEnabled: true,
      });
      return;
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('OTP verification error:', err);
    res.status(500).json({ error: 'Failed to verify code.' });
  }
});

// 4. RESEND OTP
authRouter.post('/resend-otp', async (req: Request, res: Response) => {
  try {
    const { email, purpose = '2fa_login' } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }

    const otp = getOTP(email, purpose);
    const now = Date.now();

    // Check 60-second rate limiting
    if (otp && now < otp.resendCooldownUntil) {
      const secondsLeft = Math.ceil((otp.resendCooldownUntil - now) / 1000);
      res.status(429).json({
        error: `Too many requests. Please try again in ${secondsLeft} seconds.`,
        secondsLeft,
      });
      return;
    }

    // Invalidate previous code
    invalidateOTP(email, purpose);

    // Generate new secure 6-digit code
    const code = crypto.randomInt(100000, 1000000).toString();
    storeOTP(email, code, purpose, 300);

    // Send new email
    await sendOTPEmail(email, code, purpose);

    res.json({
      success: true,
      message: 'A new verification code has been sent to your email.',
    });
  } catch (err: any) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ error: 'Failed to resend code.' });
  }
});

// 5. GOOGLE OAUTH AUTHENTICATION
authRouter.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential, accessToken } = req.body;

    if (!credential && !accessToken) {
      res.status(400).json({ error: 'Google authentication credential is required.' });
      return;
    }

    let googlePayload: any = null;

    if (credential) {
      // Validate Google ID Token using Google's official tokeninfo endpoint
      const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (!googleRes.ok) {
        console.error('Google tokeninfo rejected token:', await googleRes.text());
        res.status(400).json({ error: 'Google authentication failed. Invalid token.' });
        return;
      }
      googlePayload = await googleRes.json();
    } else if (accessToken) {
      // Validate Google Access Token using Google's userinfo endpoint
      const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!googleRes.ok) {
        res.status(400).json({ error: 'Google authentication failed. Invalid access token.' });
        return;
      }
      googlePayload = await googleRes.json();
    }

    if (!googlePayload || !googlePayload.email) {
      res.status(400).json({ error: 'Google sign-in could not be completed. Please try again.' });
      return;
    }

    const email = googlePayload.email.toLowerCase().trim();
    const name = googlePayload.name || email.split('@')[0];
    const googleId = googlePayload.sub;

    let user = findUserByEmail(email);

    if (!user) {
      // Create user account on first Google login
      user = createUser({
        email,
        name,
        role: 'Oceanographer',
        organization: 'Marine Telemetry Network',
        authProvider: 'google',
        googleId,
        avatarUrl: googlePayload.picture,
        emailVerified: true,
        twoFactorEnabled: false,
      });
    } else {
      // Update Google metadata if needed
      updateUser(user.id, {
        googleId,
        avatarUrl: googlePayload.picture || user.avatarUrl,
        emailVerified: true,
      });
    }

    // Check if user has 2FA enabled
    if (user.twoFactorEnabled) {
      const code = crypto.randomInt(100000, 1000000).toString();
      storeOTP(user.email, code, '2fa_login', 300);
      await sendOTPEmail(user.email, code, '2fa_login');

      res.json({
        success: true,
        require2FA: true,
        email: maskEmail(user.email),
        rawEmail: user.email,
        message: 'Two-step verification required for Google login.',
      });
      return;
    }

    // 2FA is OFF: issue session
    const session = createSession(user);
    res.json({
      success: true,
      session,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organization: user.organization,
        twoFactorEnabled: user.twoFactorEnabled,
        authProvider: user.authProvider,
      },
    });
  } catch (err: any) {
    console.error('Google OAuth error:', err);
    res.status(500).json({ error: 'Google sign-in could not be completed. Please try again.' });
  }
});

// 6. FORGOT PASSWORD
authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    const user = findUserByEmail(email);
    if (user && user.authProvider === 'email') {
      const token = createPasswordResetToken(user.email);
      const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
      const resetUrl = `${appUrl}/login?reset_token=${token}&email=${encodeURIComponent(user.email)}`;
      await sendPasswordResetEmail(user.email, resetUrl);
    }

    // Always respond with success to prevent email enumeration
    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process request.' });
  }
});

// 7. RESET PASSWORD
authRouter.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!token || !newPassword || newPassword.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters.' });
      return;
    }

    const resetRecord = verifyPasswordResetToken(token);
    if (!resetRecord) {
      res.status(400).json({ error: 'This password reset link is invalid or has expired.' });
      return;
    }

    const user = findUserByEmail(resetRecord.email);
    if (!user) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    const { hash, salt } = hashPassword(newPassword);
    updateUser(user.id, {
      passwordHash: hash,
      passwordSalt: salt,
    });

    markPasswordResetTokenUsed(token);
    // Invalidate all existing sessions
    deleteAllUserSessions(user.id);

    res.json({
      success: true,
      message: 'Your password has been successfully reset. Please sign in with your new password.',
    });
  } catch (err: any) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// 8. GET CURRENT USER PROFILE & SESSION VALIDATION
authRouter.get('/me', requireAuth, (req: Request, res: Response) => {
  const session = (req as any).session;
  const user = (req as any).user;

  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organization: user.organization,
      twoFactorEnabled: user.twoFactorEnabled,
      emailVerified: user.emailVerified,
      authProvider: user.authProvider,
      avatarUrl: user.avatarUrl,
    },
    session,
  });
});

// 9. LOGOUT
authRouter.post('/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    deleteSession(token);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// 10. 2FA PROFILE SETTINGS - REQUEST ENABLE
authRouter.post('/2fa/request-enable', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as StoredUser;

    const code = crypto.randomInt(100000, 1000000).toString();
    storeOTP(user.email, code, 'enable_2fa', 300);
    await sendOTPEmail(user.email, code, 'enable_2fa');

    res.json({
      success: true,
      message: `A 6-digit confirmation code was sent to ${maskEmail(user.email)}.`,
      email: maskEmail(user.email),
      rawEmail: user.email,
    });
  } catch (err: any) {
    console.error('2FA enable request error:', err);
    res.status(500).json({ error: 'Failed to send confirmation code.' });
  }
});

// 11. 2FA PROFILE SETTINGS - CONFIRM ENABLE
authRouter.post('/2fa/confirm-enable', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user as StoredUser;
    const { code } = req.body;

    if (!code || !/^\d{6}$/.test(code.toString().trim())) {
      res.status(400).json({ error: 'The verification code must be exactly 6 digits.' });
      return;
    }

    const otp = getOTP(user.email, 'enable_2fa');
    if (!otp || Date.now() > otp.expiresAt) {
      invalidateOTP(user.email, 'enable_2fa');
      res.status(400).json({ error: 'This verification code has expired. Please request a new code.' });
      return;
    }

    const submittedHash = crypto.createHash('sha256').update(code.toString().trim()).digest('hex');
    if (submittedHash !== otp.hashedCode) {
      incrementOTPAttempts(user.email, 'enable_2fa');
      res.status(400).json({ error: 'The verification code is incorrect.' });
      return;
    }

    invalidateOTP(user.email, 'enable_2fa');
    updateUser(user.id, { twoFactorEnabled: true });

    res.json({
      success: true,
      twoFactorEnabled: true,
      message: 'Two-step verification has been successfully enabled.',
    });
  } catch (err: any) {
    console.error('2FA confirm enable error:', err);
    res.status(500).json({ error: 'Failed to enable two-factor authentication.' });
  }
});

// 12. 2FA PROFILE SETTINGS - DISABLE
authRouter.post('/2fa/disable', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user as StoredUser;
    updateUser(user.id, { twoFactorEnabled: false });

    res.json({
      success: true,
      twoFactorEnabled: false,
      message: 'Two-step verification has been disabled.',
    });
  } catch (err: any) {
    console.error('2FA disable error:', err);
    res.status(500).json({ error: 'Failed to disable two-factor authentication.' });
  }
});

// 13. AUDIT TRANSMISSIONS / DISPATCHED EMAILS INSPECTOR (for testing / preview)
authRouter.get('/dispatched-emails', (req: Request, res: Response) => {
  const emailFilter = req.query.email as string | undefined;
  const emails = getDispatchedEmails(emailFilter);
  res.json({ emails });
});

// 14. ACTIVE VERIFICATION CODE RETRIEVAL (Enables instant verification in sandbox without waiting for external Gmail)
authRouter.get('/active-otp', (req: Request, res: Response) => {
  const emailFilter = (req.query.email as string || '').trim().toLowerCase();
  const emails = getDispatchedEmails(emailFilter || undefined);
  const otpEmail = emails.find((e) => e.type === 'otp');

  if (otpEmail) {
    const match = otpEmail.body.match(/\b(\d{6})\b/);
    res.json({
      success: true,
      code: match ? match[1] : null,
      to: otpEmail.to,
      subject: otpEmail.subject,
      timestamp: otpEmail.timestamp,
      expiresAt: otpEmail.expiresAt,
    });
    return;
  }

  // Fallback: check latest overall OTP in dispatch queue
  const allEmails = getDispatchedEmails();
  const fallback = allEmails.find((e) => e.type === 'otp');
  if (fallback) {
    const match = fallback.body.match(/\b(\d{6})\b/);
    res.json({
      success: true,
      code: match ? match[1] : null,
      to: fallback.to,
      subject: fallback.subject,
      timestamp: fallback.timestamp,
      expiresAt: fallback.expiresAt,
      isGlobalFallback: true,
    });
    return;
  }

  res.json({ success: true, code: null });
});

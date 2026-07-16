import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { getUserByUsername, addActivityLog, createResetRequest, saveUserOTP, verifyUserOTP, updateUserPassword } from '../data/store.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

const generateToken = (id, name, role) => {
  return jwt.sign({ id, name, role }, JWT_SECRET, {
    expiresIn: '1d',
  });
};

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await getUserByUsername(username);

    if (user && bcrypt.compareSync(password, user.password)) {
      // Log the activity
      await addActivityLog(user.id, user.name, 'LOGIN', 'User logged in to Admin Panel');
    
    res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      token: generateToken(user.id, user.name, user.role),
    });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

router.post('/logout', protect, async (req, res) => {
  // We can't invalidate JWT on the server without a blacklist, 
  // but we can log the explicit logout action.
  if (req.user) {
    await addActivityLog(req.user.id, req.user.name, 'LOGOUT', 'User logged out of Admin Panel');
  }
  res.json({ message: 'Logged out successfully' });
});

router.post('/reset-request', async (req, res) => {
  const { username } = req.body;
  try {
    const success = await createResetRequest(username);
    if (success) {
      res.json({ message: 'Reset request sent to Super Admin' });
    } else {
      res.status(400).json({ message: 'Invalid username or super admin cannot request reset this way.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/reset-email', async (req, res) => {
  const { username } = req.body;
  try {
    const user = await getUserByUsername(username);
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid username' });
    }

    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      return res.status(500).json({ message: 'Email SMTP not configured in .env file.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await saveUserOTP(username, otp);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: 'gopalharsh8586@gmail.com',
      subject: `Password Reset OTP: ${user.name}`,
      text: `Hello Super Admin,\n\nAdmin ${user.name} (${user.username}) has requested a password reset.\nThe 6-digit OTP is: ${otp}\n\nThis OTP is valid for 10 minutes.`
    };

    try {
      await transporter.sendMail(mailOptions);
      res.json({ message: 'OTP sent to Super Admin email.' });
    } catch (error) {
      console.error('Email error:', error);
      res.status(500).json({ message: 'Failed to send email' });
    }
  } catch (dbError) {
    console.error('DB error:', dbError);
    res.status(500).json({ message: 'Database error' });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { username, otp, newPassword } = req.body;
  try {
    const isValid = await verifyUserOTP(username, otp);
    if (isValid) {
      const success = await updateUserPassword(username, newPassword);
      if (success) {
        res.json({ message: 'Password updated successfully!' });
      } else {
        res.status(400).json({ message: 'Failed to update password' });
      }
    } else {
      res.status(400).json({ message: 'Invalid or expired OTP' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

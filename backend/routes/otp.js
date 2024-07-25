import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sendOtpEmail } from '../mailer.js';
import Order from '../models/Order.js';

const router = express.Router();
const otpStore = {}; // In-memory store for OTPs. Replace with a database or Redis in production.
const OTP_EXPIRY_TIME = 5 * 60 * 1000; // OTP expiry time in milliseconds (5 minutes)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

function generateSecureOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    const randomValues = new Uint8Array(length);
    crypto.randomFillSync(randomValues);

    for (let i = 0; i < length; i++) {
        otp += digits[randomValues[i] % 10];
    }

    return otp;
}

router.post('/check-email', async (req, res) => {
    const { email } = req.body;
    const user = await Order.findOne({ "Notification Email": email });

    res.json({ exists: !!user });
});

router.post('/send-otp', async (req, res) => {
    const { identifier } = req.body;
    const otp = generateSecureOTP();
    otpStore[identifier] = { otp, expiresAt: Date.now() + OTP_EXPIRY_TIME };

    try {
        await sendOtpEmail(identifier, otp);
        res.status(200).send({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).send({ success: false, message: 'Failed to send OTP. Please try again.' });
    }
});

router.post('/verify-otp', (req, res) => {
    const { identifier, otp } = req.body;
    const storedOtpData = otpStore[identifier];

    if (storedOtpData && storedOtpData.expiresAt > Date.now() && storedOtpData.otp === otp) {
        delete otpStore[identifier];

        // Generate JWT token valid for 10 days
        const token = jwt.sign({ identifier }, JWT_SECRET, { expiresIn: '10d' });

        // Set the token as a cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 10 * 24 * 60 * 60 * 1000, // 10 days in milliseconds
        });

        console.log(`Cookie set: token=${token}`); // Log the token

        res.status(200).send({ success: true, message: 'OTP verified successfully' });
    } else {
        res.status(400).send({ success: false, message: 'OTP has expired or is invalid. Please request a new OTP.' });
    }
});

export default router;

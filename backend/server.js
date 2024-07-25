// server.js
import connectToMongo from './db.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import orderRoutes from './routes/order.js';
import otpRoutes from './routes/otp.js';
// import authMiddleware from './middleware/authMiddleware.js'; // Comment out this line
import dotenv from 'dotenv';

dotenv.config();

connectToMongo();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get('/api', (req, res) => {
    res.send('Hello World!');
});

app.use('/api/orders', orderRoutes); // Remove middleware for testing
app.use('/api', otpRoutes);

app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
});

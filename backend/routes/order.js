import express from 'express';
import Order from '../models/Order.js';

const router = express.Router();

// Endpoint to get orders by email
router.get('/', async (req, res) => {
  const email = req.query.email;
  console.log('Received request to /api/orders with email:', email); // Debug log
  if (!email) {
    console.log('No email provided'); // Debug log
    return res.status(400).json({ error: 'Email query parameter is required' });
  }

  try {
    const orders = await Order.find({ "Notification Email": email });
    console.log('Orders fetched:', orders); // Debug log
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error); // Debug log
    res.status(500).json({ error: 'An error occurred while fetching orders' });
  }
});

// Endpoint to cancel an order
router.post('/cancel', async (req, res) => {
  const { orderCode } = req.body;

  if (!orderCode) {
    return res.status(400).json({ error: 'Order code is required' });
  }

  try {
    const order = await Order.findOne({ "Display Order Code": orderCode });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order["Sale Order Item Status"].toLowerCase() === 'delivered') {
      return res.status(400).json({ error: 'Cannot cancel an order that has been delivered' });
    }

    // Update the order status to cancelled
    order["Sale Order Item Status"] = 'Cancelled';
    await order.save();

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'An error occurred while cancelling the order' });
  }
});

export default router;

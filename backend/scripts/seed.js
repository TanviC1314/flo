import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../models/Order.js'; // Adjusted import path

// Load environment variables from .env file
dotenv.config();

// Get the current file path and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonFilePath = path.join(__dirname, 'data.json');

const seedData = async () => {
  try {
    // Read JSON data from file
    const jsonData = JSON.parse(await readFile(jsonFilePath, 'utf-8'));

    // Connect to MongoDB using Mongoose
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'FLO' // Specify the database name here
    });

    // Prepare bulk operations for upserting data
    const bulkOps = jsonData.map((doc) => {
      // Convert date fields to Date objects
      if (doc['Order Date as dd/mm/yyyy hh:MM:ss']) {
        doc['Order Date as dd/mm/yyyy hh:MM:ss'] = new Date(doc['Order Date as dd/mm/yyyy hh:MM:ss']);
      }
      if (doc['Created']) {
        doc['Created'] = new Date(doc['Created']);
      }
      if (doc['Updated']) {
        doc['Updated'] = new Date(doc['Updated']);
      }
      if (doc['Fulfillment TAT']) {
        doc['Fulfillment TAT'] = new Date(doc['Fulfillment TAT']);
      }

      // Convert boolean string fields to boolean
      doc['Require Customization'] = doc['Require Customization'] === 'true';
      doc['On Hold'] = doc['On Hold'] === 'true';
      doc['Gift Wrap'] = doc['Gift Wrap'] === 'true';
      doc['SKU Require Customization'] = doc['SKU Require Customization'] === 'true';
      doc['Channel Shipping'] = doc['Channel Shipping'] === 'true';

      return {
        updateOne: {
          filter: { SaleOrderItemCode: doc['Sale Order Item Code'] }, // Assuming SaleOrderItemCode is unique
          update: { $set: doc },
          upsert: true,
        },
      };
    });

    // Perform bulk upsert operation
    await Order.bulkWrite(bulkOps);

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close mongoose connection or perform cleanup
    mongoose.disconnect();
  }
};

seedData();

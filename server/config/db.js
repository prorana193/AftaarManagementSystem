const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('MONGODB_URI environment variable is not set');
      process.exit(1);
    }
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Error: ${error.message}`);
    console.error('Please check your MONGODB_URI connection string and ensure:');
    console.error('1. The username and password are correct');
    console.error('2. The database user has proper permissions');
    console.error('3. Your IP is whitelisted in MongoDB Atlas (use 0.0.0.0/0 for all IPs)');
    process.exit(1);
  }
};

module.exports = connectDB;

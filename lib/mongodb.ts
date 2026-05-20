import mongoose from 'mongoose';
import dns from 'dns';

// Fix for Windows: Node.js SRV DNS lookups (used by mongodb+srv://) fail
// with ECONNREFUSED when IPv6 is attempted first. Force IPv4.
dns.setDefaultResultOrder('ipv4first');

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error(
      'MONGODB_URI is not set. Please add it to your .env file.'
    );
  }

  // Return cached connection if healthy
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // 10s timeout
      socketTimeoutMS: 45000,
    };

    console.log('🔌 Connecting to MongoDB...');
    console.log('📍 URI host:', MONGODB_URI.split('@')[1]?.split('/')[0] ?? 'unknown');

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('✅ MongoDB connected successfully');
        return mongoose;
      })
      .catch((err) => {
        cached.promise = null; // Reset so next request retries
        if (err.message?.includes('ECONNREFUSED') || err.message?.includes('querySrv')) {
          console.error('❌ MongoDB DNS/Network error — check your cluster hostname in MONGODB_URI or if the cluster is paused in Atlas.');
        } else if (err.message?.includes('Authentication failed')) {
          console.error('❌ MongoDB authentication failed — check your username/password in MONGODB_URI.');
        } else if (err.message?.includes('whitelist') || err.message?.includes('IP')) {
          console.error('❌ MongoDB IP not whitelisted — add 0.0.0.0/0 in Atlas → Network Access.');
        } else {
          console.error('❌ MongoDB connection failed:', err.message);
        }
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;

import dotenv from "dotenv";
dotenv.config();

import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

let cachedClient = null;
let cachedDb = null;

export async function connectDB() {
  // Return cached connection if it's still alive
  if (cachedDb) {
    try {
      await cachedClient.db("admin").command({ ping: 1 });
      return cachedDb;
    } catch (error) {
      cachedDb = null;
      cachedClient = null;
    }
  }

  try {
    if (!uri) {
      throw new Error("MONGODB_URI environment variable not set");
    }

    const client = new MongoClient(uri, {
      maxPoolSize: 5,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000
    });

    await client.connect();
    cachedClient = client;
    cachedDb = client.db("startinno");
    
    return cachedDb;
  } catch (error) {
    console.error("❌ [MongoDB] Connection error:", error.message);
    throw error;
  }
}
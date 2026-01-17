// Jest setup file
import dotenv from "dotenv";

// Load test environment variables
dotenv.config({ path: ".env.test" });

// Set test environment
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-key-minimum-32-characters-long";
process.env.DB_NAME = process.env.DB_NAME || "tictactoe_test";

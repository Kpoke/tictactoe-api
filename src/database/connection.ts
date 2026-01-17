import knex, { Knex } from "knex";
import config from "../../knexfile";

const environment = process.env.NODE_ENV || "development";
const dbConfig = config[environment];

export const db: Knex = knex(dbConfig);

// Test database connection and wait for it before allowing server to start
let dbReady = false;
let dbReadyPromise: Promise<void>;

dbReadyPromise = db
  .raw("SELECT 1")
  .then(() => {
    console.log("Database connected successfully");
    dbReady = true;
  })
  .catch((error) => {
    console.error("Database connection error:", error);
    process.exit(1);
  });

// Export a function to check if DB is ready
export const isDbReady = (): boolean => dbReady;
export const waitForDb = (): Promise<void> => dbReadyPromise;

export default db;

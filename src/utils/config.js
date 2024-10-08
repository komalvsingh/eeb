import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const CLIENT_URL = process.env.NEXT_PUBLIC_URL;

// Log to ensure CLIENT_URL is being read
console.log("CLIENT_URL:", CLIENT_URL);

const config = {
  CLIENT_URL,
  PORT: process.env.PORT,
  MONGO_URI:process.env.MONGO_URI,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  VERIFY_EMAIL_TOKEN_SECRET: process.env.VERIFY_EMAIL_TOKEN_SECRET,
  PASSWORD_RESET_TOKEN_LIFE: process.env.PASSWORD_RESET_TOKEN_LIFE,
  VERIFY_EMAIL_TOKEN_LIFE: process.env.VERIFY_EMAIL_TOKEN_LIFE,
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  SALT_WORK_FACTOR: process.env.SALT_WORK_FACTOR,
  ACCESS_TOKEN_LIFE: process.env.ACCESS_TOKEN_LIFE,
  REFRESH_TOKEN_LIFE: process.env.REFRESH_TOKEN_LIFE,
  ENV: process.env.NODE_ENV,
};

export default config;

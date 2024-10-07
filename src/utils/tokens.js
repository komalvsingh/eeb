import jwt from 'jsonwebtoken'; // Import the entire module
const { sign } = jwt; // Destructure the 'sign' function

import config from './config.js'; // Use .js extension for local files

const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_LIFE } = config;

// Signing the access token
export const createAccessToken = (id) => {
  return sign({ id }, ACCESS_TOKEN_SECRET, {
    expiresIn: 15 * 60,
  });
};

// Signing the refresh token
export const createRefreshToken = (id) => {
  return sign({ id }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_LIFE,
  });
};

// Sending the access token to the client
export const sendAccessToken = (_req, res, user, accessToken) => {
  res.json({
    accessToken,
    user,
    message: 'Sign in Successful 🥳',
    type: 'success',
  });
};

// Sending the refresh token to the client as a cookie
export const sendRefreshToken = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // expires in 7 days
    // domain: 'sell-easy.vercel.app',
    SameSite: 'None',
    sameSite: 'none',
    secure: true, // Make sure to set this to true if your website is being served over HTTPS
  });
};

// For verifying the email
export const createEmailVerificationToken = ({ _id, email }) => {
  const secret = email;
  return sign({ id: _id }, secret, {
    expiresIn: '90d',
  });
};

export const createPasswordResetToken = ({ _id, email, password }) => {
  const secret = password;
  return sign({ id: _id, email }, secret, {
    expiresIn: 15 * 60, // 15 minutes
  });
};

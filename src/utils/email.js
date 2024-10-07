import { createTransport } from 'nodemailer';
import { emailTemplate } from './templates.js'; // Ensure to use .js extension for local files
import config from './config.js'; // Ensure the extension is included for ES modules
import pkg from 'jsonwebtoken';
const { sign } = pkg; // Import the sign function from jsonwebtoken

const { CLIENT_URL, EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD, JWT_SECRET } = config;

// Create the password reset URL using user ID and token
const createPasswordResetUrl = (id, token) => `${CLIENT_URL}/reset-password/${id}/${token}`;

// Create the email verification URL using user ID and token
const createEmailVerificationUrl = (id, token) => `${CLIENT_URL}/verify-email/${id}/${token}`;

// Create a transporter for sending emails using nodemailer
const transporter = createTransport({
  service: EMAIL_HOST,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

// Create password reset token function
const createPasswordResetToken = (userId) => {
  // Sign the token with a secret key and an expiration time
  return sign({ id: userId }, JWT_SECRET, { expiresIn: '15m' }); // Token expires in 15 minutes
};

// Template for password reset email
const passwordResetTemplate = (user, url) => {
  const { name, email } = user;
  return {
    from: `Sell Easy <noreply@talla_11915139@nitkkr.ac.in>`,
    to: email,
    subject: `Sell Easy - Password Reset Link`,
    html: emailTemplate({
      title: 'Password Reset Link',
      subject: 'Sell Easy - Password Reset Link',
      body: `Hey ${name}!
        Reset your password by clicking on the button below.`,
      link: url,
      btn: 'Reset Password',
      footer: `The link will expire in 15 mins!
        If you haven't requested a password reset, please ignore!`,
    }),
  };
};

// Template for email verification
const emailVerificationTemplate = (user, url) => {
  const { name, email } = user;
  return {
    from: `Sell Easy <noreply@talla_11915139@nitkkr.ac.in>`,
    to: email,
    subject: `Verify your email! ${name}`,
    html: emailTemplate({
      title: 'Email Verification Link',
      subject: 'Sell Easy - Email Verification Link',
      body: `Hey ${name}!
        Verify your email by clicking the button below.`,
      link: url,
      btn: 'Verify',
      footer: `If you haven't created an account, please ignore!`,
    }),
  };
};

// Template for confirming password reset
const passwordResetConfirmationTemplate = (user) => {
  const { name, email } = user;
  return {
    from: `Sell Easy <noreply@talla_11915139@nitkkr.ac.in>`,
    to: email,
    subject: `Sell Easy - Password Reset Successful`,
    html: emailTemplate({
      title: 'Password Reset Successful',
      subject: 'Sell Easy - Password Reset Successful',
      body: `Hey ${name}!
        You have successfully completed resetting your password.`,
      footer: `If you haven't changed your password, please reset it by clicking forgot password!`,
    }),
  };
};

// Template for confirming email verification
const emailVerifyConfirmationTemplate = (user) => {
  const { name, email } = user;
  return {
    from: `Sell Easy <noreply@talla_11915139@nitkkr.ac.in>`,
    to: email,
    subject: `Sell Easy - Email Verification Successful`,
    html: emailTemplate({
      title: 'Email Verification Successful',
      subject: 'Sell Easy - Email Verification Successful',
      body: `Hey ${name}!
        Your email address has been successfully verified. Thank you for signing up for Sell Easy. We look forward to helping you buy and sell used goods easily.`,
      footer: `If you are not expecting this email, please ignore!`,
    }),
  };
};

// Function to send email using the transporter
const sendEmail = async (emailOptions) => {
  try {
    const info = await transporter.sendMail(emailOptions);
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Exporting all necessary functions and configurations
export {
  transporter,
  createPasswordResetUrl,
  createEmailVerificationUrl,
  createPasswordResetToken, // Export the token creation function
  passwordResetTemplate,
  emailVerificationTemplate,
  passwordResetConfirmationTemplate,
  emailVerifyConfirmationTemplate,
  sendEmail, // Export the sendEmail function for use in other modules
};

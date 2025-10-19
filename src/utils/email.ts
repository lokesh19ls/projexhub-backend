import nodemailer from 'nodemailer';

// Only create transporter if email credentials are provided
let transporter: nodemailer.Transporter | null = null;

if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
}

export const sendOTPEmail = async (email: string, otp: string) => {
  if (!transporter) {
    console.warn('Email credentials not configured. Email not sent.');
    console.log(`OTP for ${email}: ${otp}`);
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'ProjexHub - OTP Verification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">ProjexHub OTP Verification</h2>
        <p>Your OTP for ProjexHub verification is:</p>
        <div style="background-color: #F3F4F6; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #4F46E5; margin: 0; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p>This OTP is valid for 10 minutes.</p>
        <p style="color: #6B7280; font-size: 12px;">If you didn't request this OTP, please ignore this email.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

export const sendWelcomeEmail = async (email: string, name: string) => {
  if (!transporter) {
    console.warn('Email credentials not configured. Welcome email not sent.');
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Welcome to ProjexHub!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Welcome to ProjexHub, ${name}!</h2>
        <p>Thank you for joining ProjexHub. We're excited to have you on board!</p>
        <p>Get started by:</p>
        <ul>
          <li>Complete your profile</li>
          <li>Browse available projects (if you're a developer)</li>
          <li>Post your project requirements (if you're a student)</li>
        </ul>
        <p>Happy collaborating!</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};


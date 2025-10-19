import twilio from 'twilio';

// Only initialize Twilio client if credentials are provided
let client: twilio.Twilio | null = null;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

export const sendOTPSMS = async (phone: string, otp: string) => {
  if (!client) {
    console.warn('Twilio credentials not configured. SMS not sent.');
    console.log(`OTP for ${phone}: ${otp}`);
    return;
  }

  try {
    await client.messages.create({
      body: `Your ProjexHub OTP is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${phone}`
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw new Error('Failed to send SMS');
  }
};


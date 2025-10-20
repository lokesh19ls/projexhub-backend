import bcrypt from 'bcryptjs';
import { query } from '../database/connection';
import { generateToken } from '../utils/jwt';
import { generateOTP, storeOTP, verifyOTP } from '../utils/otp';
import { sendOTPEmail, sendWelcomeEmail } from '../utils/email';
import { sendOTPSMS } from '../utils/sms';
import { User, CreateUserDTO } from '../models/User';
import { AppError } from '../middleware/errorHandler';

export class AuthService {
  async register(data: CreateUserDTO): Promise<{ user: User; token: string }> {
    // Check if user already exists
    const existingUser = await query(
      `SELECT * FROM users WHERE email = $1 OR phone = $2`,
      [data.email, data.phone]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('User already exists with this email or phone', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Insert user
    const result = await query(
      `INSERT INTO users (name, email, phone, password, role, college, department, year_of_study, skills)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.name,
        data.email,
        data.phone,
        hashedPassword,
        data.role,
        data.college || null,
        data.department || null,
        data.yearOfStudy || null,
        data.skills || []
      ]
    );

    const user = result.rows[0];

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }

    return { user, token };
  }

  async login(email: string, password: string) {
    if (!email) {
      throw new AppError('Email is required', 400);
    }

    // Find user by email
    const result = await query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid credentials', 401);
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      throw new AppError('Account is deactivated', 403);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    return { user, token };
  }

  async sendOTP(phone: string | undefined, email: string | undefined) {
    if (!phone && !email) {
      throw new AppError('Phone or email is required', 400);
    }

    const otp = generateOTP();
    const type = phone ? 'phone' : 'email';

    // Store OTP
    await storeOTP(phone || '', email, otp, type);

    // Send OTP
    if (phone) {
      await sendOTPSMS(phone, otp);
    }
    if (email) {
      await sendOTPEmail(email, otp);
    }

    return { message: 'OTP sent successfully' };
  }

  async verifyOTP(phone: string | undefined, email: string | undefined, otp: string) {
    if (!phone && !email) {
      throw new AppError('Phone or email is required', 400);
    }

    const type = phone ? 'phone' : 'email';
    const isValid = await verifyOTP(phone || '', email, otp, type);

    if (!isValid) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    return { message: 'OTP verified successfully' };
  }

  async getProfile(userId: number) {
    const result = await query(
      `SELECT id, name, email, phone, role, college, department, year_of_study, 
              skills, bio, profile_photo, is_verified, rating, total_ratings
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    return result.rows[0];
  }
}


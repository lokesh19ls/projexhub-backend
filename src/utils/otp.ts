import { query } from '../database/connection';

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const storeOTP = async (
  phone: string,
  email: string | undefined,
  otp: string,
  type: 'phone' | 'email'
) => {
  const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

  await query(
    `INSERT INTO otps (phone, email, otp, type, expires_at) 
     VALUES ($1, $2, $3, $4, $5)`,
    [phone, email || null, otp, type, expiresAt]
  );
};

export const verifyOTP = async (
  phone: string,
  _email: string | undefined,
  otp: string,
  type: 'phone' | 'email'
): Promise<boolean> => {
  const result = await query(
    `SELECT * FROM otps 
     WHERE phone = $1 AND otp = $2 AND type = $3 AND verified = false 
     AND expires_at > NOW() 
     ORDER BY created_at DESC LIMIT 1`,
    [phone, otp, type]
  );

  if (result.rows.length > 0) {
    await query(
      `UPDATE otps SET verified = true WHERE id = $1`,
      [result.rows[0].id]
    );
    return true;
  }

  return false;
};


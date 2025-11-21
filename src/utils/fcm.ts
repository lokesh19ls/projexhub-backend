import { query } from '../database/connection';
import { GoogleAuth } from 'google-auth-library';

interface FcmPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

const FCM_SCOPES = ['https://www.googleapis.com/auth/firebase.messaging'];

let googleAuth: GoogleAuth | null = null;

function getGoogleAuth(): GoogleAuth | null {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawPrivateKey) {
    console.warn(
      '⚠️  Firebase service account env vars missing. ' +
        'Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY to enable FCM v1.'
    );
    return null;
  }

  if (!googleAuth) {
    const privateKey = rawPrivateKey.replace(/\\n/g, '\n');

    googleAuth = new GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey
      },
      projectId,
      scopes: FCM_SCOPES
    });
  }

  return googleAuth;
}

async function getAccessToken(): Promise<string | null> {
  const auth = getGoogleAuth();
  if (!auth) {
    return null;
  }

  try {
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const token = tokenResponse?.token || null;

    if (!token) {
      console.warn('⚠️  Unable to obtain Firebase access token.');
    }

    return token;
  } catch (error) {
    console.error('❌ Error getting Firebase access token:', error);
    return null;
  }
}

/**
 * Send a push notification to a single FCM token using HTTP v1 API.
 */
async function sendPushToToken(token: string, payload: FcmPayload) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    console.warn('⚠️  FIREBASE_PROJECT_ID is not configured. Skipping push notification.');
    return;
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return;
  }

  const fetchFn: typeof fetch = (global as any).fetch;

  if (!fetchFn) {
    console.warn('⚠️  global.fetch is not available. Skipping push notification.');
    return;
  }

  try {
    const response = await fetchFn(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: {
            token,
            notification: {
              title: payload.title,
              body: payload.body
            },
            data: payload.data || {}
          }
        })
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ FCM v1 push failed:', response.status, text);
    }
  } catch (error) {
    console.error('❌ Error sending FCM v1 push:', error);
  }
}

/**
 * Send a notification to a user:
 * 1. Inserts a row into notifications table.
 * 2. Looks up the user's fcm_token and sends a push notification if available.
 */
export async function createNotificationAndSendPush(options: {
  userId: number;
  title: string;
  message: string;
  type: string;
  relatedId?: number;
  data?: Record<string, any>;
}) {
  const { userId, title, message, type, relatedId, data } = options;

  // Create DB notification
  const result = await query(
    `INSERT INTO notifications (user_id, title, message, type, related_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [userId, title, message, type, relatedId || null]
  );

  const notificationId = result.rows[0]?.id;

  // Fetch FCM token
  try {
    const userResult = await query(
      `SELECT fcm_token FROM users WHERE id = $1`,
      [userId]
    );

    const token: string | null = userResult.rows[0]?.fcm_token || null;
    if (!token) {
      return;
    }

    await sendPushToToken(token, {
      title,
      body: message,
      data: {
        type,
        notificationId,
        relatedId: relatedId || null,
        ...(data || {})
      }
    });
  } catch (error) {
    // Log but don't fail the main request if push sending fails
    console.error('⚠️  Failed to send FCM push notification:', error);
  }
}

/**
 * Update the user's FCM token.
 * Called from an authenticated endpoint when the Flutter app sends its latest token.
 */
export async function updateUserFcmToken(userId: number, fcmToken: string) {
  await query(
    `UPDATE users SET fcm_token = $1 WHERE id = $2`,
    [fcmToken, userId]
  );
}



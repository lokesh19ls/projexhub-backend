# 🔑 Razorpay Configuration Guide

## Test Keys Configuration

The following test keys are configured for development/testing:

```
RAZORPAY_KEY_ID=rzp_test_Rao6sZZOgM645V
RAZORPAY_KEY_SECRET=F1QTcw20phyWMwmgFWlXIiB5
```

## 🔧 Setting Up on Render

### Step 1: Navigate to Render Dashboard

1. Go to https://dashboard.render.com
2. Select your **Web Service** (projexhub-backend)

### Step 2: Add Environment Variables

1. Click on **Environment** tab in the left sidebar
2. Click **Add Environment Variable** button

Add these two variables:

**Variable 1:**
- **Key:** `RAZORPAY_KEY_ID`
- **Value:** `rzp_test_Rao6sZZOgM645V`

**Variable 2:**
- **Key:** `RAZORPAY_KEY_SECRET`
- **Value:** `F1QTcw20phyWMwmgFWlXIiB5`

### Step 3: Save and Redeploy

1. Click **Save Changes**
2. Render will automatically redeploy your service
3. Wait for deployment to complete

## 🧪 Testing Payment Integration

### Test Cards (Razorpay Test Mode)

Use these test cards to simulate payments:

**Success Test Card:**
- **Card Number:** `4111 1111 1111 1111`
- **CVV:** Any 3 digits (e.g., `123`)
- **Expiry:** Any future date (e.g., `12/25`)
- **Name:** Any name

**Failure Test Card:**
- **Card Number:** `5104 0600 0000 0008`
- **CVV:** Any 3 digits
- **Expiry:** Any future date

### Test UPI IDs

For UPI payments in test mode:
- Use any UPI ID like `success@razorpay` for successful payments
- Use `failure@razorpay` for failed payments

## 🔐 Production Keys

**⚠️ Important:** When moving to production:

1. Go to https://dashboard.razorpay.com
2. Switch to **Live Mode**
3. Navigate to **Settings > API Keys**
4. Generate new **Live API Keys**
5. Update environment variables on Render with production keys:
   - Replace `RAZORPAY_KEY_ID` with live key ID
   - Replace `RAZORPAY_KEY_SECRET` with live key secret

## ✅ Verification

After setting environment variables, verify the configuration:

1. **Check Backend Logs:**
   ```bash
   # On Render dashboard, check logs
   # Should see: "Server is running" without payment gateway errors
   ```

2. **Test Payment Order Creation:**
   ```bash
   curl -X POST https://projexhub-backend.onrender.com/api/payments/project/1/order \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "paymentMethod": "upi",
       "paymentType": "advance"
     }'
   ```

   **Expected Response:**
   ```json
   {
     "payment": { ... },
     "razorpayOrder": {
       "id": "order_xxx",
       "amount": 200000,
       "currency": "INR",
       ...
     }
   }
   ```

## 📱 Flutter App Configuration

Make sure your Flutter app uses the same test keys:

```dart
static const String razorpayTestKeyId = 'rzp_test_Rao6sZZOgM645V';
static const String razorpayTestSecret = 'F1QTcw20phyWMwmgFWlXIiB5';
static const bool useRazorpayTestMode = true;
```

**Note:** The secret key is only used on the backend for payment verification. The Flutter app only needs the Key ID.

## 🔍 Troubleshooting

### Issue: "Payment gateway not configured"

**Solution:**
- Verify environment variables are set correctly on Render
- Check that variable names match exactly (case-sensitive)
- Redeploy the service after adding variables

### Issue: Payment verification fails

**Solution:**
- Ensure Flutter app uses the same Key ID as backend
- Verify the secret key matches on backend
- Check that payment signature is being sent correctly

### Issue: Test payments not working

**Solution:**
- Ensure test mode is enabled (`useRazorpayTestMode = true`)
- Use test card numbers provided above
- Check Razorpay dashboard for payment logs

## 📚 Additional Resources

- **Razorpay Test Mode Docs:** https://razorpay.com/docs/payments/server-integration/test-cards/
- **Razorpay Dashboard:** https://dashboard.razorpay.com
- **API Documentation:** See `PAYMENT_API.md`


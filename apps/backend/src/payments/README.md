# Payments Module

Complete Stripe payment integration with payment intents, webhooks, and payouts.

## Features

- ✅ Create payment intents for project/stage payments
- ✅ Stripe webhook handling for payment events
- ✅ Automatic payment status updates
- ✅ Real-time notifications via WebSocket
- ✅ Payout functionality for contractors
- ✅ Payment history and tracking

## Setup

### 1. Environment Variables

Add to `apps/backend/.env`:

```env
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook signing secret from Stripe dashboard
```

### 2. Stripe Webhook Configuration

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/payments/webhooks/stripe`
3. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `payout.paid`
   - `payout.failed`
   - `charge.refunded`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 3. Local Development with Stripe CLI

For local testing, use Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/api/payments/webhooks/stripe

# Copy the webhook signing secret from the output
```

## API Endpoints

### Payment Intents

- `POST /api/payments/intent` - Create payment intent
  ```json
  {
    "amount": 1000.00,
    "projectId": "project-id",
    "stageId": "stage-id", // optional
    "currency": "usd",
    "description": "Payment for stage completion" // optional
  }
  ```

- `GET /api/payments/project/:projectId` - Get all payments for a project
- `GET /api/payments/my` - Get current user's payments
- `GET /api/payments/:id` - Get payment details

### Payouts

- `POST /api/payments/payout` - Create payout to contractor
  ```json
  {
    "contractorId": "contractor-id",
    "amount": 500.00,
    "currency": "usd",
    "description": "Payment for completed work",
    "projectId": "project-id" // optional
  }
  ```

### Webhooks

- `POST /api/payments/webhooks/stripe` - Stripe webhook endpoint
  - Automatically handles payment status updates
  - Sends real-time notifications
  - Updates project spent amounts

## Payment Flow

### 1. Create Payment Intent

```typescript
// Client creates payment intent
const response = await fetch('/api/payments/intent', {
  method: 'POST',
  body: JSON.stringify({
    amount: 1000,
    projectId: 'project-id',
    currency: 'usd',
  }),
});

const { paymentIntent } = await response.json();
// Use paymentIntent.clientSecret with Stripe.js
```

### 2. Confirm Payment (Client-side)

```typescript
// Using Stripe.js
const stripe = Stripe('pk_test_...');
const { error } = await stripe.confirmCardPayment(
  paymentIntent.clientSecret,
  {
    payment_method: {
      card: cardElement,
    },
  }
);
```

### 3. Webhook Processing

When payment succeeds, Stripe sends webhook:
- Payment status updated to 'completed'
- Project spent amount incremented
- Real-time notification sent to homeowner
- WebSocket event emitted

## Payment Statuses

- `pending` - Payment intent created, awaiting confirmation
- `processing` - Payment is being processed
- `completed` - Payment successful
- `failed` - Payment failed
- `refunded` - Payment was refunded

## Payouts to Contractors

### Current Implementation

Currently uses direct payouts. For production, consider:

1. **Stripe Connect** - Better for marketplace
   - Contractors create connected accounts
   - Transfers instead of payouts
   - Better fee handling
   - Tax compliance

2. **Implementation Steps**:
   ```typescript
   // Create connected account for contractor
   const account = await stripeService.createConnectedAccount(
     contractor.email,
     contractor.id
   );

   // Create account link for onboarding
   const accountLink = await stripeService.createAccountLink(
     account.id,
     returnUrl,
     refreshUrl
   );

   // Transfer funds (instead of payout)
   await stripeService.createTransfer({
     amount: 500,
     currency: 'usd',
     destination: account.id, // Connected account
   });
   ```

## Real-time Updates

Payments module integrates with WebSocket for real-time updates:

- Payment completion notifications
- Payment failure alerts
- Project budget updates
- Payout status updates

## Security

- ✅ Webhook signature verification
- ✅ User ownership verification
- ✅ Project access checks
- ⚠️ TODO: Add JWT authentication guards
- ⚠️ TODO: Add role-based access control for payouts

## Testing

### Test Cards (Stripe Test Mode)

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

### Test Webhooks

Use Stripe CLI to trigger test events:

```bash
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
```

## Error Handling

The service handles:
- Invalid project IDs
- Unauthorized access
- Stripe API errors
- Webhook signature verification failures
- Missing configuration

## Future Enhancements

1. **Stripe Connect Integration**
   - Connected accounts for contractors
   - Marketplace fee handling
   - Split payments

2. **Subscription Payments**
   - Recurring payments for maintenance
   - Subscription management

3. **Payment Methods**
   - Save payment methods
   - Default payment methods
   - Multiple payment methods

4. **Refunds**
   - Full/partial refunds
   - Refund reasons
   - Refund notifications

5. **Invoicing**
   - Generate invoices
   - Email invoices
   - Invoice tracking

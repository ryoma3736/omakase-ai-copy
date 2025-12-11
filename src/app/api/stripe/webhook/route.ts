import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { isValidPlan } from "@/lib/plans";

/**
 * Email notification payload for payment failures
 */
interface PaymentFailureEmailData {
  userId: string;
  email: string;
  invoiceId: string;
  amount: number;
  currency: string;
  attemptCount: number;
}

/**
 * Send payment failure notification email to user
 * TODO: Integrate with actual email service (Resend, SendGrid, etc.)
 */
async function sendPaymentFailureEmail(
  data: PaymentFailureEmailData
): Promise<void> {
  console.log("📧 [EMAIL NOTIFICATION] Payment Failure Alert");
  console.log(`   To: ${data.email}`);
  console.log(`   User ID: ${data.userId}`);
  console.log(`   Invoice: ${data.invoiceId}`);
  console.log(
    `   Amount: ${data.amount.toFixed(2)} ${data.currency}`
  );
  console.log(`   Attempt: ${data.attemptCount}`);

  // TODO: Replace with actual email service integration
  // Example with Resend:
  // await resend.emails.send({
  //   from: 'noreply@yourdomain.com',
  //   to: data.email,
  //   subject: 'Payment Failed - Action Required',
  //   html: `
  //     <h2>Payment Failed</h2>
  //     <p>Your payment of ${data.amount} ${data.currency} failed.</p>
  //     <p>Invoice ID: ${data.invoiceId}</p>
  //     <p>Please update your payment method to continue your subscription.</p>
  //   `
  // });

  console.log("   Status: ⚠️  Email service not configured (placeholder)");
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;
        const billingCycle = session.metadata?.billingCycle || "monthly";

        if (userId && session.customer && session.subscription) {
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;

          // Fetch full subscription details
          const stripeSubscription = await getStripe().subscriptions.retrieve(subscriptionId);

          // Get period timestamps (handle potential undefined)
          const periodStart = (stripeSubscription as any).current_period_start
            ? new Date((stripeSubscription as any).current_period_start * 1000)
            : new Date();
          const periodEnd = (stripeSubscription as any).current_period_end
            ? new Date((stripeSubscription as any).current_period_end * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

          // Create or update subscription record
          await prisma.subscription.upsert({
            where: { userId },
            create: {
              userId,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              stripePriceId: stripeSubscription.items.data[0]?.price.id,
              plan: planId || "intern",
              status: "ACTIVE",
              billingCycle,
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
              stripeCurrentPeriodEnd: periodEnd,
            },
            update: {
              stripeSubscriptionId: subscriptionId,
              stripePriceId: stripeSubscription.items.data[0]?.price.id,
              plan: planId || "intern",
              status: "ACTIVE",
              billingCycle,
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
              stripeCurrentPeriodEnd: periodEnd,
            },
          });

          // Update user plan
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: planId?.toUpperCase() || "INTERN",
            },
          });

          console.log(`✅ Subscription created for user ${userId} - Plan: ${planId}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find subscription by Stripe customer ID
        const existingSubscription = await prisma.subscription.findUnique({
          where: { stripeCustomerId: customerId },
        });

        if (existingSubscription) {
          // Map Stripe status to Prisma enum
          type PrismaSubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'PAUSED' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED';
          const statusMap: Record<string, PrismaSubscriptionStatus> = {
            'active': 'ACTIVE',
            'trialing': 'TRIALING',
            'past_due': 'PAST_DUE',
            'canceled': 'CANCELED',
            'paused': 'PAUSED',
            'incomplete': 'INCOMPLETE',
            'incomplete_expired': 'INCOMPLETE_EXPIRED',
          };

          // Get period timestamps (handle potential undefined)
          const subPeriodStart = (subscription as any).current_period_start
            ? new Date((subscription as any).current_period_start * 1000)
            : new Date();
          const subPeriodEnd = (subscription as any).current_period_end
            ? new Date((subscription as any).current_period_end * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: {
              status: statusMap[subscription.status] || 'ACTIVE',
              stripePriceId: subscription.items.data[0]?.price.id,
              currentPeriodStart: subPeriodStart,
              currentPeriodEnd: subPeriodEnd,
              stripeCurrentPeriodEnd: subPeriodEnd,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
          });

          console.log(`✅ Subscription updated for customer ${customerId} - Status: ${subscription.status}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const existingSubscription = await prisma.subscription.findUnique({
          where: { stripeCustomerId: customerId },
          include: { user: true },
        });

        if (existingSubscription) {
          // Update subscription status
          await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: {
              status: "CANCELED",
              stripeSubscriptionId: null,
            },
          });

          // Downgrade user to FREE plan
          await prisma.user.update({
            where: { id: existingSubscription.userId },
            data: {
              plan: "FREE",
            },
          });

          console.log(`✅ Subscription canceled for user ${existingSubscription.userId}`);
        }
        break;
      }

      case "payment_method.attached": {
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        const customerId = paymentMethod.customer as string;
        console.log(
          `Payment method ${paymentMethod.id} attached to customer ${customerId}`
        );

        // Update user's payment method information if needed
        if (customerId) {
          const subscription = await prisma.subscription.findUnique({
            where: { stripeCustomerId: customerId },
            include: { user: true },
          });

          if (subscription) {
            console.log(
              `Payment method updated for user ${subscription.user.id}: ${paymentMethod.type}`
            );
          }
        }
        break;
      }

      case "customer.created": {
        const customer = event.data.object as Stripe.Customer;
        console.log(`New Stripe customer created: ${customer.id}`);
        console.log(
          `Customer email: ${customer.email || "No email provided"}`
        );

        // Track customer creation for analytics
        if (customer.metadata?.userId) {
          console.log(
            `Customer linked to user ID: ${customer.metadata.userId}`
          );
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Payment succeeded for invoice:", invoice.id);

        // Update subscription period on successful payment
        const invoiceSubscription = (invoice as any).subscription;
        if (invoice.customer && invoiceSubscription) {
          const subscription = await prisma.subscription.findUnique({
            where: { stripeCustomerId: invoice.customer as string },
            include: { user: true },
          });

          if (subscription) {
            // Fetch latest subscription details from Stripe
            const stripeSubscription = await getStripe().subscriptions.retrieve(
              invoiceSubscription as string
            );

            // Get period timestamps (handle potential undefined)
            const invPeriodStart = (stripeSubscription as any).current_period_start
              ? new Date((stripeSubscription as any).current_period_start * 1000)
              : new Date();
            const invPeriodEnd = (stripeSubscription as any).current_period_end
              ? new Date((stripeSubscription as any).current_period_end * 1000)
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            await prisma.subscription.update({
              where: { id: subscription.id },
              data: {
                currentPeriodStart: invPeriodStart,
                currentPeriodEnd: invPeriodEnd,
                stripeCurrentPeriodEnd: invPeriodEnd,
                status: 'ACTIVE', // Payment succeeded, ensure status is ACTIVE
              },
            });

            console.log(
              `Invoice ${invoice.id} paid successfully for user ${subscription.user.id}`
            );
            console.log(
              `Amount paid: ${(invoice.amount_paid / 100).toFixed(2)} ${invoice.currency.toUpperCase()}`
            );
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.error("Payment failed for invoice:", invoice.id);

        if (invoice.customer) {
          const subscription = await prisma.subscription.findUnique({
            where: { stripeCustomerId: invoice.customer as string },
            include: { user: true },
          });

          if (subscription && subscription.user.email) {
            // Update subscription status to PAST_DUE
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: {
                status: 'PAST_DUE',
              },
            });

            console.error(
              `Payment failure for user ${subscription.user.id} (${subscription.user.email})`
            );
            console.error(
              `Failed amount: ${(invoice.amount_due / 100).toFixed(2)} ${invoice.currency.toUpperCase()}`
            );

            // Send notification email to user
            await sendPaymentFailureEmail({
              userId: subscription.user.id,
              email: subscription.user.email,
              invoiceId: invoice.id,
              amount: invoice.amount_due / 100,
              currency: invoice.currency.toUpperCase(),
              attemptCount: invoice.attempt_count || 1,
            });
          }
        }
        break;
      }

      case "subscription_schedule.updated": {
        const schedule = event.data.object as Stripe.SubscriptionSchedule;
        console.log(`Subscription schedule updated: ${schedule.id}`);
        console.log(`Schedule status: ${schedule.status}`);

        if (schedule.customer) {
          const subscription = await prisma.subscription.findUnique({
            where: { stripeCustomerId: schedule.customer as string },
            include: { user: true },
          });

          if (subscription) {
            console.log(
              `Subscription schedule for user ${subscription.user.id} updated to status: ${schedule.status}`
            );

            // Log phase transitions
            if (schedule.current_phase) {
              console.log(
                `Current phase: ${schedule.current_phase.start_date} - ${schedule.current_phase.end_date}`
              );
            }
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

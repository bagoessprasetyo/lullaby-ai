// app/dashboard/subscription/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth.config";;
import { redirect } from "next/navigation";
import { SubscriptionDashboard } from "@/components/subscription/subscription-dashboard";
import { getSubscriptionAction } from "@/app/actions/subscription-actions";

export default async function SubscriptionPage(props: { searchParams: any; }) {
  // Get server-side session
  const { searchParams } = props;
  const session = await getServerSession(authOptions);
  
  // Redirect to home if not authenticated
  if (!session || !session.user || !session.user.id) {
    redirect("/");
  }
  
  // Get subscription information
  const subscription = await getSubscriptionAction();
  
  return (
    <SubscriptionDashboard 
      subscription={subscription}
      userId={session.user.id}
      checkoutSuccess={searchParams.success === 'true'}
      checkoutCanceled={searchParams.canceled === 'true'}
      sessionId={searchParams.session_id}
    />
  );
}
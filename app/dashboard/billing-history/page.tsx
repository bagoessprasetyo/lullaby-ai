// app/dashboard/billing-history/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth.config";;
import { redirect } from "next/navigation";
import { DashboardNavbar } from "@/components/dashboard/navbar";
import { BillingHistoryTable } from "@/components/subscription/billing-history-table";
import { getAdminClient, supabase } from '@/lib/supabase';

export default async function BillingHistoryPage() {
  // Get server-side session
  const session = await getServerSession(authOptions);
  
  // Redirect to home if not authenticated
  if (!session || !session.user || !session.user.id) {
    redirect("/");
  }
  const client = typeof window === 'undefined' ? getAdminClient() : supabase;
  // Get payment history
  const { data: payments, error } = await client
    .from('payment_history')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching payment history:', error);
    // Handle error
  }
  
  return (
    <>
      <DashboardNavbar />
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Billing History</h1>
          <p className="text-gray-400">
            View your payment history and invoices
          </p>
        </header>
        
        <BillingHistoryTable payments={payments || []} />
      </div>
    </>
  );
}
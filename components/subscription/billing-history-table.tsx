"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Receipt } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  created_at: string;
  provider_transaction_id: string;
}

interface BillingHistoryTableProps {
  payments: Payment[];
}

export function BillingHistoryTable({ payments }: BillingHistoryTableProps) {
  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };
  
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Receipt className="h-5 w-5 text-indigo-400" />
          Payment History
        </CardTitle>
        <CardDescription>
          A record of all your payments and invoices
        </CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="text-gray-300">Date</TableHead>
                <TableHead className="text-gray-300">Description</TableHead>
                <TableHead className="text-gray-300">Amount</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id} className="border-gray-800 hover:bg-gray-800/30">
                  <TableCell className="font-medium text-white">
                    {formatDate(payment.created_at)}
                  </TableCell>
                  <TableCell className="text-gray-300">
                    Subscription Payment
                  </TableCell>
                  <TableCell className="text-white">
                    {formatCurrency(payment.amount, payment.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={`
                        ${payment.status === 'succeeded' ? 'bg-green-900/50 text-green-400' : 
                          payment.status === 'pending' ? 'bg-blue-900/50 text-blue-400' :
                          'bg-red-900/50 text-red-400'} 
                        capitalize
                      `}
                    >
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Invoice
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">
              No payment history found. Payments will appear here once you subscribe to a plan.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
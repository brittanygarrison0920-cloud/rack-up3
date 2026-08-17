import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Heart, Clock, AlertTriangle, CheckCircle2, TrendingUp, Bell, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import PullToRefresh from "@/components/PullToRefresh";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import LoanCard from "../components/loans/LoanCard";
import LoanDialog from "../components/loans/LoanDialog";

export default function Loans() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("loaned");
  const [sendingReminders, setSendingReminders] = useState(false);
  const [remindersSent, setRemindersSent] = useState(false);
  const requireAuth = useRequireAuth();
  const queryClient = useQueryClient();

  const handleOpenLoanDialog = () => {
    if (requireAuth()) setIsDialogOpen(true);
  };

  const { data: loans, isLoading } = useQuery({
    queryKey: ['loans'],
    queryFn: () => base44.entities.Loan.list('-created_date'),
    initialData: [],
  });

  const { data: items } = useQuery({
    queryKey: ['closetItems'],
    queryFn: () => base44.entities.ClosetItem.list(),
    initialData: [],
  });

  const updateLoanMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Loan.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    },
  });

  const deleteLoanMutation = useMutation({
    mutationFn: (id) => base44.entities.Loan.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    },
  });

  const handleMarkReturned = (loan) => {
    updateLoanMutation.mutate({
      id: loan.id,
      data: {
        ...loan,
        status: 'returned',
        return_date: new Date().toISOString().split('T')[0]
      }
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this loan record?")) {
      deleteLoanMutation.mutate(id);
    }
  };

  const handleSendReminders = async () => {
    const loansToRemind = [...overdueLoans, ...dueSoonLoans];
    if (loansToRemind.length === 0) return;

    setSendingReminders(true);
    try {
      const user = await base44.auth.me();
      for (const loan of loansToRemind) {
        const item = items.find(i => i.id === loan.item_id);
        const itemName = item ? item.name : "an item";
        const isOverdue = new Date(loan.expected_return_date) < new Date();
        const daysUntil = Math.floor((new Date(loan.expected_return_date) - new Date()) / (1000 * 60 * 60 * 24));
        const subject = isOverdue
          ? `Reminder: ${loan.friend_name} still has your ${itemName}`
          : `Heads up: ${loan.friend_name} has your ${itemName} — due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`;
        const body = `Hi there,\n\nThis is a reminder that you lent your "${itemName}" to ${loan.friend_name} on ${loan.loan_date}.\n\n${
          isOverdue
            ? `The expected return date was ${loan.expected_return_date}, which has now passed. Time to check in!`
            : `The expected return date is ${loan.expected_return_date} — coming up soon!`
        }\n\nBest,\nYour Closet App`;
        await base44.integrations.Core.SendEmail({ to: user.email, subject, body });
      }
      setRemindersSent(true);
      setTimeout(() => setRemindersSent(false), 4000);
    } catch (e) {
      console.error(e);
    }
    setSendingReminders(false);
  };

  const filteredLoans = loans.filter(loan => loan.status === activeTab);

  // Analytics
  const activeLoans = loans.filter(l => l.status === 'loaned');
  const overdueLoans = activeLoans.filter(loan => {
    if (!loan.expected_return_date) return false;
    return new Date(loan.expected_return_date) < new Date();
  });
  const dueSoonLoans = activeLoans.filter(loan => {
    if (!loan.expected_return_date) return false;
    const daysUntil = Math.floor((new Date(loan.expected_return_date) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 7;
  });
  const returnedLoans = loans.filter(l => l.status === 'returned');

  const loanedCount = loans.filter(l => l.status === 'loaned').length;
  const returnedCount = loans.filter(l => l.status === 'returned').length;

  return (
    <PullToRefresh onRefresh={async () => { await queryClient.refetchQueries({ queryKey: ['loans'] }); }}>
    <div className="min-h-screen p-4 md:p-8 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-2">
              Loaned Items
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Track items you've lent to friends
            </p>
          </div>
          <Button
            onClick={handleOpenLoanDialog}
            className="bg-gradient-to-r from-purple-900 to-purple-300 hover:from-purple-800 hover:to-purple-300 text-white shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Record Loan
          </Button>
        </div>

        {/* Analytics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-purple-200 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Active Loans</p>
                  <p className="text-3xl font-bold text-purple-600">{activeLoans.length}</p>
                </div>
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Overdue</p>
                  <p className="text-3xl font-bold text-red-600">{overdueLoans.length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Due Soon</p>
                  <p className="text-3xl font-bold text-amber-600">{dueSoonLoans.length}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Returned</p>
                  <p className="text-3xl font-bold text-green-600">{returnedLoans.length}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reminders Section */}
        {(overdueLoans.length > 0 || dueSoonLoans.length > 0) && (
          <Card className="border-amber-200 shadow-lg mb-6 bg-gradient-to-r from-amber-50 to-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-amber-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Action Needed
                </div>
                <Button
                  size="sm"
                  onClick={handleSendReminders}
                  disabled={sendingReminders || remindersSent}
                  className={`flex items-center gap-2 text-white text-xs ${remindersSent ? 'bg-green-500 hover:bg-green-500' : 'bg-amber-600 hover:bg-amber-700'}`}
                >
                  {sendingReminders ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Bell className="w-3 h-3" />
                  )}
                  {remindersSent ? 'Reminders Sent!' : sendingReminders ? 'Sending...' : 'Email Me Reminders'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {overdueLoans.length > 0 && (
                <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <p className="font-semibold text-red-900">
                    {overdueLoans.length} {overdueLoans.length === 1 ? 'item is' : 'items are'} overdue
                  </p>
                  <p className="text-sm text-red-700">Consider following up with your friends</p>
                </div>
              )}
              {dueSoonLoans.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-lg border-l-4 border-amber-500">
                  <p className="font-semibold text-amber-900">
                    {dueSoonLoans.length} {dueSoonLoans.length === 1 ? 'item is' : 'items are'} due within 7 days
                  </p>
                  <p className="text-sm text-amber-700">Prepare for upcoming returns</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Status Tabs */}
        <div className="mb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white/70 backdrop-blur-sm border border-purple-200 p-1">
              <TabsTrigger
                value="loaned"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-300 data-[state=active]:text-white rounded-lg"
              >
                <Heart className="w-4 h-4 mr-2" />
                Active Loans
                {loanedCount > 0 && (
                  <Badge className="ml-2 bg-purple-600">{loanedCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="returned"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-300 data-[state=active]:text-white rounded-lg"
              >
                Loan History
                {returnedCount > 0 && (
                  <Badge className="ml-2 bg-green-600">{returnedCount}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Loans List */}
        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-white/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-purple-300 rounded-full flex items-center justify-center">
              <Heart className="w-12 h-12 text-purple-600" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-700 mb-2">
              {activeTab === 'loaned' ? 'No items currently loaned' : 'No returned items'}
            </h3>
            <p className="text-slate-500 mb-6">
              {activeTab === 'loaned' 
                ? 'Record when you lend items to friends' 
                : 'Items marked as returned will appear here'}
            </p>
            {activeTab === 'loaned' && (
              <Button
                onClick={handleOpenLoanDialog}
                className="bg-gradient-to-r from-purple-900 to-purple-300 hover:from-purple-800 hover:to-purple-300 text-white"
              >
                <Plus className="w-5 h-5 mr-2" />
                Record First Loan
              </Button>
            )}
          </div>
        ) : (
          <motion.div layout className="space-y-4">
            <AnimatePresence>
              {filteredLoans.map((loan) => {
                const item = items.find(i => i.id === loan.item_id);
                return (
                  <LoanCard
                    key={loan.id}
                    loan={loan}
                    item={item}
                    onMarkReturned={handleMarkReturned}
                    onDelete={handleDelete}
                  />
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Loan Dialog */}
        <LoanDialog
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          items={items}
        />
      </div>
    </div>
    </PullToRefresh>
  );
}
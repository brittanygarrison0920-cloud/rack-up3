import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, CheckCircle, Trash2, AlertCircle, Phone, MessageCircle } from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";

export default function LoanCard({ loan, item, onMarkReturned, onDelete }) {
  if (!item) return null;

  const isOverdue = loan.expected_return_date && 
                    isPast(new Date(loan.expected_return_date)) && 
                    loan.status === 'loaned';
  
  const daysUntilReturn = loan.expected_return_date 
    ? differenceInDays(new Date(loan.expected_return_date), new Date())
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`border-2 bg-white/80 dark:bg-slate-900 backdrop-blur-sm hover:shadow-xl transition-all duration-300 rounded-2xl ${
        isOverdue ? 'border-red-300 dark:border-red-800' : 'border-purple-200 dark:border-slate-700'
      }`}>
        <CardContent className="p-6">
          <div className="flex gap-6">
            {/* Item Image */}
            <div className="relative w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-purple-200 dark:border-slate-700">
              <img
                src={item.photo_url}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              {loan.status === 'returned' && (
                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
              )}
            </div>

            {/* Loan Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100 mb-1">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 mb-2 flex-wrap">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{loan.friend_name}</span>
                    {loan.phone_number && (
                      <div className="flex items-center gap-1">
                        <a
                          href={`tel:${loan.phone_number}`}
                          className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full hover:bg-green-200 transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          Call
                        </a>
                        <a
                          href={`sms:${loan.phone_number}`}
                          className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full hover:bg-blue-200 transition-colors"
                        >
                          <MessageCircle className="w-3 h-3" />
                          Text
                        </a>
                      </div>
                    )}
                  </div>
                  {loan.reason && (
                    <Badge variant="outline" className="text-xs">
                      {loan.reason}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {loan.status === 'loaned' && (
                    <Button
                      size="sm"
                      onClick={() => onMarkReturned(loan)}
                      className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Returned
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(loan.id)}
                    className="border-red-300 text-red-600 hover:bg-red-50 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-300">
                     Loaned: <span className="font-medium">{format(new Date(loan.loan_date), "MMM d, yyyy")}</span>
                  </span>
                </div>

                {loan.expected_return_date && (
                  <div className="flex items-center gap-2 text-sm">
                    {isOverdue && <AlertCircle className="w-4 h-4 text-red-500" />}
                    <span className={isOverdue ? 'text-red-600 font-medium' : 'text-slate-600 dark:text-slate-300'}>
                      Expected: <span className="font-medium">{format(new Date(loan.expected_return_date), "MMM d, yyyy")}</span>
                    </span>
                  </div>
                )}

                {loan.return_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">
                      Returned: <span className="font-medium">{format(new Date(loan.return_date), "MMM d, yyyy")}</span>
                    </span>
                  </div>
                )}
              </div>

              {isOverdue && (
                <Badge className="bg-red-100 text-red-700 border-red-300 mb-2">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Overdue by {Math.abs(daysUntilReturn)} days
                </Badge>
              )}

              {loan.status === 'loaned' && !isOverdue && daysUntilReturn !== null && daysUntilReturn >= 0 && (
                <Badge className="bg-blue-100 text-blue-700 border-blue-300 mb-2">
                  Due in {daysUntilReturn} {daysUntilReturn === 1 ? 'day' : 'days'}
                </Badge>
              )}

              {loan.notes && (
                <p className="text-sm text-slate-600 dark:text-slate-300 bg-purple-50 dark:bg-purple-900/30 rounded-xl p-3">
                  {loan.notes}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
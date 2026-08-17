import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MobileSelect from "@/components/ui/mobile-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Heart, Phone, QrCode, X } from "lucide-react";

export default function LoanDialog({ open, onClose, items }) {
  const queryClient = useQueryClient();
  const [qrScanMode, setQrScanMode] = useState(false);
  const [qrInput, setQrInput] = useState("");
  const [formData, setFormData] = useState({
    item_id: "",
    friend_name: "",
    phone_number: "",
    reason: "",
    loan_date: new Date().toISOString().split('T')[0],
    expected_return_date: "",
    sync_to_calendar: true,
    notes: "",
  });

  const createLoanMutation = useMutation({
    mutationFn: (data) => base44.entities.Loan.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      onClose();
      setFormData({
        item_id: "",
        friend_name: "",
        phone_number: "",
        reason: "",
        loan_date: new Date().toISOString().split('T')[0],
        expected_return_date: "",
        sync_to_calendar: true,
        notes: "",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.item_id || !formData.friend_name) {
      alert("Please select an item and enter friend's name");
      return;
    }
    createLoanMutation.mutate({
      ...formData,
      status: 'loaned'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Heart className="w-6 h-6 text-purple-600" />
            Record Loan
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="item">Item *</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setQrScanMode(!qrScanMode)}
                className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <QrCode className="w-3 h-3 mr-1" />
                {qrScanMode ? "Cancel Scan" : "Scan QR"}
              </Button>
            </div>

            {qrScanMode ? (
              <div className="flex gap-2">
                <Input
                  autoFocus
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder="Type or scan item code..."
                  className="border-purple-200 focus:border-purple-500 rounded-xl font-mono"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const found = items.find(i => i.item_number === qrInput.trim() || i.qr_code === qrInput.trim());
                      if (found) {
                        setFormData({ ...formData, item_id: found.id });
                        setQrScanMode(false);
                        setQrInput("");
                      } else {
                        alert(`No item found with code: ${qrInput}`);
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => {
                    const found = items.find(i => i.item_number === qrInput.trim() || i.qr_code === qrInput.trim());
                    if (found) {
                      setFormData({ ...formData, item_id: found.id });
                      setQrScanMode(false);
                      setQrInput("");
                    } else {
                      alert(`No item found with code: ${qrInput}`);
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
                >
                  Find
                </Button>
              </div>
            ) : (
              <MobileSelect
                value={formData.item_id}
                onValueChange={(value) => setFormData({ ...formData, item_id: value })}
                placeholder="Select an item"
                className="border-purple-200 focus:border-purple-500 rounded-xl"
                options={items.map(item => ({ value: item.id, label: item.name }))}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="friend_name">Friend's Name *</Label>
            <Input
              id="friend_name"
              value={formData.friend_name}
              onChange={(e) => setFormData({ ...formData, friend_name: e.target.value })}
              placeholder="Who are you lending to?"
              className="border-purple-200 focus:border-purple-500 rounded-xl"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="e.g., +1 555-123-4567"
                className="border-purple-200 focus:border-purple-500 rounded-xl pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Borrowing</Label>
            <Input
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g., Wedding, Party, Event..."
              className="border-purple-200 focus:border-purple-500 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loan_date">Loan Date *</Label>
              <Input
                id="loan_date"
                type="date"
                value={formData.loan_date}
                onChange={(e) => setFormData({ ...formData, loan_date: e.target.value })}
                className="border-purple-200 focus:border-purple-500 rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_return_date">Expected Return</Label>
              <Input
                id="expected_return_date"
                type="date"
                value={formData.expected_return_date}
                onChange={(e) => setFormData({ ...formData, expected_return_date: e.target.value })}
                className="border-purple-200 focus:border-purple-500 rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="sync_to_calendar"
              checked={formData.sync_to_calendar}
              onCheckedChange={(checked) => setFormData({ ...formData, sync_to_calendar: checked })}
            />
            <Label htmlFor="sync_to_calendar" className="text-sm cursor-pointer">
              Add return date to my Calendar
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes..."
              className="border-purple-200 focus:border-purple-500 rounded-xl resize-none h-20"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createLoanMutation.isPending}
              className="bg-gradient-to-r from-purple-900 to-purple-300 hover:from-purple-800 hover:to-purple-300 rounded-xl"
            >
              {createLoanMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 mr-2" />
                  Record Loan
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
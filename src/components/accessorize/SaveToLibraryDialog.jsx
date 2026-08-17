import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookMarked, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

export default function SaveToLibraryDialog({ open, onClose, accessories, outfitPhotoUrl, occasion }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const keptAccessories = accessories.filter(a => a.kept);
    for (const acc of keptAccessories) {
      await base44.entities.AccessoryLibrary.create({
        name: acc.name,
        description: acc.styling_note || "",
        category: acc.category,
        source: acc.source || "web",
        photo_url: acc.photo_url || "",
        purchase_url: acc.purchase_url || "",
        price: acc.price || "",
        brand: acc.brand || "",
        outfit_photo_url: outfitPhotoUrl || "",
        occasion: occasion || "",
        notes: notes,
        closet_item_id: acc.closet_item_id || "",
      });
    }
    queryClient.invalidateQueries({ queryKey: ['accessoryLibrary'] });
    setSaving(false);
    setDone(true);
    setTimeout(() => {
      setDone(false);
      onClose();
    }, 1500);
  };

  const keptCount = accessories.filter(a => a.kept).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <BookMarked className="w-6 h-6 text-purple-600" />
            Save to Accessory Library
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-slate-800">Saved to Library!</p>
          </div>
        ) : (
          <>
            <div className="py-2 space-y-4">
              <div className="bg-purple-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-slate-800 mb-1">Saving {keptCount} accessory{keptCount !== 1 ? "s" : ""}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {accessories.filter(a => a.kept).map((a, i) => (
                    <span key={i} className="text-xs bg-white border border-purple-200 text-slate-700 px-2 py-0.5 rounded-full">
                      {a.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Styling Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this look..."
                  className="resize-none h-20 rounded-xl border-purple-200"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
              <Button
                onClick={handleSave}
                disabled={saving || keptCount === 0}
                className="bg-gradient-to-r from-purple-900 to-purple-300 hover:from-purple-800 hover:to-purple-300 text-white rounded-xl"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BookMarked className="w-4 h-4 mr-2" />}
                Save {keptCount} Item{keptCount !== 1 ? "s" : ""}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
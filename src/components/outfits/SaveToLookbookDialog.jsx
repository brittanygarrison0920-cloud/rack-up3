import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, BookMarked, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function SaveToLookbookDialog({ outfit, open, onClose }) {
  const queryClient = useQueryClient();
  const [selectedLookbooks, setSelectedLookbooks] = useState([]);

  const { data: lookbooks } = useQuery({
    queryKey: ['lookbooks'],
    queryFn: () => base44.entities.Lookbook.list(),
    initialData: [],
  });

  const updateLookbookMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lookbook.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookbooks'] });
    },
  });

  const handleSave = async () => {
    if (!outfit || selectedLookbooks.length === 0) return;

    for (const lookbookId of selectedLookbooks) {
      const lookbook = lookbooks.find(lb => lb.id === lookbookId);
      if (lookbook && !lookbook.outfit_ids?.includes(outfit.id)) {
        await base44.entities.Lookbook.update(lookbookId, {
          ...lookbook,
          outfit_ids: [...(lookbook.outfit_ids || []), outfit.id]
        });
      }
    }
    
    queryClient.invalidateQueries({ queryKey: ['lookbooks'] });
    setSelectedLookbooks([]);
    onClose();
  };

  const toggleLookbook = (lookbookId) => {
    setSelectedLookbooks(prev =>
      prev.includes(lookbookId)
        ? prev.filter(id => id !== lookbookId)
        : [...prev, lookbookId]
    );
  };

  if (!outfit) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-purple-600" />
            Save to Lookbook
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-slate-600">
            Add "{outfit.name}" to your lookbook collections
          </p>

          {lookbooks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-4">No lookbooks yet</p>
              <p className="text-xs text-slate-400">Create a lookbook first to organize your outfits</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {lookbooks.map((lookbook) => {
                const alreadyInLookbook = lookbook.outfit_ids?.includes(outfit.id);
                return (
                  <div
                    key={lookbook.id}
                    onClick={() => !alreadyInLookbook && toggleLookbook(lookbook.id)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      alreadyInLookbook
                        ? 'border-green-300 bg-green-50 cursor-not-allowed'
                        : selectedLookbooks.includes(lookbook.id)
                        ? 'border-purple-500 bg-purple-50 cursor-pointer'
                        : 'border-slate-200 hover:border-purple-300 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={alreadyInLookbook || selectedLookbooks.includes(lookbook.id)}
                        disabled={alreadyInLookbook}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{lookbook.name}</p>
                        <p className="text-xs text-slate-500">
                          {lookbook.outfit_ids?.length || 0} outfits
                        </p>
                      </div>
                      {alreadyInLookbook && (
                        <span className="text-xs text-green-600">Already added</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={selectedLookbooks.length === 0 || updateLookbookMutation.isPending}
              className="flex-1 bg-gradient-to-r from-purple-900 to-purple-300"
            >
              {updateLookbookMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <BookMarked className="w-4 h-4 mr-2" />
                  Save to {selectedLookbooks.length} {selectedLookbooks.length === 1 ? 'Lookbook' : 'Lookbooks'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
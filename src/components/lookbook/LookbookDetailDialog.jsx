import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

export default function LookbookDetailDialog({ lookbook, open, onClose }) {
  const { data: outfits } = useQuery({
    queryKey: ['outfits'],
    queryFn: () => base44.entities.Outfit.list(),
    initialData: [],
  });

  const { data: items } = useQuery({
    queryKey: ['closetItems'],
    queryFn: () => base44.entities.ClosetItem.list(),
    initialData: [],
  });

  const lookbookOutfits = outfits.filter(outfit => 
    lookbook.outfit_ids?.includes(outfit.id)
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{lookbook.name}</DialogTitle>
          {lookbook.description && (
            <p className="text-slate-600 mt-2">{lookbook.description}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            {lookbook.tags?.map((tag, index) => (
              <Badge key={index} variant="outline">{tag}</Badge>
            ))}
          </div>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {lookbookOutfits.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No outfits in this lookbook</p>
          ) : (
            lookbookOutfits.map((outfit) => {
              const outfitItems = items.filter(item => outfit.items?.includes(item.id));
              return (
                <div key={outfit.id} className="border border-purple-200 rounded-2xl p-4 bg-gradient-to-r from-purple-50/50 to-purple-300/50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{outfit.name}</h3>
                      {outfit.occasion && (
                        <p className="text-sm text-slate-600">{outfit.occasion}</p>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(outfit.created_date), 'MMM d, yyyy')}
                    </div>
                  </div>

                  {outfit.notes && (
                    <p className="text-sm text-slate-600 mb-3 italic">{outfit.notes}</p>
                  )}

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {outfitItems.map((item) => (
                      <div key={item.id} className="aspect-[3/4] rounded-lg overflow-hidden border border-purple-200">
                        <img
                          src={item.photo_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
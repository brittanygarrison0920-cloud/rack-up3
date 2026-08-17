import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Calendar, BookMarked, Heart } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function OutfitCard({ outfit, onDelete, onSaveToLookbook }) {
  const queryClient = useQueryClient();

  const toggleFavorite = async (e) => {
    e.stopPropagation();
    await base44.entities.Outfit.update(outfit.id, { is_favorite: !outfit.is_favorite });
    queryClient.invalidateQueries({ queryKey: ['outfits'] });
  };

  const { data: allItems } = useQuery({
    queryKey: ['closetItems'],
    queryFn: () => base44.entities.ClosetItem.list(),
    initialData: [],
  });

  const outfitItems = allItems.filter(item => outfit.items?.includes(item.id));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="group overflow-hidden border-purple-200 bg-white/80 backdrop-blur-sm hover:shadow-2xl hover:border-purple-400 transition-all duration-500 rounded-3xl">
        <div className="relative aspect-[4/5] bg-gradient-to-br from-purple-50 via-white to-purple-300 p-4">
          {/* Display outfit items in a grid */}
          <div className="grid grid-cols-2 gap-2 h-full">
            {outfitItems.slice(0, 4).map((item, index) => (
              <div
                key={item.id}
                className={`relative rounded-2xl overflow-hidden ${
                  outfitItems.length === 1 ? 'col-span-2 row-span-2' :
                  outfitItems.length === 2 && index === 0 ? 'row-span-2' :
                  outfitItems.length === 3 && index === 0 ? 'row-span-2' : ''
                }`}
              >
                <img
                  src={item.photo_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Action Buttons */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
            {onSaveToLookbook && (
              <Button
                size="icon"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onSaveToLookbook(outfit);
                }}
                className="rounded-xl bg-white/90 backdrop-blur-sm hover:bg-purple-50"
              >
                <BookMarked className="w-4 h-4 text-purple-600" />
              </Button>
            )}
            <Button
              size="icon"
              variant="secondary"
              onClick={() => onDelete(outfit.id)}
              className="rounded-xl bg-white/90 backdrop-blur-sm hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>

          {/* Item Count Badge */}
          <div className="absolute top-4 left-4">
            <Badge className="bg-white/90 backdrop-blur-sm text-purple-700 border-0 shadow-lg">
              {outfitItems.length} {outfitItems.length === 1 ? 'item' : 'items'}
            </Badge>
          </div>
        </div>

        <CardContent className="p-6">
          <h3 className="font-bold text-xl text-slate-800 mb-2">
            {outfit.name}
          </h3>
          
          {outfit.occasion && (
            <Badge variant="outline" className="mb-3 border-teal-200 text-teal-700">
              {outfit.occasion}
            </Badge>
          )}

          {outfit.notes && (
            <p className="text-sm text-slate-600 mb-3 line-clamp-2">
              {outfit.notes}
            </p>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar className="w-3 h-3" />
            Created {format(new Date(outfit.created_date), "MMM d, yyyy")}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Sparkles, Hash, Star, Heart } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categoryIcons = {
  tops: "👕",
  bottoms: "👖",
  dresses: "👗",
  outerwear: "🧥",
  shoes: "👟",
  accessories: "👒",
  bags: "👜",
};

export default function ItemCard({ item, onDelete, isLoaned }) {
  const queryClient = useQueryClient();

  const toggleFavorite = async (e) => {
    e.stopPropagation();
    const newFavState = !item.is_favorite;
    // Optimistic update: immediately reflect in cache
    queryClient.setQueryData(['closetItems'], (old) =>
      old?.map(i => i.id === item.id ? { ...i, is_favorite: newFavState } : i)
    );
    try {
      await base44.entities.ClosetItem.update(item.id, { is_favorite: newFavState });
    } catch (error) {
      // Revert on failure
      queryClient.setQueryData(['closetItems'], (old) =>
        old?.map(i => i.id === item.id ? { ...i, is_favorite: item.is_favorite } : i)
      );
      console.error("Failed to update favorite:", error);
    }
    queryClient.invalidateQueries({ queryKey: ['closetItems'] });
  };
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="group overflow-hidden border-purple-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900 backdrop-blur-sm hover:shadow-2xl hover:border-purple-300 transition-all duration-500 rounded-2xl">
        <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-purple-50 to-purple-300">
          <img
            src={item.photo_url}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Item Number Badge - Always visible */}
          {item.item_number && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-gradient-to-r from-purple-600 to-purple-700 text-white border-0 shadow-lg font-bold flex items-center gap-1">
                <Hash className="w-3 h-3" />
                {item.item_number}
              </Badge>
            </div>
          )}

          {/* Category Icon */}
          <div className="absolute top-3 right-3">
            <div className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center text-xl shadow-lg">
              {categoryIcons[item.category] || "👔"}
            </div>
          </div>

          {/* Loaned Star Icon */}
          <div className="absolute top-14 right-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg ${isLoaned ? 'bg-amber-400' : 'bg-white/80'}`}>
              <Star className={`w-4 h-4 ${isLoaned ? 'text-white fill-white' : 'text-slate-400'}`} />
            </div>
          </div>

          {/* Favorite Heart Button */}
          <button
            onClick={toggleFavorite}
            className="absolute bottom-3 left-3 z-10 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
          >
            <Heart className={`w-5 h-5 ${item.is_favorite ? 'text-pink-500 fill-pink-500' : 'text-slate-400'}`} />
          </button>

          {/* Actions */}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="rounded-xl bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
                >
                  <Sparkles className="w-4 h-4 text-purple-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem 
                  onClick={() => onDelete(item.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove from closet
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1 truncate">
            {item.name}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {item.brand && (
              <Badge variant="outline" className="text-xs border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300">
                {item.brand}
              </Badge>
            )}
            {item.color && (
              <Badge variant="outline" className="text-xs border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400">
                {item.color}
              </Badge>
            )}
          </div>
          {item.storage_location && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 truncate">
              📍 {item.storage_location}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
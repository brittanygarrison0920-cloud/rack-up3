import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function LookbookCard({ lookbook, onDelete, onClick }) {
  const { data: outfits } = useQuery({
    queryKey: ['outfits'],
    queryFn: () => base44.entities.Outfit.list(),
    initialData: [],
  });

  const lookbookOutfits = outfits.filter(outfit => 
    lookbook.outfit_ids?.includes(outfit.id)
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className="overflow-hidden border-purple-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900 shadow-lg hover:shadow-2xl transition-all cursor-pointer group"
        onClick={onClick}
      >
        <div className="aspect-[4/5] relative overflow-hidden bg-gradient-to-br from-purple-100 to-purple-300 dark:from-purple-900 dark:to-purple-700">
          {lookbook.cover_image ? (
            <img
              src={lookbook.cover_image}
              alt={lookbook.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-6xl opacity-20">📚</div>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-4 left-4 right-4 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(lookbook.id);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Badge className="absolute top-4 right-4 bg-purple-600">
            {lookbookOutfits.length} {lookbookOutfits.length === 1 ? 'outfit' : 'outfits'}
          </Badge>
        </div>

        <CardContent className="p-4">
          <h3 className="font-bold text-lg dark:text-slate-100 mb-1 truncate">{lookbook.name}</h3>
          {lookbook.description && (
            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{lookbook.description}</p>
          )}
          {lookbook.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {lookbook.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
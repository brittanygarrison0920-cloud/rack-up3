import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookMarked, Trash2, ExternalLink, Tag, Shirt, ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AccessoryLibraryPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");

  const { data: items, isLoading } = useQuery({
    queryKey: ['accessoryLibrary'],
    queryFn: () => base44.entities.AccessoryLibrary.list('-created_date'),
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AccessoryLibrary.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accessoryLibrary'] }),
  });

  const categories = ["all", ...new Set(items.map(i => i.category).filter(Boolean))];
  const filtered = filter === "all" ? items : items.filter(i => i.category === filter);

  return (
    <div className="min-h-screen p-4 md:p-8 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold mb-2">Accessory Library</h1>
          <p className="text-slate-500 dark:text-slate-400">Your curated collection of saved accessories</p>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {categories.map(cat => (
            <Button
              key={cat}
              size="sm"
              variant={filter === cat ? "default" : "outline"}
              onClick={() => setFilter(cat)}
              className={`rounded-full capitalize ${filter === cat ? "bg-gradient-to-r from-purple-900 to-purple-300 text-white border-0" : "border-purple-200"}`}
            >
              {cat}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => <div key={i} className="aspect-square rounded-2xl bg-white/50 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <BookMarked className="w-16 h-16 mx-auto mb-4 text-purple-300" />
            <h3 className="text-2xl font-semibold text-slate-600 mb-2">No accessories yet</h3>
            <p className="text-slate-400">Use Accessorize Me to build your library</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {filtered.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  <div className="relative aspect-square bg-slate-100">
                    {item.photo_url ? (
                      <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">✨</div>
                    )}
                    <Badge className={`absolute top-2 left-2 text-xs border-0 ${item.source === "closet" ? "bg-purple-600" : "bg-purple-400"} text-white`}>
                      {item.source === "closet" ? <Shirt className="w-3 h-3 mr-1 inline" /> : <ShoppingBag className="w-3 h-3 mr-1 inline" />}
                      {item.source}
                    </Badge>
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{item.name}</p>
                    {item.brand && <p className="text-xs text-slate-500 dark:text-slate-400">{item.brand}</p>}
                    <p className="text-xs text-purple-600 capitalize mb-1">{item.category}</p>
                    {item.occasion && <p className="text-xs text-slate-500 dark:text-slate-400 italic truncate">For: {item.occasion}</p>}
                    {item.price && (
                      <p className="text-xs font-semibold text-teal-700 flex items-center gap-1 mt-1">
                        <Tag className="w-3 h-3" />{item.price}
                      </p>
                    )}
                    {item.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>}
                    <div className="flex gap-2 mt-3">
                      {item.purchase_url && (
                        <a href={item.purchase_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                          <Button size="sm" variant="outline" className="w-full text-xs rounded-xl border-teal-300 text-teal-700">
                            <ExternalLink className="w-3 h-3 mr-1" /> Buy
                          </Button>
                        </a>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(item.id)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
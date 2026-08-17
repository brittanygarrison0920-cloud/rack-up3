import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, X, Sparkles, Loader2, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ShareOutfitDialog from "@/components/outfits/ShareOutfitDialog";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function OutfitBuilder({ onClose }) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [outfitName, setOutfitName] = useState("");
  const [occasion, setOccasion] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const queryClient = useQueryClient();
  const requireAuth = useRequireAuth();

  const { data: items, isLoading } = useQuery({
    queryKey: ['closetItems'],
    queryFn: () => base44.entities.ClosetItem.list('-created_date'),
    initialData: [],
  });

  const createOutfitMutation = useMutation({
    mutationFn: (data) => base44.entities.Outfit.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outfits'] });
      onClose();
    },
  });

  const categories = [
    { value: "all", label: "All" },
    { value: "tops", label: "Tops" },
    { value: "bottoms", label: "Bottoms" },
    { value: "dresses", label: "Dresses" },
    { value: "outerwear", label: "Outerwear" },
    { value: "shoes", label: "Shoes" },
    { value: "accessories", label: "Accessories" },
    { value: "bags", label: "Bags" },
  ];

  const filteredItems = activeCategory === "all" 
    ? items 
    : items.filter(item => item.category === activeCategory);

  const toggleItem = (itemId) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSave = async () => {
    if (!requireAuth()) return;
    if (!outfitName.trim()) {
      alert("Please enter an outfit name");
      return;
    }
    if (selectedItems.length === 0) {
      alert("Please select at least one item");
      return;
    }

    setIsSaving(true);
    createOutfitMutation.mutate({
      name: outfitName,
      items: selectedItems,
      occasion: occasion || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-8 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={onClose}
          className="mb-6 hover:bg-purple-50 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Outfits
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Item Selection Panel */}
          <div className="lg:col-span-2">
            <Card className="border-purple-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-xl rounded-3xl">
              <CardHeader className="border-b border-purple-100 p-6">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Plus className="w-6 h-6 text-purple-600" />
                  Select Items
                  <span className="ml-auto text-sm font-normal text-slate-600">
                    {selectedItems.length} selected
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6">
                <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-6">
                  <TabsList className="bg-purple-50 p-1 flex-wrap h-auto">
                    {categories.map((cat) => (
                      <TabsTrigger
                        key={cat.value}
                        value={cat.value}
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-300 data-[state=active]:text-white rounded-lg"
                      >
                        {cat.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto pr-2">
                  <AnimatePresence>
                    {filteredItems.map((item) => {
                      const isSelected = selectedItems.includes(item.id);
                      return (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={() => toggleItem(item.id)}
                          className={`relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
                            isSelected
                              ? 'ring-4 ring-purple-500 shadow-xl scale-95'
                              : 'hover:ring-2 hover:ring-purple-300'
                          }`}
                        >
                          <img
                            src={item.photo_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-purple-600/30 flex items-center justify-center">
                              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-purple-600" />
                              </div>
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <p className="text-white text-xs font-medium truncate">
                              {item.name}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Outfit Details Panel */}
          <div className="lg:col-span-1">
            <Card className="border-purple-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-xl rounded-3xl sticky top-4">
              <CardHeader className="bg-gradient-to-r from-purple-900 to-purple-300 text-white p-6 rounded-t-3xl">
                <CardTitle className="text-xl">Outfit Details</CardTitle>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Selected Items Preview */}
                {selectedItems.length > 0 && (
                  <div>
                    <Label className="text-sm text-slate-600 mb-2 block">Selected Items</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedItems.map((itemId) => {
                        const item = items.find(i => i.id === itemId);
                        return (
                          <div
                            key={itemId}
                            className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-purple-300"
                          >
                            <img
                              src={item?.photo_url}
                              alt={item?.name}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => toggleItem(itemId)}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="outfitName">Outfit Name *</Label>
                  <Input
                    id="outfitName"
                    value={outfitName}
                    onChange={(e) => setOutfitName(e.target.value)}
                    placeholder="e.g., Casual Friday"
                    className="border-purple-200 focus:border-purple-500 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occasion">Occasion</Label>
                  <Input
                    id="occasion"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    placeholder="e.g., Work, Date Night"
                    className="border-purple-200 focus:border-purple-500 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any styling notes..."
                    className="border-purple-200 focus:border-purple-500 rounded-xl resize-none h-24"
                  />
                </div>

                <Button
                  onClick={() => { if (!requireAuth()) return; setShareOpen(true); }}
                  disabled={selectedItems.length === 0}
                  variant="outline"
                  className="w-full h-12 border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 rounded-xl"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share Look
                </Button>

                <Button
                  onClick={handleSave}
                  disabled={isSaving || selectedItems.length === 0}
                  className="w-full h-12 bg-gradient-to-r from-purple-900 to-purple-300 hover:from-purple-800 hover:to-purple-300 shadow-lg rounded-xl"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Save Outfit
                    </>
                  )}
                </Button>

                <ShareOutfitDialog
                  open={shareOpen}
                  onOpenChange={setShareOpen}
                  items={items.filter((i) => selectedItems.includes(i.id))}
                  outfitName={outfitName}
                  occasion={occasion}
                  notes={notes}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
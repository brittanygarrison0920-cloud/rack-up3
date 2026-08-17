import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Wand2, Loader2, Sparkles, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AIStylistDialog({ open, onClose }) {
  const queryClient = useQueryClient();
  const [occasion, setOccasion] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [styledOutfit, setStyledOutfit] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: items } = useQuery({
    queryKey: ['closetItems'],
    queryFn: () => base44.entities.ClosetItem.list(),
    initialData: [],
  });

  const createOutfitMutation = useMutation({
    mutationFn: (data) => base44.entities.Outfit.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outfits'] });
      setStyledOutfit(null);
      setOccasion("");
      setAdditionalNotes("");
      onClose();
    },
  });

  const { data: userProfile } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const handleGenerate = async () => {
    if (!occasion.trim()) {
      alert("Please describe the occasion or style you're looking for");
      return;
    }

    if (items.length === 0) {
      alert("You need to add items to your closet first!");
      return;
    }

    setIsGenerating(true);

    try {
      // Prepare closet inventory for AI
      const closetInventory = items.map((item, index) => ({
        id: item.id,
        index: index + 1,
        name: item.name,
        category: item.category,
        color: item.color,
        brand: item.brand,
        season: item.season,
        notes: item.notes,
        photo_url: item.photo_url
      }));

      // Build user profile context
      let profileContext = "";
      if (userProfile) {
        if (userProfile.style_preferences?.length > 0) {
          profileContext += `\nCLIENT'S STYLE PREFERENCES: ${userProfile.style_preferences.join(", ")}`;
        }
        if (userProfile.preferred_colors?.length > 0) {
          profileContext += `\nPREFERRED COLORS: ${userProfile.preferred_colors.join(", ")}`;
        }
        if (userProfile.preferred_brands?.length > 0) {
          profileContext += `\nFAVORITE BRANDS: ${userProfile.preferred_brands.join(", ")}`;
        }
        if (userProfile.body_type && userProfile.body_type !== "prefer_not_to_say") {
          profileContext += `\nBODY TYPE: ${userProfile.body_type} (consider flattering silhouettes and proportions)`;
        }
        if (userProfile.location) {
          profileContext += `\nLOCATION: ${userProfile.location} (check current weather and temperature for appropriate layering and fabric choices)`;
        }
      }

      const prompt = `You are a world-class high fashion stylist with real-time access to current fashion trends, runway shows, weather data, and what's hot in the fashion world RIGHT NOW. You have impeccable taste and deep knowledge of fashion, style, and current trends.

  CLIENT'S CLOSET INVENTORY (THESE ARE THE ONLY ITEMS YOU CAN USE - DO NOT SUGGEST ANYTHING ELSE):
  ${JSON.stringify(closetInventory, null, 2)}
  ${profileContext}

  OCCASION/REQUEST: ${occasion}

  ${additionalNotes ? `ADDITIONAL PREFERENCES: ${additionalNotes}` : ''}

  CRITICAL INSTRUCTIONS:
  1. You MUST ONLY select items from the client's closet above using their IDs
  2. DO NOT suggest or mention any items the client doesn't own
  3. Create a COMPLETE outfit including:
   - Main clothing pieces (tops, bottoms, dresses, or outerwear)
   - Shoes (MUST select from their closet if available)
   - Accessories like jewelry, scarves, belts (MUST select from their closet if available)
   - Bags (MUST select from their closet if available)
  4. You must choose at least 3-6 items for a complete, polished, accessorized look
  5. Use current fashion trends, styling techniques, and CURRENT WEATHER data for the location
  6. Consider the client's style preferences and body type for the most flattering combinations
  7. Ensure the outfit is appropriate for the occasion AND current weather conditions
  8. Prioritize items in preferred colors and brands when available
  9. Only reference items BY THEIR ID from the inventory above

  Your task:
  - Analyze the client's wardrobe carefully
  - Check current weather and temperature if location provided
  - Select items that work together harmoniously considering colors, styles, proportions, weather appropriateness, and CURRENT TRENDS
  - Create a sophisticated, complete outfit with proper accessorizing
  - Provide professional styling advice that incorporates what's trending now and is weather-appropriate

  Be creative, fashion-forward, personalized to the client's preferences, and ensure everything coordinates beautifully with a current, trend-aware perspective!`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true, // Enable web search for current fashion trends AND weather
        response_json_schema: {
          type: "object",
          properties: {
            outfit_name: {
              type: "string",
              description: "A chic, descriptive name for the outfit"
            },
            selected_item_ids: {
              type: "array",
              items: { type: "string" },
              description: "Array of item IDs selected ONLY from the client's closet"
            },
            styling_notes: {
              type: "string",
              description: "Professional styling advice and reasoning for the selections, incorporating current fashion trends, weather considerations, and how it matches their personal style"
            },
            occasion_match: {
              type: "string",
              description: "How this outfit perfectly suits the occasion with current fashion sensibility and weather appropriateness"
            }
          },
          required: ["outfit_name", "selected_item_ids", "styling_notes"]
        }
      });

      // Validate that selected items exist
      const validItemIds = response.selected_item_ids.filter(id => 
        items.some(item => item.id === id)
      );

      if (validItemIds.length === 0) {
        throw new Error("AI couldn't find suitable items in your closet");
      }

      setStyledOutfit({
        name: response.outfit_name,
        items: validItemIds,
        notes: response.styling_notes,
        occasion: occasion,
        occasion_match: response.occasion_match
      });

    } catch (error) {
      console.error("Error generating outfit:", error);
      alert("Sorry, I had trouble creating an outfit. Please try again!");
    }
    
    setIsGenerating(false);
  };

  const handleSaveOutfit = async () => {
    setIsSaving(true);
    createOutfitMutation.mutate(styledOutfit);
  };

  const handleReset = () => {
    setStyledOutfit(null);
    setOccasion("");
    setAdditionalNotes("");
  };

  const selectedItems = styledOutfit 
    ? items.filter(item => styledOutfit.items.includes(item.id))
    : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-3xl">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <Wand2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="bg-gradient-to-r from-amber-600 to-pink-600 bg-clip-text text-transparent">
                AI Fashion Stylist
              </div>
              <p className="text-sm font-normal text-slate-600 mt-1">
                Your personal high-fashion expert
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!styledOutfit ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 py-4"
            >
              <div className="bg-gradient-to-r from-amber-50 to-pink-50 rounded-2xl p-6 border-2 border-amber-200">
                <div className="flex items-start gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg text-slate-800 mb-1">
                      Your Personal Stylist Awaits
                    </h3>
                    <p className="text-sm text-slate-600">
                      Tell me about the occasion or style you're seeking, and I'll curate the perfect outfit from your wardrobe with professional styling advice.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="occasion" className="text-base font-semibold">
                  Occasion or Style *
                </Label>
                <Input
                  id="occasion"
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  placeholder="e.g., Elegant dinner date, Business presentation, Casual brunch with friends..."
                  className="border-purple-200 focus:border-purple-500 rounded-xl h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-base font-semibold">
                  Additional Preferences (Optional)
                </Label>
                <Textarea
                  id="notes"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Any specific colors, styles, or items you want to include? Temperature considerations?"
                  className="border-purple-200 focus:border-purple-500 rounded-xl resize-none h-24 text-base"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || items.length === 0}
                className="w-full h-14 text-lg bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 shadow-xl rounded-xl"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    Your Stylist is Working...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-6 h-6 mr-3" />
                    Style My Outfit
                  </>
                )}
              </Button>

              {items.length === 0 && (
                <p className="text-sm text-amber-600 text-center">
                  Add items to your closet first to use the AI stylist
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 py-4"
            >
              {/* Outfit Name */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-pink-100 px-6 py-3 rounded-full mb-4">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <span className="font-semibold text-lg text-slate-800">
                    {styledOutfit.name}
                  </span>
                </div>
              </div>

              {/* Selected Items Grid */}
              <div>
                <h3 className="font-semibold text-lg mb-4 text-slate-800">
                  Your Curated Look ({selectedItems.length} pieces)
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {selectedItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative aspect-[3/4] rounded-2xl overflow-hidden border-3 border-amber-300 shadow-lg"
                    >
                      <img
                        src={item.photo_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-white text-xs font-medium truncate">
                          {item.name}
                        </p>
                        <p className="text-white/80 text-xs truncate">
                          {item.category}
                        </p>
                      </div>
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="w-6 h-6 text-green-400 drop-shadow-lg" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Styling Notes */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                <h3 className="font-semibold text-lg mb-3 text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Stylist's Notes
                </h3>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {styledOutfit.notes}
                </p>
                {styledOutfit.occasion_match && (
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <p className="text-sm font-medium text-purple-800 mb-1">
                      Perfect For:
                    </p>
                    <p className="text-slate-700 text-sm">
                      {styledOutfit.occasion_match}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="flex-1 h-12 rounded-xl"
                  disabled={isSaving}
                >
                  Try Another Look
                </Button>
                <Button
                  onClick={handleSaveOutfit}
                  disabled={isSaving}
                  className="flex-1 h-12 bg-gradient-to-r from-purple-900 to-purple-300 hover:from-purple-800 hover:to-purple-300 shadow-lg rounded-xl"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Save to My Outfits
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowLeft, BookMarked, Loader2, RefreshCw, Check } from "lucide-react";

import OutfitUploader from "../components/accessorize/OutfitUploader";
import AccessoryModeSelector from "../components/accessorize/AccessoryModeSelector";
import AccessoryCard from "../components/accessorize/AccessoryCard";
import SaveToLibraryDialog from "../components/accessorize/SaveToLibraryDialog";
import { useRequireAuth } from "@/hooks/useRequireAuth";

const STEPS = { UPLOAD: "upload", ANALYZING: "analyzing", RESULTS: "results" };

export default function AccessorizeMe() {
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [outfitPhotoUrl, setOutfitPhotoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState("closet");
  const [occasion, setOccasion] = useState("");
  const [accessories, setAccessories] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [replacingIndex, setReplacingIndex] = useState(null);
  const requireAuth = useRequireAuth();

  const { data: closetItems } = useQuery({
    queryKey: ['closetItems'],
    queryFn: () => base44.entities.ClosetItem.list(),
    initialData: [],
  });

  const { data: userProfile } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const handlePhotoReady = async (file) => {
    if (!requireAuth()) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setOutfitPhotoUrl(file_url);
    setUploading(false);
  };

  const handleAnalyzeWithMode = async (overrideMode) => {
    const activeMode = overrideMode ?? mode;
    if (!outfitPhotoUrl) return;
    if (!requireAuth()) return;
    setGenerating(true);

    const closetAccessories = closetItems.filter(i =>
      ["accessories", "bags", "shoes"].includes(i.category)
    );

    let profileContext = "";
    if (userProfile) {
      if (userProfile.style_preferences?.length) profileContext += `Style: ${userProfile.style_preferences.join(", ")}. `;
      if (userProfile.preferred_colors?.length) profileContext += `Fav colors: ${userProfile.preferred_colors.join(", ")}. `;
      if (userProfile.body_type && userProfile.body_type !== "prefer_not_to_say") profileContext += `Body type: ${userProfile.body_type}. `;
    }

    const prompt = activeMode === "closet"
      ? `You are a world-class fashion stylist with deep knowledge of current trends. 
Analyze the outfit in this image and suggest 5-6 accessories that would complete the look.
${occasion ? `Occasion: ${occasion}.` : ""}
${profileContext}

The user's accessory closet includes:
${JSON.stringify(closetAccessories.map(i => ({ id: i.id, name: i.name, category: i.category, color: i.color, brand: i.brand })), null, 2)}

CRITICAL: ONLY suggest accessories from the list above. Return exactly 5 items.
For each, provide: category (necklace/earrings/belt/bag/shoes/scarf/hat/bracelet/ring/sunglasses/watch), styling_note (1 sentence why it works), emoji (relevant emoji), and closet_item_id (the id from the list).
Pick the most fashionable and trend-forward combinations.`
      : `You are a world-class fashion stylist and personal shopper with real-time knowledge of current fashion trends and Amazon products.
Carefully analyze the EXACT outfit in this image — note its colors, style, formality level, and vibe.
${occasion ? `Occasion: ${occasion}.` : ""}
${profileContext}

Search Amazon RIGHT NOW and return EXACTLY 5 real accessories currently available on Amazon that perfectly complement THIS SPECIFIC outfit.

For each accessory provide:
- name: exact Amazon product name
- category: one of (necklace/earrings/belt/bag/shoes/scarf/hat/bracelet/ring/sunglasses/watch)
- brand: brand name
- price: real current Amazon price (e.g. "$24.99" or "$89.00")
- purchase_url: a real working Amazon product URL (https://www.amazon.com/dp/ASIN or https://www.amazon.com/product-name/dp/ASIN)
- photo_url: leave as empty string ""
- image_prompt: a detailed DALL-E style image generation prompt describing this specific product on a clean white background (e.g. "Gold layered chain necklace with small pendant, product photo on white background, studio lighting")
- styling_note: 1-sentence explaining exactly why it matches the colors/style of THIS outfit
- emoji: a relevant emoji

CRITICAL: 
- purchase_url MUST be a real Amazon product link
- image_prompt must describe the exact product visually so it can be rendered realistically
- Choose accessories that MATCH the outfit's colors, style and occasion
- Use web search to find actual current Amazon listings`;

    const schema = {
      type: "object",
      properties: {
        outfit_description: { type: "string" },
        style_assessment: { type: "string" },
        accessories: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              category: { type: "string" },
              brand: { type: "string" },
              price: { type: "string" },
              purchase_url: { type: "string" },
              photo_url: { type: "string" },
              image_prompt: { type: "string" },
              styling_note: { type: "string" },
              emoji: { type: "string" },
              closet_item_id: { type: "string" },
            },
            required: ["name", "category"]
          }
        }
      },
      required: ["accessories"]
    };

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [outfitPhotoUrl],
      add_context_from_internet: activeMode === "web",
      response_json_schema: schema,
    });

    // If closet mode, enrich with photo from closet; if web mode, generate product images
    let enriched;
    if (activeMode === "closet") {
      enriched = result.accessories.map(a => {
        const match = a.closet_item_id
          ? closetItems.find(i => i.id === a.closet_item_id)
          : null;
        return {
          ...a,
          photo_url: match?.photo_url || "",
          source: activeMode,
          kept: false,
        };
      });
    } else {
      // Generate product images in parallel for web mode
      enriched = await Promise.all(
        result.accessories.map(async (a) => {
          let photo_url = "";
          if (a.image_prompt) {
            const generated = await base44.integrations.Core.GenerateImage({
              prompt: a.image_prompt + ", product photography, clean white background, studio lighting, high quality"
            });
            photo_url = generated.url || "";
          }
          return {
            ...a,
            photo_url,
            source: activeMode,
            kept: false,
          };
        })
      );
    }

    setAccessories(enriched);
    setGenerating(false);
    setStep(STEPS.RESULTS);
  };

  const toggleKeep = (index) => {
    setAccessories(prev => prev.map((a, i) => i === index ? { ...a, kept: !a.kept } : a));
  };

  const handleReplace = async (index) => {
    if (!requireAuth()) return;
    setReplacingIndex(index);
    const current = accessories[index];
    const others = accessories.map(a => a.name);

    const prompt = current.source === "closet"
      ? `The user wants to REPLACE the "${current.name}" (${current.category}) accessory.
Suggest ONE different ${current.category} from this closet list (avoid: ${others.join(", ")}):
${JSON.stringify(closetItems.filter(i => ["accessories","bags","shoes"].includes(i.category)).map(i => ({ id: i.id, name: i.name, category: i.category, color: i.color })), null, 2)}
${occasion ? `Occasion: ${occasion}.` : ""}
Return one accessory object with: name, category, styling_note, emoji, closet_item_id.`
      : `The user wants to REPLACE the "${current.name}" (${current.category}).
Search Amazon and suggest ONE different ${current.category} currently available on Amazon (avoid: ${others.join(", ")}).
${occasion ? `Occasion: ${occasion}.` : ""}
Return: name, category, brand, price (real Amazon price), purchase_url (real Amazon URL), photo_url (leave empty ""), image_prompt (detailed visual description of the product for image generation, e.g. "Black leather crossbody bag with gold hardware, product photo on white background"), styling_note, emoji.`;

    const schema = {
      type: "object",
      properties: {
        name: { type: "string" },
        category: { type: "string" },
        brand: { type: "string" },
        price: { type: "string" },
        purchase_url: { type: "string" },
        photo_url: { type: "string" },
        image_prompt: { type: "string" },
        styling_note: { type: "string" },
        emoji: { type: "string" },
        closet_item_id: { type: "string" },
      },
      required: ["name", "category"]
    };

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: current.source === "web",
      response_json_schema: schema,
    });

    const match = result.closet_item_id
      ? closetItems.find(i => i.id === result.closet_item_id)
      : null;

    let photo_url = match?.photo_url || "";
    if (current.source === "web" && result.image_prompt && !photo_url) {
      const generated = await base44.integrations.Core.GenerateImage({
        prompt: result.image_prompt + ", product photography, clean white background, studio lighting, high quality"
      });
      photo_url = generated.url || "";
    }

    setAccessories(prev => prev.map((a, i) =>
      i === index ? { ...result, photo_url, source: current.source, kept: false } : a
    ));
    setReplacingIndex(null);
  };

  const keptCount = accessories.filter(a => a.kept).length;
  const canSave = keptCount > 0;

  return (
    <div className="min-h-screen p-4 md:p-8 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-900 to-purple-300 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Accessorize Me</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400">AI-powered accessory styling from your closet or the web</p>
        </div>

        {/* STEP 1: Upload */}
        {step === STEPS.UPLOAD && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl border border-purple-100 p-6 md:p-8"
          >
            <OutfitUploader onPhotoReady={handlePhotoReady} uploading={uploading} />

            <AnimatePresence>
              {outfitPhotoUrl && !uploading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-6">
                  {/* Preview */}
                  <div className="flex justify-center">
                    <img
                      src={outfitPhotoUrl}
                      alt="Your outfit"
                      className="h-64 w-auto rounded-2xl shadow-lg object-cover border-2 border-purple-200"
                    />
                  </div>

                  {/* Occasion */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Occasion (optional)</Label>
                    <Input
                      value={occasion}
                      onChange={e => setOccasion(e.target.value)}
                      placeholder="e.g. Dinner date, Office meeting, Weekend brunch..."
                      className="rounded-xl border-purple-200"
                    />
                  </div>

                  {/* Mode selector */}
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Where should I find accessories?</Label>
                    <AccessoryModeSelector mode={mode} onChange={setMode} />
                  </div>

                  <Button
                    onClick={() => handleAnalyzeWithMode()}
                    disabled={generating}
                    className="w-full h-14 text-lg bg-gradient-to-r from-purple-900 to-purple-300 hover:from-purple-800 hover:to-purple-400 text-white rounded-2xl shadow-lg"
                  >
                    {generating ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Finding your perfect accessories...</>
                    ) : (
                      <><Sparkles className="w-5 h-5 mr-2" /> Accessorize This Outfit</>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* STEP 2: Results */}
        {step === STEPS.RESULTS && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Outfit preview strip */}
            <div className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow border border-purple-100">
              <img src={outfitPhotoUrl} alt="outfit" className="w-20 h-20 rounded-xl object-cover border-2 border-purple-200 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 dark:text-slate-100">Your Outfit</p>
                {occasion && <Badge variant="outline" className="text-xs mt-1">{occasion}</Badge>}
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`text-xs border-0 text-white ${mode === "closet" ? "bg-purple-600" : "bg-purple-400"}`}>
                    {mode === "closet" ? "From My Closet" : "Shop Online"}
                  </Badge>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{keptCount}/{accessories.length} kept</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setStep(STEPS.UPLOAD); setAccessories([]); }}
                  className="rounded-xl text-xs border-slate-300"
                >
                  <ArrowLeft className="w-3 h-3 mr-1" /> New Outfit
                </Button>
                {/* Mode toggle on results */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const newMode = mode === "closet" ? "web" : "closet";
                    setMode(newMode);
                    setAccessories([]);
                    await handleAnalyzeWithMode(newMode);
                  }}
                  disabled={generating}
                  className="rounded-xl text-xs border-purple-300 text-purple-600"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  {mode === "closet" ? "Try Web" : "Try Closet"}
                </Button>
              </div>
            </div>

            {/* Accessories Grid */}
            {generating ? (
              <div className="flex flex-col items-center py-12 gap-3">
                <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
                <p className="text-slate-600">Switching style mode...</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Accessory Picks</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Keep what you love, replace the rest</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {accessories.map((acc, i) => (
                    <AccessoryCard
                      key={i}
                      accessory={acc}
                      mode={mode}
                      isKept={acc.kept}
                      isReplacing={replacingIndex === i}
                      onKeep={() => toggleKeep(i)}
                      onReplace={() => handleReplace(i)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Save CTA */}
            {canSave && !generating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-200 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">Save {keptCount} accessory{keptCount !== 1 ? "s" : ""} to your library?</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Keep your favorite picks for future reference</p>
                </div>
                <Button
                  onClick={() => setShowSaveDialog(true)}
                  className="bg-gradient-to-r from-purple-900 to-purple-300 hover:from-purple-700 hover:to-purple-400 text-white rounded-xl shadow"
                >
                  <BookMarked className="w-4 h-4 mr-2" /> Save to Library
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {showSaveDialog && (
        <SaveToLibraryDialog
          open={showSaveDialog}
          onClose={() => setShowSaveDialog(false)}
          accessories={accessories}
          outfitPhotoUrl={outfitPhotoUrl}
          occasion={occasion}
        />
      )}
    </div>
  );
}
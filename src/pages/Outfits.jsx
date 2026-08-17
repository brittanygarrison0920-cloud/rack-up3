import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Wand2, CalendarDays, Grid3X3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useNavigate } from "react-router-dom";
import PullToRefresh from "@/components/PullToRefresh";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import OutfitCard from "../components/outfits/OutfitCard";
import AIStylistDialog from "../components/outfits/AIStylistDialog";
import SaveToLookbookDialog from "../components/outfits/SaveToLookbookDialog";
import OutfitCalendar from "../components/outfits/OutfitCalendar";

export default function Outfits() {
  const [showAIStylist, setShowAIStylist] = useState(false);
  const [savingToLookbook, setSavingToLookbook] = useState(null);
  const [view, setView] = useState("grid"); // "grid" | "calendar"
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const queryClient = useQueryClient();

  const handleOpenAIStylist = () => {
    if (requireAuth()) setShowAIStylist(true);
  };

  const { data: outfits, isLoading } = useQuery({
    queryKey: ['outfits'],
    queryFn: () => base44.entities.Outfit.list('-created_date'),
    initialData: [],
  });

  const deleteOutfitMutation = useMutation({
    mutationFn: (id) => base44.entities.Outfit.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outfits'] });
    },
  });

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this outfit?")) {
      deleteOutfitMutation.mutate(id);
    }
  };

  return (
    <PullToRefresh onRefresh={async () => { await queryClient.refetchQueries({ queryKey: ['outfits'] }); }}>
    <div className="min-h-screen p-4 md:p-8 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-2">
              My Outfits
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              {outfits.length} curated {outfits.length === 1 ? 'look' : 'looks'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              onClick={handleOpenAIStylist}
              className="bg-gradient-to-r from-purple-900 to-purple-300 hover:from-purple-800 hover:to-purple-300 text-white shadow-lg"
            >
              <Wand2 className="w-5 h-5 mr-2" />
              AI Stylist
            </Button>
            <Button
              onClick={() => navigate("/outfits/build")}
              className="bg-gradient-to-r from-purple-900 to-purple-300 hover:from-purple-800 hover:to-purple-300 text-white shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Outfit
            </Button>
            <div className="flex border border-purple-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setView("grid")}
                className={`px-3 py-2 flex items-center gap-1.5 text-sm transition-colors ${view === "grid" ? "bg-purple-700 text-white" : "bg-white text-slate-600 dark:text-slate-300 hover:bg-purple-50"}`}
              >
                <Grid3X3 className="w-4 h-4" /> Grid
              </button>
              <button
                onClick={() => setView("calendar")}
                className={`px-3 py-2 flex items-center gap-1.5 text-sm transition-colors ${view === "calendar" ? "bg-purple-700 text-white" : "bg-white text-slate-600 dark:text-slate-300 hover:bg-purple-50"}`}
              >
                <CalendarDays className="w-4 h-4" /> Calendar
              </button>
            </div>
          </div>
        </div>

        {view === "calendar" ? (
          <OutfitCalendar outfits={outfits} />
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-white/50 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : outfits.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-purple-300 rounded-full flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-purple-600" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-2">No outfits yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Let our AI stylist create your first look or design it yourself</p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={handleOpenAIStylist}
                className="bg-gradient-to-r from-purple-900 to-purple-300 hover:from-purple-800 hover:to-purple-300 text-white"
              >
                <Wand2 className="w-5 h-5 mr-2" />
                AI Stylist
              </Button>
              <Button
                onClick={() => navigate("/outfits/build")}
                className="bg-gradient-to-r from-purple-900 to-purple-300 hover:from-purple-800 hover:to-purple-300 text-white"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Create Outfit
              </Button>
            </div>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {outfits.map((outfit) => (
                <OutfitCard
                  key={outfit.id}
                  outfit={outfit}
                  onDelete={handleDelete}
                  onSaveToLookbook={() => setSavingToLookbook(outfit)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        <AIStylistDialog 
          open={showAIStylist}
          onClose={() => setShowAIStylist(false)}
        />
      </div>
    </div>
    </PullToRefresh>
  );
}
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, BookMarked, Trash2, Edit, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import LookbookCard from "../components/lookbook/LookbookCard";
import CreateLookbookDialog from "../components/lookbook/CreateLookbookDialog";
import LookbookDetailDialog from "../components/lookbook/LookbookDetailDialog";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function Lookbook() {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedLookbook, setSelectedLookbook] = useState(null);
  const requireAuth = useRequireAuth();
  const queryClient = useQueryClient();

  const handleOpenCreate = () => {
    if (requireAuth()) setIsCreating(true);
  };

  const { data: lookbooks, isLoading } = useQuery({
    queryKey: ['lookbooks'],
    queryFn: () => base44.entities.Lookbook.list('-created_date'),
    initialData: [],
  });

  const deleteLookbookMutation = useMutation({
    mutationFn: (id) => base44.entities.Lookbook.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookbooks'] });
    },
  });

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this lookbook?")) {
      deleteLookbookMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-2">My Lookbook</h1>
            <p className="text-slate-600 dark:text-slate-300">
              {lookbooks.length} {lookbooks.length === 1 ? 'collection' : 'collections'}
            </p>
          </div>
          <Button
            onClick={handleOpenCreate}
            className="bg-gradient-to-r from-purple-900 to-purple-300 hover:from-purple-800 hover:to-purple-300 text-white shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Lookbook
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-white/50 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : lookbooks.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-purple-300 rounded-full flex items-center justify-center">
              <BookMarked className="w-12 h-12 text-purple-600" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-700 mb-2">No lookbooks yet</h3>
            <p className="text-slate-500 mb-6">Create collections of your favorite outfits</p>
            <Button
              onClick={handleOpenCreate}
              className="bg-gradient-to-r from-purple-900 to-purple-300 hover:from-purple-800 hover:to-purple-300 text-white"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Create First Lookbook
            </Button>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {lookbooks.map((lookbook) => (
                <LookbookCard
                  key={lookbook.id}
                  lookbook={lookbook}
                  onDelete={handleDelete}
                  onClick={() => setSelectedLookbook(lookbook)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        <CreateLookbookDialog
          open={isCreating}
          onClose={() => setIsCreating(false)}
        />

        {selectedLookbook && (
          <LookbookDetailDialog
            lookbook={selectedLookbook}
            open={!!selectedLookbook}
            onClose={() => setSelectedLookbook(null)}
          />
        )}
      </div>
    </div>
  );
}
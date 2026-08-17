import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function CreateLookbookDialog({ open, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    outfit_ids: [],
    tags: []
  });
  const [tagInput, setTagInput] = useState("");

  const { data: outfits } = useQuery({
    queryKey: ['outfits'],
    queryFn: () => base44.entities.Outfit.list('-created_date'),
    initialData: [],
  });

  const createLookbookMutation = useMutation({
    mutationFn: (data) => base44.entities.Lookbook.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookbooks'] });
      setFormData({ name: "", description: "", outfit_ids: [], tags: [] });
      onClose();
    },
  });

  const toggleOutfit = (outfitId) => {
    setFormData(prev => ({
      ...prev,
      outfit_ids: prev.outfit_ids.includes(outfitId)
        ? prev.outfit_ids.filter(id => id !== outfitId)
        : [...prev.outfit_ids, outfitId]
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert("Please enter a lookbook name");
      return;
    }
    createLookbookMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Lookbook</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Lookbook Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., Summer Vacation, Work Essentials"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe this lookbook collection..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                placeholder="Add tags (e.g., casual, formal)"
              />
              <Button onClick={addTag} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag) => (
                <div key={tag} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full flex items-center gap-2">
                  <span>{tag}</span>
                  <button onClick={() => removeTag(tag)} className="hover:text-purple-900">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Select Outfits ({formData.outfit_ids.length} selected)</Label>
            {outfits.length === 0 ? (
              <p className="text-sm text-slate-500">No outfits available. Create outfits first!</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-2">
                {outfits.map((outfit) => (
                  <div
                    key={outfit.id}
                    onClick={() => toggleOutfit(outfit.id)}
                    className={`cursor-pointer p-3 rounded-xl border-2 transition-all ${
                      formData.outfit_ids.includes(outfit.id)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Checkbox checked={formData.outfit_ids.includes(outfit.id)} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{outfit.name}</p>
                        {outfit.occasion && (
                          <p className="text-xs text-slate-500 truncate">{outfit.occasion}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createLookbookMutation.isPending}
              className="flex-1 bg-gradient-to-r from-purple-900 to-purple-300 hover:from-purple-800 hover:to-purple-300"
            >
              {createLookbookMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Lookbook"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MobileSelect from "@/components/ui/mobile-select";
import { User, Sparkles, Loader2, CheckCircle, Trash2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Profile() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [formData, setFormData] = useState({
    style_preferences: [],
    preferred_colors: [],
    preferred_brands: [],
    body_type: "",
    location: ""
  });

  const [colorInput, setColorInput] = useState("");
  const [brandInput, setBrandInput] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        style_preferences: user.style_preferences || [],
        preferred_colors: user.preferred_colors || [],
        preferred_brands: user.preferred_brands || [],
        body_type: user.body_type || "",
        location: user.location || ""
      });
    }
  }, [user]);

  const styleOptions = [
    { value: "minimalist", label: "Minimalist", desc: "Clean, simple, neutral" },
    { value: "bohemian", label: "Bohemian", desc: "Free-spirited, eclectic" },
    { value: "classic", label: "Classic", desc: "Timeless, elegant" },
    { value: "edgy", label: "Edgy", desc: "Bold, avant-garde" },
    { value: "romantic", label: "Romantic", desc: "Soft, feminine" },
    { value: "sporty", label: "Sporty", desc: "Athletic, casual" },
    { value: "trendy", label: "Trendy", desc: "Fashion-forward" },
    { value: "vintage", label: "Vintage", desc: "Retro-inspired" }
  ];

  const bodyTypes = [
    { value: "pear", label: "Pear - Wider hips than shoulders" },
    { value: "apple", label: "Apple - Broader shoulders and bust" },
    { value: "hourglass", label: "Hourglass - Balanced proportions" },
    { value: "rectangle", label: "Rectangle - Straight body shape" },
    { value: "inverted_triangle", label: "Inverted Triangle - Broad shoulders" },
    { value: "prefer_not_to_say", label: "Prefer not to say" }
  ];

  const toggleStyle = (style) => {
    setFormData(prev => ({
      ...prev,
      style_preferences: prev.style_preferences.includes(style)
        ? prev.style_preferences.filter(s => s !== style)
        : [...prev.style_preferences, style]
    }));
  };

  const addColor = () => {
    if (colorInput.trim() && !formData.preferred_colors.includes(colorInput.trim())) {
      setFormData(prev => ({
        ...prev,
        preferred_colors: [...prev.preferred_colors, colorInput.trim()]
      }));
      setColorInput("");
    }
  };

  const removeColor = (color) => {
    setFormData(prev => ({
      ...prev,
      preferred_colors: prev.preferred_colors.filter(c => c !== color)
    }));
  };

  const addBrand = () => {
    if (brandInput.trim() && !formData.preferred_brands.includes(brandInput.trim())) {
      setFormData(prev => ({
        ...prev,
        preferred_brands: [...prev.preferred_brands, brandInput.trim()]
      }));
      setBrandInput("");
    }
  };

  const removeBrand = (brand) => {
    setFormData(prev => ({
      ...prev,
      preferred_brands: prev.preferred_brands.filter(b => b !== brand)
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await base44.auth.updateMe(formData);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
    }
    setIsSaving(false);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await base44.entities.User.delete(user.id);
      window.location.href = "/login";
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Failed to delete account. Please try again or contact support.");
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-100 to-purple-300 dark:from-purple-900 dark:to-purple-700 flex items-center justify-center mb-6 shadow-lg">
          <User className="w-10 h-10 text-purple-600 dark:text-purple-300" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Sign in to view your profile</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-sm">
          Create a free account or log in to manage your style preferences and profile.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Button onClick={() => navigate("/login")} className="flex-1 bg-gradient-to-r from-purple-900 to-purple-400 text-white">
            Log In
          </Button>
          <Button variant="outline" onClick={() => navigate("/register")} className="flex-1 border-purple-300 text-purple-700">
            Sign Up
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 dark:bg-slate-950" style={{ paddingTop: 'max(2rem, env(safe-area-inset-top))', paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-900 to-purple-300 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-5xl md:text-6xl font-bold">Style Profile</h1>
              <p className="text-slate-600 dark:text-slate-300">{user.email}</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          {/* Style Preferences */}
          <Card className="border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-teal-50">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Style Preferences
              </CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-300">Select all that apply</p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {styleOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => toggleStyle(option.value)}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                      formData.style_preferences.includes(option.value)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={formData.style_preferences.includes(option.value)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{option.label}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{option.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Preferred Colors */}
          <Card className="border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-teal-50">
              <CardTitle>Preferred Colors</CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-300">Colors you love to wear</p>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex gap-2">
                <Input
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addColor()}
                  placeholder="e.g., Navy, Emerald Green, Burgundy"
                  className="flex-1"
                />
                <Button onClick={addColor} variant="outline">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.preferred_colors.map((color) => (
                  <div
                    key={color}
                    className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full flex items-center gap-2"
                  >
                    <span>{color}</span>
                    <button
                      onClick={() => removeColor(color)}
                      className="hover:text-purple-900"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {formData.preferred_colors.length === 0 && (
                  <p className="text-sm text-slate-500">No colors added yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preferred Brands */}
          <Card className="border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-teal-50">
              <CardTitle>Favorite Brands</CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-300">Brands you prefer</p>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex gap-2">
                <Input
                  value={brandInput}
                  onChange={(e) => setBrandInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addBrand()}
                  placeholder="e.g., Zara, H&M, Nike"
                  className="flex-1"
                />
                <Button onClick={addBrand} variant="outline">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.preferred_brands.map((brand) => (
                  <div
                    key={brand}
                    className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full flex items-center gap-2"
                  >
                    <span>{brand}</span>
                    <button
                      onClick={() => removeBrand(brand)}
                      className="hover:text-teal-900"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {formData.preferred_brands.length === 0 && (
                  <p className="text-sm text-slate-500">No brands added yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Body Type & Location */}
          <Card className="border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-teal-50">
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="body_type">Body Type (Optional)</Label>
                <MobileSelect
                  value={formData.body_type}
                  onValueChange={(value) => setFormData({...formData, body_type: value})}
                  placeholder="Select body type"
                  options={bodyTypes}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location (for weather recommendations)</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g., New York, London, Tokyo"
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="sticky bottom-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full h-14 text-lg bg-gradient-to-r from-purple-900 to-purple-300 hover:from-purple-700 hover:to-teal-600 shadow-xl"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving Profile...
                </>
              ) : showSuccess ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </div>

          {/* Danger Zone */}
          <Card className="border-red-200 shadow-lg">
            <CardHeader className="bg-red-50">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <p className="text-sm text-red-600">Irreversible actions</p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">Delete Account</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Permanently remove your account and all associated data.</p>
                </div>
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. It will permanently delete your account and all your closet items, outfits, and loan records.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteAccount();
                        }}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {isDeleting ? "Deleting..." : "Yes, delete my account"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MobileSelect from "@/components/ui/mobile-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Camera, Upload, Sparkles, ArrowLeft, Loader2, Hash, CheckCircle, Printer, Download } from "lucide-react";
import QRCode from "qrcode";
import { useNavigate } from "react-router-dom";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { createPageUrl } from "@/utils";
import { escapeHtml } from "@/lib/htmlEscape";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

export default function AddItem() {
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    color: "",
    brand: "",
    size: "",
    season: "",
    notes: "",
    photo_url: "",
    qr_code: ""
  });
  
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");

  const createItemMutation = useMutation({
    mutationFn: (itemData) => base44.entities.ClosetItem.create(itemData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closetItems'] });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate(createPageUrl("Closet"));
      }, 2000);
    },
  });

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    if (!requireAuth()) return;
    
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, photo_url: file_url }));
      
      // Auto-extract item details using AI
      const extractedData = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this clothing/accessory image and extract details. Return ONLY valid values from the allowed options.
        
        Categories: top, bottom, dress, outerwear, shoes, accessory, bag
        Seasons: spring, summer, fall, winter, all_season
        
        Be specific and accurate. If you can't determine something, leave it empty.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            category: { type: "string" },
            color: { type: "string" },
            brand: { type: "string" },
            notes: { type: "string" }
          }
        }
      });

      setFormData(prev => ({
        ...prev,
        name: extractedData.name || prev.name,
        category: extractedData.category || prev.category,
        color: extractedData.color || prev.color,
        brand: extractedData.brand || prev.brand,
        notes: extractedData.notes || prev.notes,
      }));
      
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo. Please try again.");
    }
    setUploadingPhoto(false);
  };

  const generateQRCode = async () => {
    if (!requireAuth()) return;
    if (!formData.name) {
      alert("Please add an item name first");
      return;
    }

    setGeneratingQR(true);
    try {
      const itemCode = `MC-${Date.now().toString().slice(-6)}`;
      const dataUrl = await QRCode.toDataURL(itemCode, {
        width: 300,
        margin: 2,
        color: { dark: "#3b0764", light: "#ffffff" }
      });
      setQrDataUrl(dataUrl);
      setFormData(prev => ({ ...prev, qr_code: itemCode }));
    } catch (error) {
      console.error("Error generating QR code:", error);
      alert("Failed to generate QR code. Please try again.");
    }
    setGeneratingQR(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requireAuth()) return;
    
    if (!formData.name || !formData.category) {
      alert("Please fill in at least the item name and category");
      return;
    }

    createItemMutation.mutate(formData);
  };

  const handlePrintQR = () => {
    if (!qrDataUrl) return;
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>QR - ${escapeHtml(formData.name)}</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;}
      img{width:260px;height:260px;}h2{margin:12px 0 4px;}p{color:#666;font-family:monospace;}</style></head>
      <body><img src="${qrDataUrl}"/><h2>${escapeHtml(formData.name)}</h2><p>${escapeHtml(formData.qr_code)}</p>
      <script>window.onload=()=>{window.print();}</script></body></html>`);
    win.document.close();
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr-${formData.qr_code}.png`;
    a.click();
  };

  return (
    <div className="min-h-screen p-4 md:p-8 dark:bg-slate-950">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Closet"))}
          className="mb-6 hover:bg-purple-50 hidden md:inline-flex dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Closet
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-purple-200 bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
            <CardHeader 
              className="text-white p-8 bg-gradient-to-br from-purple-900 to-white"
            >
              <CardTitle className="text-3xl font-bold flex items-center gap-3">
                <Sparkles className="w-8 h-8" />
                <span className="font-bold">Add New Item</span>
              </CardTitle>
              <p className="text-white/90 mt-2">Capture or upload a photo to add to your closet</p>
            </CardHeader>

            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Photo Upload Section */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold text-slate-700 dark:text-slate-200">Item Photo</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-32 border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition-all"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto ? (
                        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Camera className="w-8 h-8 text-purple-600" />
                          <span className="font-medium">Take Photo</span>
                        </div>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="h-32 border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition-all"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-purple-600" />
                        <span className="font-medium">Upload Photo</span>
                      </div>
                    </Button>
                  </div>

                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e.target.files[0])}
                  />
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e.target.files[0])}
                  />

                  {formData.photo_url && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-4"
                    >
                      <img
                        src={formData.photo_url}
                        alt="Item preview"
                        className="w-full h-64 object-cover rounded-xl shadow-lg"
                      />
                    </motion.div>
                  )}
                </div>

                {/* Item Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Item Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., Black Leather Jacket"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <MobileSelect
                      value={formData.category}
                      onValueChange={(value) => setFormData({...formData, category: value})}
                      placeholder="Select category"
                      options={[
                        { value: "top", label: "Top" },
                        { value: "bottom", label: "Bottom" },
                        { value: "dress", label: "Dress" },
                        { value: "outerwear", label: "Outerwear" },
                        { value: "shoes", label: "Shoes" },
                        { value: "accessory", label: "Accessory" },
                        { value: "bag", label: "Bag" }
                      ]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      value={formData.color}
                      onChange={(e) => setFormData({...formData, color: e.target.value})}
                      placeholder="e.g., Black, Navy"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({...formData, brand: e.target.value})}
                      placeholder="e.g., Zara, H&M"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="size">Size</Label>
                    <Input
                      id="size"
                      value={formData.size}
                      onChange={(e) => setFormData({...formData, size: e.target.value})}
                      placeholder="e.g., M, 8, One Size"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="season">Season</Label>
                    <MobileSelect
                      value={formData.season}
                      onValueChange={(value) => setFormData({...formData, season: value})}
                      placeholder="Select season"
                      options={[
                        { value: "spring", label: "Spring" },
                        { value: "summer", label: "Summer" },
                        { value: "fall", label: "Fall" },
                        { value: "winter", label: "Winter" },
                        { value: "all_season", label: "All Season" }
                      ]}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Add any additional notes about this item..."
                    rows={3}
                  />
                </div>

                {/* QR Code Section */}
                <div className="border-t pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold text-slate-700 dark:text-slate-200">QR Code (Optional)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateQRCode}
                      disabled={generatingQR || !formData.name}
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      {generatingQR ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Hash className="w-4 h-4 mr-2" />
                          Generate QR Code
                        </>
                      )}
                    </Button>
                  </div>

                  {qrDataUrl && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-purple-50 p-4 rounded-xl space-y-3"
                    >
                      <p className="text-sm text-slate-600 text-center">
                        Item Code: <span className="font-mono font-semibold">{formData.qr_code}</span>
                      </p>
                      <img
                        src={qrDataUrl}
                        alt="QR Code"
                        className="w-48 h-48 mx-auto bg-white p-2 rounded-lg shadow-md"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handlePrintQR}
                          className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-100"
                        >
                          <Printer className="w-4 h-4 mr-2" />
                          Print
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleDownloadQR}
                          className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-100"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                      <p className="text-xs text-center text-slate-500">
                        Print and attach this QR code to your item for easy scanning
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-900 to-purple-300 hover:from-purple-800 hover:to-purple-300 text-white py-6 text-lg font-semibold"
                  disabled={createItemMutation.isPending}
                >
                  {createItemMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Adding Item...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Add to Closet
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Success Dialog */}
        <AlertDialog open={showSuccess}>
          <AlertDialogContent className="border-green-200">
            <AlertDialogHeader>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
              </div>
              <AlertDialogTitle className="text-center text-2xl">Item Added Successfully!</AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                Your item has been added to your closet. Redirecting...
              </AlertDialogDescription>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
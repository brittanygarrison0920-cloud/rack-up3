import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function OutfitUploader({ onPhotoReady, uploading }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2 text-slate-800">Upload Your Outfit</h2>
        <p className="text-slate-500 text-sm">Take a photo or upload one — our AI will find the perfect accessories</p>
      </div>

      {uploading ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
          <p className="text-slate-600 font-medium">Analyzing your outfit...</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
          <Button
            variant="outline"
            className="h-36 border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 flex flex-col gap-2 rounded-2xl"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="w-10 h-10 text-purple-500" />
            <span className="font-semibold">Take Photo</span>
          </Button>

          <Button
            variant="outline"
            className="h-36 border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 flex flex-col gap-2 rounded-2xl"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-10 h-10 text-purple-500" />
            <span className="font-semibold">Upload Photo</span>
          </Button>
        </div>
      )}

      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => e.target.files[0] && onPhotoReady(e.target.files[0])} />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => e.target.files[0] && onPhotoReady(e.target.files[0])} />
    </div>
  );
}
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, RefreshCw, Loader2, ExternalLink, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AccessoryCard({ accessory, mode, closetMatch, onKeep, onReplace, isKept, isReplacing }) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border-2 overflow-hidden bg-white shadow-sm transition-all duration-200 ${
        isKept ? "border-green-400 ring-2 ring-green-200" : "border-slate-200 hover:border-purple-300"
      }`}
    >
      {/* Image */}
      <div className="relative aspect-square bg-slate-100">
        {accessory.photo_url && !imgError ? (
          <img
            src={accessory.photo_url}
            alt={accessory.name}
            className="w-full h-full object-contain p-2 bg-white"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {accessory.emoji || "✨"}
          </div>
        )}
        {isKept && (
          <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
        <Badge className="absolute top-2 left-2 text-xs bg-purple-600 text-white border-0">
          {accessory.category}
        </Badge>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-semibold text-slate-800 text-sm leading-tight mb-0.5 truncate">{accessory.name}</p>
        {accessory.brand && <p className="text-xs text-slate-500 mb-1">{accessory.brand}</p>}
        {accessory.price && (
          <p className="text-xs font-semibold text-teal-700 flex items-center gap-1 mb-1">
            <Tag className="w-3 h-3" />{accessory.price}
          </p>
        )}
        {accessory.styling_note && (
          <p className="text-xs text-slate-500 italic line-clamp-2 mb-2">{accessory.styling_note}</p>
        )}

        {mode === "web" && accessory.purchase_url && (
          <a href={accessory.purchase_url} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="w-full mb-2 text-xs border-amber-400 text-amber-700 hover:bg-amber-50 rounded-xl font-semibold">
              <ExternalLink className="w-3 h-3 mr-1" /> View on Amazon
            </Button>
          </a>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={onKeep}
            disabled={isReplacing}
            className={`flex-1 rounded-xl text-xs h-8 ${isKept ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gradient-to-r from-purple-900 to-purple-300 text-white"}`}
          >
            <Check className="w-3 h-3 mr-1" />
            {isKept ? "Kept!" : "Keep"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onReplace}
            disabled={isReplacing}
            className="flex-1 rounded-xl text-xs h-8 border-slate-300"
          >
            {isReplacing ? <Loader2 className="w-3 h-3 animate-spin" /> : <><RefreshCw className="w-3 h-3 mr-1" />Replace</>}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
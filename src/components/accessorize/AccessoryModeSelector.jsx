import React from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Shirt } from "lucide-react";

export default function AccessoryModeSelector({ mode, onChange }) {
  return (
    <div className="flex gap-3 justify-center mb-6">
      {[
        { value: "closet", label: "From My Closet", icon: Shirt, desc: "Use items you already own" },
        { value: "web", label: "Shop Online", icon: ShoppingBag, desc: "Discover new pieces to buy" },
      ].map(({ value, label, icon: Icon, desc }) => (
        <motion.button
          key={value}
          whileTap={{ scale: 0.97 }}
          onClick={() => onChange(value)}
          className={`flex-1 max-w-xs p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
            mode === value
              ? "border-purple-500 bg-purple-50 shadow-md"
              : "border-slate-200 bg-white hover:border-purple-300"
          }`}
        >
          <Icon className={`w-6 h-6 mb-1 ${mode === value ? "text-purple-600" : "text-slate-400"}`} />
          <p className={`font-semibold text-sm ${mode === value ? "text-purple-800" : "text-slate-700"}`}>{label}</p>
          <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
        </motion.button>
      ))}
    </div>
  );
}
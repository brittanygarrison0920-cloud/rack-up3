import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Mail, Download, Loader2, Check, ImageIcon } from "lucide-react";

export default function ShareOutfitDialog({ open, onOpenChange, items, outfitName, occasion, notes }) {
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const name = outfitName || "My Outfit";
  const description = [
    name,
    occasion ? `Occasion: ${occasion}` : "",
    notes ? `Notes: ${notes}` : "",
    items.length > 0 ? `Includes: ${items.map((i) => i.name).join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const handleEmail = () => {
    const subject = encodeURIComponent(`Check out my outfit: ${name}`);
    const body = encodeURIComponent(`${description}\n\nShared via RackUp`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleChat = async () => {
    const text = `${description}\n\nShared via RackUp`;
    if (navigator.share) {
      try {
        await navigator.share({ title: name, text });
      } catch (e) {
        /* user cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        /* clipboard unavailable */
      }
    }
  };

  // Build a composite PNG of the selected items on a canvas (no external deps).
  const buildCanvas = async () => {
    const cols = items.length <= 1 ? 1 : items.length <= 4 ? 2 : 3;
    const cellW = 220;
    const cellH = 293; // ~3:4
    const rows = Math.ceil(items.length / cols);
    const pad = 16;
    const headerH = 64;
    const footerH = 34;
    const canvasW = cols * cellW + (cols + 1) * pad;
    const canvasH = headerH + rows * cellH + (rows + 1) * pad + footerH;

    const canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, canvasW / 2, headerH / 2);

    const loadImg = (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const r = Math.floor(i / cols);
      const c = i % cols;
      const x = pad + c * (cellW + pad);
      const y = headerH + pad + r * (cellH + pad);

      ctx.fillStyle = "#f3e8ff";
      ctx.fillRect(x, y, cellW, cellH);

      const img = item.photo_url ? await loadImg(item.photo_url) : null;
      if (img) {
        const ratio = Math.max(cellW / img.width, cellH / img.height);
        const dw = img.width * ratio;
        const dh = img.height * ratio;
        ctx.drawImage(img, x + (cellW - dw) / 2, y + (cellH - dh) / 2, dw, dh);
      } else {
        ctx.fillStyle = "#94a3b8";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(item.name.slice(0, 18), x + cellW / 2, y + cellH / 2);
      }
    }

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Shared via RackUp", canvasW / 2, canvasH - footerH / 2);

    return canvas;
  };

  const canvasToBlob = (canvas) =>
    new Promise((resolve) => {
      try {
        canvas.toBlob((blob) => resolve(blob), "image/png");
      } catch (e) {
        resolve(null);
      }
    });

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const canvas = await buildCanvas();
      try {
        const link = document.createElement("a");
        link.download = `${name.replace(/\s+/g, "-").toLowerCase()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } catch (e) {
        alert("Could not export the image (photo source may block it). Try sharing the text instead.");
      }
    } catch (e) {
      alert("Could not generate the image. Try sharing the text instead.");
    }
    setGenerating(false);
  };

  const handleShareImage = async () => {
    setGenerating(true);
    try {
      const canvas = await buildCanvas();
      const blob = await canvasToBlob(canvas);
      if (!blob) {
        alert("Could not generate the image (photo source may block it). Try sharing the text instead.");
        setGenerating(false);
        return;
      }
      const file = new File([blob], "outfit.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: name, text: description });
        } catch (e) {
          /* cancelled */
        }
      } else {
        const link = document.createElement("a");
        link.download = "outfit.png";
        link.href = URL.createObjectURL(blob);
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      }
    } catch (e) {
      alert("Could not generate the image. Try sharing the text instead.");
    }
    setGenerating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Share2 className="w-6 h-6 text-purple-600" />
            Share Your Look
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Live preview */}
          <div className="bg-white p-4 rounded-2xl">
            <p className="text-lg font-bold text-slate-800 mb-3 text-center">{name}</p>
            <div className="grid grid-cols-3 gap-2">
              {items.map((item) => (
                <div key={item.id} className="aspect-[3/4] rounded-xl overflow-hidden bg-purple-50">
                  {item.photo_url ? (
                    <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 p-1 text-center">
                      {item.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {occasion && (
              <p className="text-sm text-slate-500 mt-3 text-center">Occasion: {occasion}</p>
            )}
            <p className="text-[10px] text-slate-300 mt-2 text-center">Shared via RackUp</p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={handleShareImage}
              disabled={generating || items.length === 0}
              className="w-full h-11 bg-gradient-to-r from-purple-900 to-purple-300 hover:from-purple-800 hover:to-purple-300 rounded-xl"
            >
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
              {generating ? "Preparing..." : "Share Image"}
            </Button>
            <Button onClick={handleChat} variant="outline" className="w-full h-11 rounded-xl">
              {copied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Share2 className="w-4 h-4 mr-2" />}
              {copied ? "Copied to clipboard!" : "Share via Chat / Apps"}
            </Button>
            <Button onClick={handleEmail} variant="outline" className="w-full h-11 rounded-xl">
              <Mail className="w-4 h-4 mr-2" />
              Share via Email
            </Button>
            <Button
              onClick={handleDownload}
              disabled={generating || items.length === 0}
              variant="ghost"
              className="w-full h-11 rounded-xl"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Image
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
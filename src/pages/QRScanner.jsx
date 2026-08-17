import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, Camera, X, CheckCircle, MapPin, Plus, Printer, Download } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import QRCode from "qrcode";
import { escapeHtml } from "@/lib/htmlEscape";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function QRScanner() {
  const [scanning, setScanning] = useState(false);
  const [scannedItem, setScannedItem] = useState(null);
  const [manualInput, setManualInput] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // QR Creator state
  const [creatorLabel, setCreatorLabel] = useState("");
  const [creatorCode, setCreatorCode] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef(null);
  const requireAuth = useRequireAuth();

  const { data: items } = useQuery({
    queryKey: ['closetItems'],
    queryFn: () => base44.entities.ClosetItem.list(),
    initialData: [],
  });

  const startScanner = async () => {
    if (!requireAuth()) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setScanning(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Unable to access camera. Please use manual input instead.");
    }
  };

  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const handleManualSearch = () => {
    if (!requireAuth()) return;
    const item = items.find(i => i.item_number === manualInput.toUpperCase() || i.qr_code === manualInput.toUpperCase());
    if (item) {
      setScannedItem(item);
      setManualInput("");
    } else {
      alert(`No item found with code: ${manualInput}`);
    }
  };

  const generateQR = async () => {
    if (!requireAuth()) return;
    const code = creatorCode.trim() || `MC-${Date.now().toString().slice(-6)}`;
    setGenerating(true);
    try {
      const dataUrl = await QRCode.toDataURL(code, {
        width: 300,
        margin: 2,
        color: { dark: "#3b0764", light: "#ffffff" }
      });
      setQrDataUrl(dataUrl);
      if (!creatorCode.trim()) setCreatorCode(code);
    } catch (err) {
      console.error("QR generation error:", err);
    }
    setGenerating(false);
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>QR Code - ${escapeHtml(creatorLabel || creatorCode)}</title>
      <style>
        body { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; margin:0; font-family:sans-serif; }
        img { width:260px; height:260px; }
        h2 { margin:16px 0 4px; font-size:20px; }
        p { color:#666; font-family:monospace; }
      </style></head>
      <body>
        <img src="${qrDataUrl}" />
        ${creatorLabel ? `<h2>${escapeHtml(creatorLabel)}</h2>` : ''}
        <p>${escapeHtml(creatorCode)}</p>
        <script>window.onload=()=>{window.print();}</script>
      </body></html>
    `);
    win.document.close();
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr-${creatorCode || 'code'}.png`;
    a.click();
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8 dark:bg-slate-950">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold mb-2">QR Scanner</h1>
          <p className="text-slate-600 dark:text-slate-300">Scan, locate, or create QR codes for your closet items</p>
        </div>

        <Tabs defaultValue="locate">
          <TabsList className="w-full mb-6 bg-white/70 border border-purple-200">
            <TabsTrigger value="locate" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-900 data-[state=active]:to-purple-300 data-[state=active]:text-white">
              <QrCode className="w-4 h-4 mr-2" />
              Locate Item
            </TabsTrigger>
            <TabsTrigger value="create" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-900 data-[state=active]:to-purple-300 data-[state=active]:text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create QR Code
            </TabsTrigger>
          </TabsList>

          {/* ── LOCATE TAB ── */}
          <TabsContent value="locate">
            {!scannedItem ? (
              <Card className="border-purple-200 bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
                <CardHeader
                  className="text-white p-8 bg-gradient-to-br from-purple-900 to-white"
                >
                  <CardTitle className="text-2xl font-bold flex items-center gap-3">
                    <QrCode className="w-8 h-8" />
                    Locate Item
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-8 space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700">Enter Item Code</label>
                    <div className="flex gap-3">
                      <Input
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
                        placeholder="e.g., MC-0001"
                        className="flex-1 border-purple-200 focus:border-purple-500 rounded-xl"
                      />
                      <Button
                        onClick={handleManualSearch}
                        disabled={!manualInput.trim()}
                        className="bg-gradient-to-r from-purple-900 to-purple-300 hover:from-purple-800 hover:to-purple-300"
                      >
                        Search
                      </Button>
                    </div>
                  </div>

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-slate-500">or scan QR code</span>
                    </div>
                  </div>

                  {!scanning ? (
                    <Button
                      onClick={startScanner}
                      className="w-full h-14 bg-gradient-to-r from-purple-900 to-purple-300 hover:from-purple-800 hover:to-purple-300 text-lg"
                    >
                      <Camera className="w-6 h-6 mr-2" />
                      Start QR Scanner
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-48 h-48 border-4 border-purple-500 rounded-2xl"></div>
                        </div>
                      </div>
                      <Button onClick={stopScanner} variant="outline" className="w-full">
                        <X className="w-5 h-5 mr-2" />Stop Scanner
                      </Button>
                      <p className="text-sm text-slate-600 dark:text-slate-300 text-center">Position the QR code within the frame</p>
                    </div>
                  )}

                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <p className="text-sm text-slate-700">
                      <strong>💡 Tip:</strong> Each item has a unique QR code on its tag. Scan it to instantly see its details and location in your closet.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="border-green-200 bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-900 to-purple-300 text-white p-8">
                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                      <CheckCircle className="w-8 h-8" />
                      Item Found!
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                        <img src={scannedItem.photo_url} alt={scannedItem.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Badge className="bg-purple-100 text-purple-700 mb-2">{scannedItem.item_number}</Badge>
                          <h2 className="text-3xl font-bold text-slate-800">{scannedItem.name}</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {scannedItem.category && <div><p className="text-sm text-slate-500">Category</p><p className="font-semibold text-slate-800 capitalize">{scannedItem.category.replace(/_/g, ' ')}</p></div>}
                          {scannedItem.color && <div><p className="text-sm text-slate-500">Color</p><p className="font-semibold text-slate-800">{scannedItem.color}</p></div>}
                          {scannedItem.brand && <div><p className="text-sm text-slate-500">Brand</p><p className="font-semibold text-slate-800">{scannedItem.brand}</p></div>}
                          {scannedItem.season && <div><p className="text-sm text-slate-500">Season</p><p className="font-semibold text-slate-800 capitalize">{scannedItem.season.replace(/_/g, ' ')}</p></div>}
                        </div>
                        {scannedItem.storage_location && (
                          <div className="bg-gradient-to-r from-purple-50 to-purple-300 rounded-xl p-4 border-2 border-purple-300">
                            <div className="flex items-center gap-3">
                              <MapPin className="w-6 h-6 text-purple-600" />
                              <div>
                                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Location</p>
                                <p className="text-lg font-bold text-slate-800">{scannedItem.storage_location}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {scannedItem.notes && <div><p className="text-sm text-slate-500 mb-1">Notes</p><p className="text-slate-700">{scannedItem.notes}</p></div>}
                      </div>
                      <Button
                        onClick={() => { setScannedItem(null); setManualInput(""); }}
                        className="w-full h-12 bg-gradient-to-r from-purple-900 to-purple-300 hover:from-purple-800 hover:to-purple-300"
                      >
                        Scan Another Item
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* ── CREATE TAB ── */}
          <TabsContent value="create">
            <Card className="border-purple-200 bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
              <CardHeader
                className="text-white p-8 bg-gradient-to-br from-purple-900 to-white"
              >
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <Plus className="w-8 h-8" />
                  Create QR Code
                </CardTitle>
              </CardHeader>

              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="label">Item Label (optional)</Label>
                    <Input
                      id="label"
                      value={creatorLabel}
                      onChange={(e) => setCreatorLabel(e.target.value)}
                      placeholder="e.g., Black Leather Jacket"
                      className="border-purple-200 focus:border-purple-500 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="code">Item Code (optional — auto-generated if blank)</Label>
                    <Input
                      id="code"
                      value={creatorCode}
                      onChange={(e) => setCreatorCode(e.target.value)}
                      placeholder="e.g., MC-0001"
                      className="border-purple-200 focus:border-purple-500 rounded-xl font-mono"
                    />
                  </div>

                  <Button
                    onClick={generateQR}
                    disabled={generating}
                    className="w-full h-12 bg-gradient-to-r from-purple-900 to-purple-300 hover:from-purple-800 hover:to-purple-300 text-white"
                  >
                    <QrCode className="w-5 h-5 mr-2" />
                    {generating ? "Generating..." : "Generate QR Code"}
                  </Button>
                </div>

                {qrDataUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex flex-col items-center bg-purple-50 border border-purple-200 rounded-2xl p-6 gap-3">
                      <img src={qrDataUrl} alt="Generated QR Code" className="w-52 h-52 rounded-xl shadow-md bg-white p-2" />
                      {creatorLabel && <p className="text-lg font-semibold text-slate-800">{creatorLabel}</p>}
                      <p className="text-sm font-mono text-slate-500">{creatorCode}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button onClick={handleDownload} variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button onClick={handlePrint} variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                      </Button>
                    </div>

                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <p className="text-sm text-slate-700">
                        <strong>💡 Tip:</strong> Print this QR code and attach it to your item. Use the "Locate Item" tab to scan it and find the item instantly.
                      </p>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
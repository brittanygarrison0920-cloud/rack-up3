import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Camera, Upload, Sparkles, ArrowLeft, Loader2, CheckCircle, Package, FileSpreadsheet, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function BulkUpload() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const csvInputRef = useRef(null);
  const requireAuth = useRequireAuth();

  // Photo upload state
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [detectedItems, setDetectedItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [done, setDone] = useState(false);

  // CSV state
  const [csvItems, setCsvItems] = useState([]);
  const [csvError, setCsvError] = useState("");
  const [csvSaving, setCsvSaving] = useState(false);
  const [csvDone, setCsvDone] = useState(false);
  const [csvSavedCount, setCsvSavedCount] = useState(0);

  const CSV_TEMPLATE = "name,category,color,brand,season,notes,storage_location\nBlack Leather Jacket,outerwear,black,Zara,fall,,Wardrobe 1\nWhite T-Shirt,tops,white,H&M,all_season,,Drawer 2";

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "closet_import_template.csv";
    a.click();
  };

  const handleCsvUpload = (file) => {
    if (!file) return;
    setCsvError("");
    setCsvItems([]);
    setCsvDone(false);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.trim().split("\n");
        if (lines.length < 2) { setCsvError("CSV is empty or has no data rows."); return; }
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
        if (!headers.includes("name")) { setCsvError('Missing required column: "name"'); return; }
        const rows = lines.slice(1).map((line, i) => {
          const vals = line.split(",").map(v => v.trim());
          const obj = {};
          headers.forEach((h, idx) => { obj[h] = vals[idx] || ""; });
          return { ...obj, _id: i, _selected: true };
        }).filter(r => r.name);
        if (rows.length === 0) { setCsvError("No valid rows found."); return; }
        setCsvItems(rows);
      } catch {
        setCsvError("Failed to parse CSV. Please check the file format.");
      }
    };
    reader.readAsText(file);
  };

  const toggleCsvItem = (id) => {
    setCsvItems(prev => prev.map(item => item._id === id ? { ...item, _selected: !item._selected } : item));
  };

  const handleSaveCsv = async () => {
    if (!requireAuth()) return;
    const toSave = csvItems.filter(i => i._selected);
    if (toSave.length === 0) return;
    setCsvSaving(true);
    let count = 0;
    for (const item of toSave) {
      await base44.entities.ClosetItem.create({
        name: item.name,
        category: item.category || undefined,
        color: item.color || undefined,
        brand: item.brand || undefined,
        season: item.season || "all_season",
        notes: item.notes || undefined,
        storage_location: item.storage_location || undefined,
      });
      count++;
      setCsvSavedCount(count);
    }
    queryClient.invalidateQueries({ queryKey: ['closetItems'] });
    setCsvSaving(false);
    setCsvDone(true);
  };

  // Photo logic
  const handlePhoto = async (file) => {
    if (!file) return;
    if (!requireAuth()) return;
    setUploading(true);
    setDetectedItems([]);
    setDone(false);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(file_url);
      await analyzePhoto(file_url);
    } catch (e) {
      console.error(e);
      alert("Failed to upload photo. Please try again.");
    }
    setUploading(false);
  };

  const analyzePhoto = async (url) => {
    setAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are analyzing a photo that may contain multiple clothing items or accessories. 
        Identify EACH separate item visible in the image and return them as an array.
        For each item provide: name, category (must be one of: tops, bottoms, dresses, outerwear, shoes, accessories, bags), color, brand (if visible), season (spring/summer/fall/winter/all_season).
        If the image shows a single item, return an array with just that one item.
        Be as specific as possible for each item.`,
        file_urls: [url],
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  category: { type: "string" },
                  color: { type: "string" },
                  brand: { type: "string" },
                  season: { type: "string" },
                  notes: { type: "string" }
                }
              }
            }
          }
        }
      });
      setDetectedItems((result.items || []).map((item, i) => ({ ...item, selected: true, id: i })));
    } catch (e) {
      console.error(e);
      alert("Failed to analyze photo. Please try again.");
    }
    setAnalyzing(false);
  };

  const toggleItem = (id) => {
    setDetectedItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  const handleSaveAll = async () => {
    if (!requireAuth()) return;
    const toSave = detectedItems.filter(i => i.selected);
    if (toSave.length === 0) return;
    setSaving(true);
    let count = 0;
    for (const item of toSave) {
      await base44.entities.ClosetItem.create({
        name: item.name,
        category: item.category,
        color: item.color,
        brand: item.brand,
        season: item.season || "all_season",
        notes: item.notes,
        photo_url: photoUrl,
      });
      count++;
      setSavedCount(count);
    }
    queryClient.invalidateQueries({ queryKey: ['closetItems'] });
    setSaving(false);
    setDone(true);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 dark:bg-slate-950">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(createPageUrl("Closet"))} className="mb-6 hover:bg-purple-50 dark:text-slate-300 dark:hover:bg-slate-800">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Closet
        </Button>

        <Card className="border-purple-200 bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
          <CardHeader
            className="text-white p-8 bg-gradient-to-br from-purple-900 to-white"
          >
            <CardTitle className="text-3xl font-bold flex items-center gap-3">
              <Package className="w-8 h-8" />
              Bulk Upload
            </CardTitle>
            <p className="text-white/90 mt-2">Add multiple items at once via photo or CSV</p>
          </CardHeader>

          <CardContent className="p-6 md:p-8">
            <Tabs defaultValue="photo">
              <TabsList className="w-full bg-white/70 border border-purple-200 mb-6">
                <TabsTrigger value="photo" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-900 data-[state=active]:to-purple-300 data-[state=active]:text-white">
                  <Camera className="w-4 h-4 mr-2" />
                  Photo Detection
                </TabsTrigger>
                <TabsTrigger value="csv" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-900 data-[state=active]:to-purple-300 data-[state=active]:text-white">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Import CSV
                </TabsTrigger>
              </TabsList>

              {/* ── PHOTO TAB ── */}
              <TabsContent value="photo" className="space-y-6">
                {done ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{savedCount} items added!</h2>
                    <p className="text-slate-500 mb-6">All selected items have been saved to your closet.</p>
                    <div className="flex gap-3 justify-center">
                      <Button onClick={() => { setDone(false); setPhotoUrl(""); setDetectedItems([]); setSavedCount(0); }} variant="outline" className="border-purple-300 text-purple-700">
                        Upload Another
                      </Button>
                      <Button onClick={() => navigate(createPageUrl("Closet"))} className="bg-gradient-to-r from-purple-900 to-purple-300 text-white">
                        Go to Closet
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {!photoUrl && !uploading && !analyzing && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button type="button" variant="outline" className="h-36 border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition-all" onClick={() => cameraInputRef.current?.click()}>
                          <div className="flex flex-col items-center gap-2">
                            <Camera className="w-10 h-10 text-purple-600" />
                            <span className="font-medium">Take Photo</span>
                            <span className="text-xs text-slate-500">of multiple items</span>
                          </div>
                        </Button>
                        <Button type="button" variant="outline" className="h-36 border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition-all" onClick={() => fileInputRef.current?.click()}>
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="w-10 h-10 text-purple-600" />
                            <span className="font-medium">Upload Photo</span>
                            <span className="text-xs text-slate-500">of multiple items</span>
                          </div>
                        </Button>
                      </div>
                    )}

                    <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhoto(e.target.files[0])} />
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePhoto(e.target.files[0])} />

                    {(uploading || analyzing) && (
                      <div className="text-center py-12">
                        <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                        <p className="text-slate-600 dark:text-slate-300 font-medium">{uploading ? "Uploading photo..." : "AI is detecting items..."}</p>
                        <p className="text-slate-400 text-sm mt-1">This may take a few seconds</p>
                      </div>
                    )}

                    {photoUrl && !uploading && !analyzing && (
                      <div>
                        <img src={photoUrl} alt="Uploaded" className="w-full h-64 object-cover rounded-xl shadow-md mb-2" />
                        <Button type="button" size="sm" variant="outline" onClick={() => { setPhotoUrl(""); setDetectedItems([]); }} className="text-xs border-slate-300">
                          Remove & start over
                        </Button>
                      </div>
                    )}

                    {detectedItems.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-600" />
                            {detectedItems.length} items detected
                          </h3>
                          <span className="text-sm text-slate-500">{detectedItems.filter(i => i.selected).length} selected</span>
                        </div>
                        <div className="space-y-3">
                          {detectedItems.map((item) => (
                            <div key={item.id} onClick={() => toggleItem(item.id)} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${item.selected ? 'border-purple-400 bg-purple-50' : 'border-slate-200 bg-white opacity-50'}`}>
                              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${item.selected ? 'border-purple-600 bg-purple-600' : 'border-slate-300'}`}>
                                {item.selected && <CheckCircle className="w-4 h-4 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800 dark:text-slate-100">{item.name}</p>
                                <div className="flex gap-2 flex-wrap mt-1">
                                  {item.category && <Badge className="text-xs bg-purple-100 text-purple-700 border-0">{item.category}</Badge>}
                                  {item.color && <Badge variant="outline" className="text-xs border-teal-200 text-teal-700">{item.color}</Badge>}
                                  {item.brand && <Badge variant="outline" className="text-xs">{item.brand}</Badge>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button onClick={handleSaveAll} disabled={saving || detectedItems.filter(i => i.selected).length === 0} className="w-full h-12 bg-gradient-to-r from-purple-900 to-purple-300 hover:from-purple-800 hover:to-purple-300 text-white">
                          {saving ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Saving {savedCount}/{detectedItems.filter(i => i.selected).length}...</>
                          ) : (
                            <><Sparkles className="w-5 h-5 mr-2" />Save {detectedItems.filter(i => i.selected).length} Items to Closet</>
                          )}
                        </Button>
                      </motion.div>
                    )}
                  </>
                )}
              </TabsContent>

              {/* ── CSV TAB ── */}
              <TabsContent value="csv" className="space-y-4">
                {csvDone ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{csvSavedCount} items imported!</h2>
                    <p className="text-slate-500 mb-6">All selected items have been saved to your closet.</p>
                    <div className="flex gap-3 justify-center">
                      <Button onClick={() => { setCsvDone(false); setCsvItems([]); setCsvSavedCount(0); }} variant="outline" className="border-purple-300 text-purple-700">
                        Import Another
                      </Button>
                      <Button onClick={() => navigate(createPageUrl("Closet"))} className="bg-gradient-to-r from-purple-900 to-purple-300 text-white">
                        Go to Closet
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-slate-700 dark:text-slate-200 text-sm">Download the CSV template</p>
                        <p className="text-xs text-slate-500 mt-0.5">Fill it in with your items, then upload it below.</p>
                        <p className="text-xs text-slate-400 mt-1">Columns: name*, category, color, brand, season, notes, storage_location</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={downloadTemplate} className="border-purple-300 text-purple-700 hover:bg-purple-100 flex-shrink-0">
                        <Download className="w-4 h-4 mr-1" />
                        Template
                      </Button>
                    </div>

                    <Button type="button" variant="outline" className="w-full h-24 border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition-all" onClick={() => csvInputRef.current?.click()}>
                      <div className="flex flex-col items-center gap-2">
                        <FileSpreadsheet className="w-8 h-8 text-purple-600" />
                        <span className="font-medium">Choose CSV File</span>
                      </div>
                    </Button>
                    <input ref={csvInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => handleCsvUpload(e.target.files[0])} />

                    {csvError && (
                      <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{csvError}</p>
                    )}

                    {csvItems.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-slate-700 dark:text-slate-200">{csvItems.length} rows found — preview below</p>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-500">{csvItems.filter(i => i._selected).length} selected</span>
                            <button onClick={() => setCsvItems(prev => prev.map(i => ({ ...i, _selected: true })))} className="text-xs text-purple-600 hover:underline">All</button>
                            <button onClick={() => setCsvItems(prev => prev.map(i => ({ ...i, _selected: false })))} className="text-xs text-slate-400 hover:underline">None</button>
                          </div>
                        </div>

                        {/* Table preview */}
                        <div className="rounded-xl border border-purple-200 overflow-hidden">
                          <div className="overflow-x-auto max-h-80">
                            <table className="w-full text-sm">
                              <thead className="bg-purple-50 sticky top-0">
                                <tr>
                                  <th className="w-8 px-3 py-2 text-left"></th>
                                  <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">Name</th>
                                  <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">Category</th>
                                  <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">Color</th>
                                  <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">Brand</th>
                                  <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">Season</th>
                                  <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">Location</th>
                                </tr>
                              </thead>
                              <tbody>
                                {csvItems.map((item, idx) => (
                                  <tr
                                    key={item._id}
                                    onClick={() => toggleCsvItem(item._id)}
                                    className={`cursor-pointer border-t border-purple-100 transition-colors ${item._selected ? 'bg-white hover:bg-purple-50' : 'bg-slate-50 opacity-40 hover:opacity-60'}`}
                                  >
                                    <td className="px-3 py-2">
                                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${item._selected ? 'bg-purple-600 border-purple-600' : 'border-slate-300'}`}>
                                        {item._selected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap">{item.name}</td>
                                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">{item.category || <span className="text-slate-300">—</span>}</td>
                                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">{item.color || <span className="text-slate-300">—</span>}</td>
                                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">{item.brand || <span className="text-slate-300">—</span>}</td>
                                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">{item.season || <span className="text-slate-300">—</span>}</td>
                                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">{item.storage_location || <span className="text-slate-300">—</span>}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <Button onClick={handleSaveCsv} disabled={csvSaving || csvItems.filter(i => i._selected).length === 0} className="w-full h-12 bg-gradient-to-r from-purple-900 to-purple-300 hover:from-purple-800 hover:to-purple-300 text-white">
                          {csvSaving ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Saving {csvSavedCount}/{csvItems.filter(i => i._selected).length}...</>
                          ) : (
                            <><Sparkles className="w-5 h-5 mr-2" />Import {csvItems.filter(i => i._selected).length} Items</>
                          )}
                        </Button>
                      </motion.div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
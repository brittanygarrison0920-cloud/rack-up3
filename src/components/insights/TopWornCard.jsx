import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shirt, Crown } from "lucide-react";

export default function TopWornCard({ items, outfits }) {
  const wornOutfits = outfits.filter((o) => o.worn_date);

  // Item wear count = number of worn outfits that include this item
  const itemCounts = items.map((item) => ({
    item,
    count: wornOutfits.filter((o) => Array.isArray(o.items) && o.items.includes(item.id)).length,
  }));
  const topItems = itemCounts
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Outfits ranked by most recent worn date (each outfit records one worn_date)
  const topOutfits = [...wornOutfits]
    .sort((a, b) => new Date(b.worn_date) - new Date(a.worn_date))
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <Card className="border-purple-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-300">
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-purple-600" />
            Top 5 Most-Worn Items
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {topItems.length > 0 ? (
            <div className="space-y-3">
              {topItems.map(({ item, count }, idx) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-slate-800 rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  {item.photo_url && (
                    <img src={item.photo_url} alt={item.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{item.category}</p>
                  </div>
                  <Badge variant="secondary">{count}× worn</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">Mark outfits as worn to see your most-used items.</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-purple-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-300">
          <CardTitle className="flex items-center gap-2">
            <Shirt className="w-5 h-5 text-purple-600" />
            Top 5 Most-Worn Outfits
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {topOutfits.length > 0 ? (
            <div className="space-y-3">
              {topOutfits.map((outfit, idx) => (
                <div key={outfit.id} className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-slate-800 rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-purple-100 flex items-center justify-center flex-shrink-0">
                    {outfit.photo_url ? (
                      <img src={outfit.photo_url} alt={outfit.name} className="w-full h-full object-cover" />
                    ) : (
                      <Shirt className="w-6 h-6 text-purple-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{outfit.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Last worn {outfit.worn_date}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No outfits marked as worn yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Package, AlertCircle, Palette, Tag, Calendar } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import TopWornCard from "@/components/insights/TopWornCard";

export default function Insights() {
  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['closetItems'],
    queryFn: () => base44.entities.ClosetItem.list(),
    initialData: [],
  });

  const { data: loans } = useQuery({
    queryKey: ['loans'],
    queryFn: () => base44.entities.Loan.list(),
    initialData: [],
  });

  const { data: outfits = [] } = useQuery({
    queryKey: ['outfits'],
    queryFn: () => base44.entities.Outfit.list(),
    initialData: [],
  });

  const { data: userProfile } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Color Distribution
  const colorData = items.reduce((acc, item) => {
    if (item.color) {
      acc[item.color] = (acc[item.color] || 0) + 1;
    }
    return acc;
  }, {});

  const colorChartData = Object.entries(colorData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Category Distribution
  const categoryData = items.reduce((acc, item) => {
    if (item.category) {
      const cat = item.category.replace(/_/g, ' ');
      acc[cat] = (acc[cat] || 0) + 1;
    }
    return acc;
  }, {});

  const categoryChartData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

  // Brand Distribution
  const brandData = items.reduce((acc, item) => {
    if (item.brand) {
      acc[item.brand] = (acc[item.brand] || 0) + 1;
    }
    return acc;
  }, {});

  const topBrands = Object.entries(brandData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Season Distribution
  const seasonData = items.reduce((acc, item) => {
    if (item.season) {
      acc[item.season] = (acc[item.season] || 0) + 1;
    }
    return acc;
  }, {});

  // Items currently on loan
  const currentLoans = loans.filter(loan => loan.status === 'loaned');
  
  // Calculate how long items have been loaned
  const longtermLoans = currentLoans.filter(loan => {
    const loanDate = new Date(loan.loan_date);
    const daysSince = Math.floor((Date.now() - loanDate) / (1000 * 60 * 60 * 24));
    return daysSince > 30;
  });

  // Wardrobe gaps based on style preferences
  const wardrobeGaps = [];
  if (userProfile?.style_preferences) {
    const hasEssentials = {
      tops: items.filter(i => i.category === 'tops').length,
      bottoms: items.filter(i => i.category === 'bottoms').length,
      dresses: items.filter(i => i.category === 'dresses').length,
      outerwear: items.filter(i => i.category === 'outerwear').length,
      shoes: items.filter(i => i.category === 'shoes').length,
      accessories: items.filter(i => i.category === 'accessories').length,
    };

    if (hasEssentials.tops < 5) wardrobeGaps.push({ category: 'Tops', recommendation: 'Add more versatile tops' });
    if (hasEssentials.bottoms < 3) wardrobeGaps.push({ category: 'Bottoms', recommendation: 'Add more bottoms variety' });
    if (hasEssentials.shoes < 3) wardrobeGaps.push({ category: 'Shoes', recommendation: 'Consider adding more shoe options' });
    if (hasEssentials.outerwear < 2) wardrobeGaps.push({ category: 'Outerwear', recommendation: 'Add layering pieces' });
  }

  const COLORS = ['#9333EA', '#14B8A6', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981'];

  if (itemsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-purple-600">Loading insights...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-2">Wardrobe Insights</h1>
          <p className="text-slate-600 dark:text-slate-300">Analyze your closet data and trends</p>
        </motion.div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-purple-200 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Total Items</p>
                  <p className="text-3xl font-bold text-purple-600">{items.length}</p>
                </div>
                <Package className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-teal-200 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Categories</p>
                  <p className="text-3xl font-bold text-teal-600">{Object.keys(categoryData).length}</p>
                </div>
                <Tag className="w-8 h-8 text-teal-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Brands</p>
                  <p className="text-3xl font-bold text-amber-600">{Object.keys(brandData).length}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">On Loan</p>
                  <p className="text-3xl font-bold text-red-600">{currentLoans.length}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <TopWornCard items={items} outfits={outfits} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Color Distribution */}
          <Card className="border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-300">
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-600" />
                Color Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={colorChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {colorChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card className="border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-300">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Category Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryChartData}>
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#9333EA" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Brands */}
          <Card className="border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-300">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Top Brands
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {topBrands.length > 0 ? topBrands.map(([brand, count]) => (
                  <div key={brand} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="font-medium">{brand}</span>
                    <Badge variant="secondary">{count} items</Badge>
                  </div>
                )) : (
                  <p className="text-slate-500">No brand data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Wardrobe Gaps */}
          <Card className="border-amber-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Wardrobe Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {wardrobeGaps.length > 0 ? wardrobeGaps.map((gap, index) => (
                  <div key={index} className="p-3 bg-amber-50 rounded-lg border-l-4 border-amber-500">
                    <p className="font-semibold text-amber-900">{gap.category}</p>
                    <p className="text-sm text-amber-700">{gap.recommendation}</p>
                  </div>
                )) : (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-green-800">Your wardrobe is well-balanced! 🎉</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Long-term Loans Alert */}
          {longtermLoans.length > 0 && (
            <Card className="border-red-200 shadow-lg lg:col-span-2">
              <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-red-600" />
                  Items On Loan 30+ Days
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {longtermLoans.map((loan) => {
                    const item = items.find(i => i.id === loan.item_id);
                    const daysSince = Math.floor((Date.now() - new Date(loan.loan_date)) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={loan.id} className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center gap-3">
                          {item?.photo_url && (
                            <img src={item.photo_url} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                          )}
                          <div>
                            <p className="font-semibold text-red-900">{item?.name || 'Unknown Item'}</p>
                            <p className="text-sm text-red-700">Borrowed by {loan.friend_name}</p>
                            <p className="text-xs text-red-600">{daysSince} days ago</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
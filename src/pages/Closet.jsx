import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Search, Hash, Trash2, Check, Edit2, Loader2, Heart, Star, Bell, AlertTriangle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

import PullToRefresh from "@/components/PullToRefresh";
import ItemCard from "../components/closet/ItemCard";
import FilterPanel from "../components/closet/FilterPanel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MobileSelect from "@/components/ui/mobile-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function Closet() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSeason, setActiveSeason] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("-created_date");
  const [colorFilter, setColorFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [selectedItems, setSelectedItems] = useState([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkEdit, setBulkEdit] = useState({ category: "", color: "", season: "" });
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [bulkLoan, setBulkLoan] = useState({ friend_name: "", loan_date: new Date().toISOString().split('T')[0] });
  const [isBulkLoanCreating, setIsBulkLoanCreating] = useState(false);
  const [showBulkLoanForm, setShowBulkLoanForm] = useState(false);

  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ['closetItems', sortBy],
    queryFn: () => base44.entities.ClosetItem.list(sortBy),
    initialData: [],
  });

  const { data: loans, isLoading: loansLoading } = useQuery({
    queryKey: ['loans'],
    queryFn: () => base44.entities.Loan.filter({ status: 'loaned' }),
    initialData: [],
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id) => base44.entities.ClosetItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closetItems'] });
    },
  });

  const loanedItemIds = loans.map(loan => loan.item_id);
  const overdueLoans = loans.filter(loan => {
    if (!loan.expected_return_date) return false;
    return new Date(loan.expected_return_date) < new Date();
  });

  // Get unique colors and brands for filters
  const uniqueColors = [...new Set(items.map(item => item.color).filter(Boolean))].sort();
  const uniqueBrands = [...new Set(items.map(item => item.brand).filter(Boolean))].sort();

  const filteredItems = items.filter(item => {
    // Enhanced search across multiple fields including item number
    const search = searchQuery.toLowerCase().trim();
    const matchesSearch = !search || 
      item.name?.toLowerCase().includes(search) ||
      item.brand?.toLowerCase().includes(search) ||
      item.color?.toLowerCase().includes(search) ||
      item.category?.toLowerCase().replace(/_/g, ' ').includes(search) ||
      item.notes?.toLowerCase().includes(search) ||
      item.item_number?.toLowerCase().includes(search) ||
      item.storage_location?.toLowerCase().includes(search) ||
      // Search for combinations like "white top", "blue jeans"
      `${item.color} ${item.category}`.toLowerCase().replace(/_/g, ' ').includes(search) ||
      `${item.color} ${item.name}`.toLowerCase().includes(search);
    
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesSeason = activeSeason === "all" || item.season === activeSeason;
    const matchesColor = colorFilter === "all" || item.color === colorFilter;
    const matchesBrand = brandFilter === "all" || item.brand === brandFilter;
    return matchesSearch && matchesCategory && matchesSeason && matchesColor && matchesBrand;
  });

  const categories = [
    { value: "all", label: "All Items" },
    { value: "tops", label: "Tops" },
    { value: "bottoms", label: "Bottoms" },
    { value: "dresses", label: "Dresses" },
    { value: "outerwear", label: "Outerwear" },
    { value: "shoes", label: "Shoes" },
    { value: "accessories", label: "Accessories" },
    { value: "bags", label: "Bags" },
  ];

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this item from your closet?")) {
      deleteItemMutation.mutate(id);
    }
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const selectAll = () => {
    setSelectedItems(filteredItems.map(item => item.id));
  };

  const deselectAll = () => {
    setSelectedItems([]);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} items?`)) {
      for (const id of selectedItems) {
        await base44.entities.ClosetItem.delete(id);
      }
      queryClient.invalidateQueries({ queryKey: ['closetItems'] });
      setSelectedItems([]);
      setBulkMode(false);
    }
  };

  const handleBulkEdit = async () => {
    if (selectedItems.length === 0) return;
    const changes = {};
    if (bulkEdit.category) changes.category = bulkEdit.category;
    if (bulkEdit.color) changes.color = bulkEdit.color;
    if (bulkEdit.season) changes.season = bulkEdit.season;
    if (Object.keys(changes).length === 0) return;

    setIsBulkUpdating(true);
    for (const id of selectedItems) {
      await base44.entities.ClosetItem.update(id, changes);
    }
    queryClient.invalidateQueries({ queryKey: ['closetItems'] });
    setSelectedItems([]);
    setBulkEdit({ category: "", color: "", season: "" });
    setBulkMode(false);
    setIsBulkUpdating(false);
  };

  const handleBulkFavorite = async () => {
    if (selectedItems.length === 0) return;
    setIsBulkUpdating(true);
    for (const id of selectedItems) {
      await base44.entities.ClosetItem.update(id, { is_favorite: true });
    }
    queryClient.invalidateQueries({ queryKey: ['closetItems'] });
    setSelectedItems([]);
    setIsBulkUpdating(false);
  };

  const handleBulkLoan = async () => {
    if (selectedItems.length === 0 || !bulkLoan.friend_name) return;
    setIsBulkLoanCreating(true);
    for (const id of selectedItems) {
      await base44.entities.Loan.create({
        item_id: id,
        friend_name: bulkLoan.friend_name,
        loan_date: bulkLoan.loan_date,
        status: 'loaned',
      });
    }
    queryClient.invalidateQueries({ queryKey: ['loans'] });
    queryClient.invalidateQueries({ queryKey: ['closetItems'] });
    setSelectedItems([]);
    setShowBulkLoanForm(false);
    setBulkLoan({ friend_name: "", loan_date: new Date().toISOString().split('T')[0] });
    setIsBulkLoanCreating(false);
  };

  return (
    <PullToRefresh onRefresh={async () => { await queryClient.refetchQueries({ queryKey: ['closetItems'] }); }}>
    <div className="min-h-screen p-4 md:p-8 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto">
        {/* Overdue Notification Banner */}
        {overdueLoans.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-red-900">
                  {overdueLoans.length} loaned {overdueLoans.length === 1 ? 'item is' : 'items are'} overdue
                </p>
                <p className="text-sm text-red-700">Expected return date has passed — time to follow up!</p>
              </div>
            </div>
            <Link to={createPageUrl("Loans")}>
              <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-50">
                <AlertTriangle className="w-4 h-4 mr-2" />
                View Loans
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-2">
                My Closet
              </h1>
              <p className="text-slate-600 dark:text-slate-300">
                {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} 
                {searchQuery && ' found'}
              </p>
            </div>
            <div className="flex gap-2">
              <Link to={createPageUrl("AddItem")}>
                <Button className="bg-gradient-to-r from-purple-900 to-purple-300 hover:from-purple-800 hover:to-purple-300 text-white shadow-lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Item
                </Button>
              </Link>
              <Button
                onClick={() => {
                  setBulkMode(!bulkMode);
                  setSelectedItems([]);
                }}
                variant={bulkMode ? "default" : "outline"}
                className={bulkMode ? "bg-slate-700" : ""}
              >
                <Check className="w-5 h-5 mr-2" />
                {bulkMode ? "Exit Bulk" : "Bulk Edit"}
              </Button>
            </div>
          </div>

          {/* Enhanced Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search by item number (MC-0001), name, color, brand, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-6 text-lg border-purple-200 focus:border-purple-500 rounded-2xl bg-white/70 backdrop-blur-sm"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-purple-200 dark:border-slate-800 rounded-2xl p-4 mb-4 space-y-4">
            {/* Category Tabs */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">Category</Label>
              <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-purple-200 dark:border-slate-800 p-1 h-auto flex-wrap">
                  {categories.map((cat) => (
                    <TabsTrigger
                      key={cat.value}
                      value={cat.value}
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-300 data-[state=active]:text-white px-4 py-2 rounded-lg"
                    >
                      {cat.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Season, Color, Brand & Sort */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-sm mb-1 block">Season</Label>
                <MobileSelect
                  value={activeSeason}
                  onValueChange={setActiveSeason}
                  options={[
                    { value: "all", label: "All Seasons" },
                    { value: "spring", label: "Spring" },
                    { value: "summer", label: "Summer" },
                    { value: "fall", label: "Fall" },
                    { value: "winter", label: "Winter" },
                    { value: "all_season", label: "All Season" }
                  ]}
                />
              </div>

              <div>
                <Label className="text-sm mb-1 block">Color</Label>
                <MobileSelect
                  value={colorFilter}
                  onValueChange={setColorFilter}
                  options={[
                    { value: "all", label: "All Colors" },
                    ...uniqueColors.map(color => ({ value: color, label: color }))
                  ]}
                />
              </div>

              <div>
                <Label className="text-sm mb-1 block">Brand</Label>
                <MobileSelect
                  value={brandFilter}
                  onValueChange={setBrandFilter}
                  options={[
                    { value: "all", label: "All Brands" },
                    ...uniqueBrands.map(brand => ({ value: brand, label: brand }))
                  ]}
                />
              </div>

              <div>
                <Label className="text-sm mb-1 block">Sort By</Label>
                <MobileSelect
                  value={sortBy}
                  onValueChange={setSortBy}
                  options={[
                    { value: "-created_date", label: "Newest First" },
                    { value: "created_date", label: "Oldest First" },
                    { value: "name", label: "Name A-Z" },
                    { value: "-name", label: "Name Z-A" },
                    { value: "category", label: "Category" },
                    { value: "brand", label: "Brand" },
                    { value: "color", label: "Color" }
                  ]}
                />
              </div>
            </div>

            {/* Clear Filters */}
            {(activeCategory !== "all" || activeSeason !== "all" || colorFilter !== "all" || brandFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setActiveCategory("all");
                  setActiveSeason("all");
                  setColorFilter("all");
                  setBrandFilter("all");
                }}
                className="text-purple-600"
              >
                Clear All Filters
              </Button>
            )}
          </div>

          {/* Bulk Actions Bar */}
          {bulkMode && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800 text-white rounded-2xl p-4 mb-4 space-y-4"
            >
              {/* Selection row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-semibold">{selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectedItems.length === filteredItems.length ? deselectAll : selectAll}
                    className="text-white hover:bg-slate-600"
                  >
                    {selectedItems.length === filteredItems.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>
                <Button
                  onClick={handleBulkDelete}
                  disabled={selectedItems.length === 0}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </div>

              {/* Bulk edit fields */}
              <div className="border-t border-slate-600 pt-3">
                <p className="text-sm text-slate-300 mb-3 flex items-center gap-2">
                  <Edit2 className="w-4 h-4" />
                  Change fields for selected items (leave blank to keep unchanged):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Category</label>
                    <MobileSelect
                      value={bulkEdit.category}
                      onValueChange={(v) => setBulkEdit(prev => ({ ...prev, category: v }))}
                      placeholder="Keep unchanged"
                      className="bg-slate-700 border-slate-600 text-white"
                      options={[
                        { value: "tops", label: "Tops" },
                        { value: "bottoms", label: "Bottoms" },
                        { value: "dresses", label: "Dresses" },
                        { value: "outerwear", label: "Outerwear" },
                        { value: "shoes", label: "Shoes" },
                        { value: "accessories", label: "Accessories" },
                        { value: "bags", label: "Bags" }
                      ]}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Season</label>
                    <MobileSelect
                      value={bulkEdit.season}
                      onValueChange={(v) => setBulkEdit(prev => ({ ...prev, season: v }))}
                      placeholder="Keep unchanged"
                      className="bg-slate-700 border-slate-600 text-white"
                      options={[
                        { value: "spring", label: "Spring" },
                        { value: "summer", label: "Summer" },
                        { value: "fall", label: "Fall" },
                        { value: "winter", label: "Winter" },
                        { value: "all_season", label: "All Season" }
                      ]}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Color</label>
                    <input
                      type="text"
                      value={bulkEdit.color}
                      onChange={(e) => setBulkEdit(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="e.g. black, navy..."
                      className="w-full h-9 px-3 rounded-md bg-slate-700 border border-slate-600 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleBulkEdit}
                  disabled={selectedItems.length === 0 || isBulkUpdating || (!bulkEdit.category && !bulkEdit.color && !bulkEdit.season)}
                  className="mt-3 bg-purple-600 hover:bg-purple-700 text-white"
                  size="sm"
                >
                  {isBulkUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  {isBulkUpdating ? "Updating..." : `Apply to ${selectedItems.length} item${selectedItems.length !== 1 ? 's' : ''}`}
                </Button>
              </div>

              {/* Quick Actions: Favorite & Loan */}
              <div className="border-t border-slate-600 pt-3">
                <p className="text-sm text-slate-300 mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Quick Actions
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Button
                    onClick={handleBulkFavorite}
                    disabled={selectedItems.length === 0 || isBulkUpdating}
                    variant="secondary"
                    size="sm"
                    className="bg-pink-600 hover:bg-pink-700 text-white border-0"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Mark as Favorite
                  </Button>
                  <Button
                    onClick={() => setShowBulkLoanForm(!showBulkLoanForm)}
                    disabled={selectedItems.length === 0}
                    variant="secondary"
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white border-0"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    {showBulkLoanForm ? "Cancel" : "Mark as Loaned"}
                  </Button>
                </div>
                {showBulkLoanForm && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Friend's Name</label>
                      <input
                        type="text"
                        value={bulkLoan.friend_name}
                        onChange={(e) => setBulkLoan(prev => ({ ...prev, friend_name: e.target.value }))}
                        placeholder="Who has them?"
                        className="w-full h-9 px-3 rounded-md bg-slate-700 border border-slate-600 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Loan Date</label>
                      <input
                        type="date"
                        value={bulkLoan.loan_date}
                        onChange={(e) => setBulkLoan(prev => ({ ...prev, loan_date: e.target.value }))}
                        className="w-full h-9 px-3 rounded-md bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                    <Button
                      onClick={handleBulkLoan}
                      disabled={selectedItems.length === 0 || isBulkLoanCreating || !bulkLoan.friend_name}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                      size="sm"
                    >
                      {isBulkLoanCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                      {isBulkLoanCreating ? "Creating..." : `Loan ${selectedItems.length} item${selectedItems.length !== 1 ? 's' : ''}`}
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Items Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-white/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-purple-300 rounded-full flex items-center justify-center">
              {searchQuery ? <Search className="w-12 h-12 text-purple-600" /> : <Plus className="w-12 h-12 text-purple-600" />}
            </div>
            <h3 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-2">
              {searchQuery ? 'No items found' : 'Your closet is empty'}
            </h3>
            <p className="text-slate-500 mb-6">
              {searchQuery ? 'Try a different search term or item number' : 'Start adding your wardrobe items to get organized'}
            </p>
            {searchQuery ? (
              <Button
                onClick={() => setSearchQuery("")}
                className="bg-gradient-to-r from-purple-900 to-purple-300 hover:from-purple-800 hover:to-purple-300 text-white"
              >
                Clear Search
              </Button>
            ) : (
              <Link to={createPageUrl("AddItem")}>
                <Button className="bg-gradient-to-r from-purple-900 to-purple-300 hover:from-purple-800 hover:to-purple-300 text-white">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Item
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          >
            <AnimatePresence>
              {filteredItems.map((item) => (
                <div key={item.id} className="relative">
                  {bulkMode && (
                    <div 
                      className="absolute top-2 left-2 z-10 bg-white rounded-lg shadow-lg p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleItemSelection(item.id);
                      }}
                    >
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                      />
                    </div>
                  )}
                  <ItemCard
                    item={item}
                    onDelete={handleDelete}
                    isLoaned={loanedItemIds.includes(item.id)}
                  />
                </div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
    </PullToRefresh>
  );
}
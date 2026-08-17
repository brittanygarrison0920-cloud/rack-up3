import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MobileSelect from "@/components/ui/mobile-select";
import { Badge } from "@/components/ui/badge";

export default function OutfitCalendar({ outfits }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedOutfitId, setSelectedOutfitId] = useState("");
  const [mode, setMode] = useState("planned"); // "planned" | "worn"
  const queryClient = useQueryClient();

  const updateOutfitMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Outfit.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['outfits'] }),
  });

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });

  const getOutfitsForDay = (day, field) =>
    outfits.filter(o => o[field] && isSameDay(parseISO(o[field]), day));

  const handleDayClick = (day) => {
    setSelectedDay(day);
    setSelectedOutfitId("");
    setAssignDialogOpen(true);
  };

  const handleAssign = () => {
    if (!selectedOutfitId || !selectedDay) return;
    const field = mode === "planned" ? "planned_date" : "worn_date";
    updateOutfitMutation.mutate({
      id: selectedOutfitId,
      data: { [field]: format(selectedDay, "yyyy-MM-dd") },
    });
    setAssignDialogOpen(false);
  };

  const handleRemove = (outfitId, field) => {
    updateOutfitMutation.mutate({ id: outfitId, data: { [field]: null } });
  };

  const startPad = startOfMonth(currentMonth).getDay();

  return (
    <div className="bg-white/80 rounded-3xl shadow-sm border border-purple-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">{format(currentMonth, "MMMM yyyy")}</h2>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={mode === "planned" ? "default" : "outline"}
              onClick={() => setMode("planned")}
              className={mode === "planned" ? "bg-purple-700 text-white" : ""}
            >
              Planned
            </Button>
            <Button
              size="sm"
              variant={mode === "worn" ? "default" : "outline"}
              onClick={() => setMode("worn")}
              className={mode === "worn" ? "bg-purple-900 text-white" : ""}
            >
              <CheckCircle2 className="w-3 h-3 mr-1" /> Worn
            </Button>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array(startPad).fill(null).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const field = mode === "planned" ? "planned_date" : "worn_date";
          const dayOutfits = getOutfitsForDay(day, field);
          const isToday = isSameDay(day, new Date());
          return (
            <div
              key={day.toString()}
              onClick={() => handleDayClick(day)}
              className={`min-h-[80px] rounded-xl p-1.5 cursor-pointer border transition-all
                ${isToday ? "border-purple-400 bg-purple-50" : "border-transparent hover:border-purple-200 hover:bg-purple-50/50"}
                ${dayOutfits.length > 0 ? "bg-purple-50" : "bg-white/60"}
              `}
            >
              <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full
                ${isToday ? "bg-purple-700 text-white" : "text-slate-600"}
              `}>
                {format(day, "d")}
              </div>
              <div className="space-y-0.5">
                {dayOutfits.slice(0, 2).map(outfit => (
                  <div
                    key={outfit.id}
                    className="text-xs bg-gradient-to-r from-purple-900 to-purple-400 text-white rounded-md px-1.5 py-0.5 truncate cursor-pointer"
                    onClick={e => { e.stopPropagation(); handleRemove(outfit.id, field); }}
                    title={`Click to remove: ${outfit.name}`}
                  >
                    {outfit.name}
                  </div>
                ))}
                {dayOutfits.length > 2 && (
                  <div className="text-xs text-purple-600 pl-1">+{dayOutfits.length - 2} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 mt-3 text-center">Click a day to assign an outfit • Click an outfit chip to remove it</p>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === "planned" ? "Plan outfit for" : "Mark outfit worn on"}{" "}
              {selectedDay && format(selectedDay, "EEEE, MMMM d")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <MobileSelect
              value={selectedOutfitId}
              onValueChange={setSelectedOutfitId}
              placeholder="Choose an outfit..."
              options={outfits.map(o => ({ value: o.id, label: o.name }))}
            />
            <Button
              className="w-full bg-gradient-to-r from-purple-900 to-purple-300 text-white"
              disabled={!selectedOutfitId}
              onClick={handleAssign}
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              {mode === "planned" ? "Plan this outfit" : "Mark as worn"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
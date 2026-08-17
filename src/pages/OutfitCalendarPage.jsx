import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  parseISO,
  isToday,
} from "date-fns";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { ChevronLeft, ChevronRight, X, Shirt, CalendarDays, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OutfitCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const queryClient = useQueryClient();

  const { data: outfits = [], isLoading } = useQuery({
    queryKey: ["outfits"],
    queryFn: () => base44.entities.Outfit.list(),
    initialData: [],
  });

  const { data: loans = [] } = useQuery({
    queryKey: ["loans"],
    queryFn: () => base44.entities.Loan.list(),
    initialData: [],
  });

  const updateOutfitMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Outfit.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["outfits"] }),
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const getOutfitsForDay = (day) =>
    outfits.filter((o) => o.planned_date && isSameDay(parseISO(o.planned_date), day));

  const getLoansForDay = (day) =>
    loans.filter(
      (l) =>
        l.sync_to_calendar !== false &&
        l.status === "loaned" &&
        l.expected_return_date &&
        isSameDay(parseISO(l.expected_return_date), day)
    );

  const unplannedOutfits = outfits.filter((o) => !o.planned_date);

  const onDragEnd = (result) => {
    const { destination, draggableId } = result;
    if (!destination) return;

    const outfit = outfits.find((o) => o.id === draggableId);
    if (!outfit) return;

    if (destination.droppableId === "unplanned") {
      if (outfit.planned_date) {
        updateOutfitMutation.mutate({ id: outfit.id, data: { planned_date: null } });
      }
    } else {
      const dateStr = destination.droppableId.replace("day-", "");
      if (outfit.planned_date !== dateStr) {
        updateOutfitMutation.mutate({ id: outfit.id, data: { planned_date: dateStr } });
      }
    }
  };

  const dayKey = (day) => `day-${format(day, "yyyy-MM-dd")}`;

  return (
    <div className="min-h-screen p-4 md:p-8 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold mb-2">Outfit Calendar</h1>
          <p className="text-slate-600 dark:text-slate-300">
            Drag and drop outfits to plan your looks for each day
          </p>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          {/* Calendar */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-3xl shadow-sm border border-purple-100 dark:border-slate-800 p-4 md:p-6 mb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <h2 className="text-2xl md:text-3xl font-bold">{format(currentMonth, "MMMM yyyy")}</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth((m) => subMonths(m, 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={() => setCurrentMonth(new Date())}>
                  Today
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth((m) => addMonths(m, 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mb-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-gradient-to-r from-purple-900 to-purple-400" />
                Outfits
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-gradient-to-r from-amber-600 to-orange-400" />
                Loan return reminders
              </span>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((day) => {
                const inMonth = isSameMonth(day, currentMonth);
                const dayOutfits = getOutfitsForDay(day);
                const today = isToday(day);
                return (
                  <Droppable key={dayKey(day)} droppableId={dayKey(day)}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[100px] rounded-xl p-1.5 border transition-all
                          ${today ? "border-purple-400 bg-purple-50" : "border-transparent"}
                          ${snapshot.isDraggingOver ? "border-purple-500 bg-purple-100 dark:bg-purple-900/40" : ""}
                          ${inMonth ? "bg-white/60 dark:bg-slate-800/40" : "bg-slate-50/50 dark:bg-slate-900/20 opacity-50"}
                        `}
                      >
                        <div
                          className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full
                            ${today ? "bg-purple-700 text-white" : "text-slate-600 dark:text-slate-300"}`}
                        >
                          {format(day, "d")}
                        </div>
                        <div className="space-y-1">
                          {dayOutfits.map((outfit, index) => (
                            <Draggable key={outfit.id} draggableId={outfit.id} index={index}>
                              {(prov, snap) => (
                                <div
                                  ref={prov.innerRef}
                                  {...prov.draggableProps}
                                  {...prov.dragHandleProps}
                                  className={`text-xs bg-gradient-to-r from-purple-900 to-purple-400 text-white rounded-md px-1.5 py-1 truncate cursor-grab active:cursor-grabbing flex items-center gap-1
                                    ${snap.isDragging ? "shadow-lg ring-2 ring-purple-300 opacity-80" : ""}`}
                                  title={outfit.name}
                                >
                                  <span className="truncate flex-1">{outfit.name}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateOutfitMutation.mutate({
                                        id: outfit.id,
                                        data: { planned_date: null },
                                      });
                                    }}
                                    className="hover:bg-white/30 rounded p-0.5 flex-shrink-0"
                                    title="Remove from calendar"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {getLoansForDay(day).map((loan) => (
                            <div
                              key={`loan-${loan.id}`}
                              className="text-xs bg-gradient-to-r from-amber-600 to-orange-400 text-white rounded-md px-1.5 py-1 truncate flex items-center gap-1"
                              title={`Return reminder: ${loan.friend_name}`}
                            >
                              <Undo2 className="w-2.5 h-2.5 flex-shrink-0" />
                              <span className="truncate flex-1">{loan.friend_name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </div>
          </div>

          {/* Unplanned Outfits */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-3xl shadow-sm border border-purple-100 dark:border-slate-800 p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shirt className="w-5 h-5 text-purple-600" />
              <h3 className="text-xl font-bold">Unplanned Outfits</h3>
              <span className="text-sm text-slate-400">({unplannedOutfits.length})</span>
            </div>
            <Droppable droppableId="unplanned" direction="horizontal">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex gap-3 overflow-x-auto pb-2 min-h-[130px] rounded-xl p-2 transition-colors
                    ${snapshot.isDraggingOver ? "bg-purple-50 dark:bg-purple-900/30" : ""}`}
                >
                  {unplannedOutfits.length === 0 && !snapshot.isDraggingOver && (
                    <div className="flex items-center justify-center w-full text-sm text-slate-400">
                      <CalendarDays className="w-4 h-4 mr-2" />
                      All outfits are planned — drag one back here to unplan it.
                    </div>
                  )}
                  {unplannedOutfits.map((outfit, index) => (
                    <Draggable key={outfit.id} draggableId={outfit.id} index={index}>
                      {(prov, snap) => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          {...prov.dragHandleProps}
                          className={`flex-shrink-0 w-28 rounded-xl overflow-hidden border-2 cursor-grab active:cursor-grabbing bg-white dark:bg-slate-800 shadow-sm
                            ${snap.isDragging ? "ring-2 ring-purple-400 shadow-lg" : "border-purple-100 dark:border-slate-700"}`}
                        >
                          <div className="aspect-[3/4] bg-gradient-to-br from-purple-100 to-purple-300 relative">
                            {outfit.photo_url ? (
                              <img
                                src={outfit.photo_url}
                                alt={outfit.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Shirt className="w-8 h-8 text-purple-300" />
                              </div>
                            )}
                          </div>
                          <div className="p-1.5">
                            <p className="text-xs font-semibold truncate text-slate-700 dark:text-slate-200">
                              {outfit.name}
                            </p>
                            {outfit.occasion && (
                              <p className="text-[10px] text-slate-400 truncate capitalize">
                                {outfit.occasion}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
            <p className="text-xs text-slate-400 mt-2 text-center">
              Drag an outfit onto a day to plan it • Drag back here or click ✕ to unplan
            </p>
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
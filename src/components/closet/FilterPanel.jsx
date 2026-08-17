import React from "react";
import { Button } from "@/components/ui/button";
import { Snowflake, Sun, Leaf, CloudRain, Sparkles } from "lucide-react";

const seasons = [
  { value: "all", label: "All Seasons", icon: Sparkles },
  { value: "spring", label: "Spring", icon: Leaf },
  { value: "summer", label: "Summer", icon: Sun },
  { value: "fall", label: "Fall", icon: CloudRain },
  { value: "winter", label: "Winter", icon: Snowflake },
];

export default function FilterPanel({ activeSeason, setActiveSeason }) {
  return (
    <div className="flex flex-wrap gap-2">
      {seasons.map((season) => {
        const Icon = season.icon;
        const isActive = activeSeason === season.value;
        return (
          <Button
            key={season.value}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSeason(season.value)}
            className={`rounded-xl transition-all duration-300 ${
              isActive
                ? "bg-gradient-to-r from-purple-900 to-purple-300 text-white shadow-lg"
                : "border-purple-200 hover:border-purple-400 hover:bg-purple-50"
            }`}
          >
            <Icon className="w-4 h-4 mr-2" />
            {season.label}
          </Button>
        );
      })}
    </div>
  );
}
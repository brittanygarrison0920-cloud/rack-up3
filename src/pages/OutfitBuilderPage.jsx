import React from "react";
import { useNavigate } from "react-router-dom";
import OutfitBuilder from "@/components/outfits/OutfitBuilder";

export default function OutfitBuilderPage() {
  const navigate = useNavigate();
  return <OutfitBuilder onClose={() => navigate("/Outfits")} />;
}
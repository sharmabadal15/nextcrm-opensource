"use client";

import { useState } from "react";
import { toast } from "sonner";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_PIPELINE } from "@/config/pipeline";
import type { PipelineStage } from "@/types";

export default function PipelineSettingsPage() {
  const [stages, setStages] = useState<PipelineStage[]>(
    DEFAULT_PIPELINE.stages
  );
  const [pipelineName, setPipelineName] = useState(DEFAULT_PIPELINE.name);

  const updateStage = (index: number, field: keyof PipelineStage, value: string | number) => {
    setStages((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const addStage = () => {
    const newStage: PipelineStage = {
      id: `stage-${Date.now()}`,
      name: "New Stage",
      order: stages.length,
      probability: 50,
      color: "#6b7280",
    };
    setStages((prev) => [...prev, newStage]);
  };

  const removeStage = (index: number) => {
    if (stages.length <= 2) {
      toast.error("Pipeline must have at least 2 stages");
      return;
    }
    setStages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    toast.success("Pipeline settings saved");
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold">Pipeline Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure your sales pipeline stages
        </p>
      </div>

      <div className="space-y-4 max-w-xl">
        <div className="space-y-2">
          <Label>Pipeline Name</Label>
          <Input
            value={pipelineName}
            onChange={(e) => setPipelineName(e.target.value)}
          />
        </div>
      </div>

      <Separator />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium">Stages</h4>
          <Button variant="outline" size="sm" onClick={addStage}>
            <Plus className="mr-1.5 size-3.5" />
            Add Stage
          </Button>
        </div>

        <div className="space-y-2">
          {stages.map((stage, i) => (
            <div
              key={stage.id}
              className="flex items-center gap-3 rounded-lg border bg-card p-3"
            >
              <GripVertical className="size-4 shrink-0 text-muted-foreground cursor-grab" />

              <div
                className="size-4 shrink-0 rounded-full"
                style={{ backgroundColor: stage.color }}
              />

              <Input
                value={stage.name}
                onChange={(e) => updateStage(i, "name", e.target.value)}
                className="max-w-[180px]"
              />

              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Win %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={stage.probability}
                  onChange={(e) => updateStage(i, "probability", parseInt(e.target.value) || 0)}
                  className="w-20"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground">Color</Label>
                <input
                  type="color"
                  value={stage.color}
                  onChange={(e) => updateStage(i, "color", e.target.value)}
                  className="size-8 cursor-pointer rounded border-0 p-0"
                />
              </div>

              <Badge variant="secondary" className="ml-auto text-[10px]">
                #{i + 1}
              </Badge>

              <Button
                variant="ghost"
                size="sm"
                className="size-8 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeStage(i)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSave}>Save Pipeline</Button>
        <Button
          variant="outline"
          onClick={() => {
            setStages(DEFAULT_PIPELINE.stages);
            setPipelineName(DEFAULT_PIPELINE.name);
          }}
        >
          Reset to Default
        </Button>
      </div>
    </div>
  );
}

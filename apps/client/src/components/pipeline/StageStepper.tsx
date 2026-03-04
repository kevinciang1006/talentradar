import { CheckCircle2 } from "lucide-react";
import { PipelineStage, pipelineStages, stageConfig } from "@/data/pipeline";

interface StageStepperProps {
  currentStage: PipelineStage;
  stageHistory: { stage: string; date: string; color: string }[];
}

const stageOrder: PipelineStage[] = ["shortlisted", "screening", "interview", "offer", "finalizing", "hired"];

export const StageStepper = ({ currentStage }: StageStepperProps) => {
  const currentIdx = stageOrder.indexOf(currentStage);

  return (
    <div className="relative">
      {stageOrder.map((stage, i) => {
        const isCompleted = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isFuture = i > currentIdx;

        return (
          <div key={stage} className="relative flex items-start gap-3">
            {/* Vertical line */}
            {i < stageOrder.length - 1 && (
              <div
                className={`absolute left-[11px] top-[24px] w-0.5 h-[calc(100%-8px)] ${
                  isCompleted ? "bg-emerald-400" : isCurrent ? "bg-gradient-to-b from-primary to-muted" : "border-l border-dashed border-muted-foreground/20"
                }`}
              />
            )}

            {/* Circle */}
            <div className="relative z-10 shrink-0 mt-0.5">
              {isCompleted ? (
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
              ) : isCurrent ? (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/20 bg-background" />
              )}
            </div>

            {/* Label */}
            <div className={`pb-4 min-w-0 ${isFuture ? "opacity-40" : ""}`}>
              <span className={`text-sm font-medium ${isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                {stageConfig[stage].label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

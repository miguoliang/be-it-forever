interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export function StepIndicator({ currentStep, totalSteps, labels }: StepIndicatorProps) {
  const defaultLabels = ["选择文件", "预览数据", "完成导入"];
  const stepLabels = labels || defaultLabels;

  return (
    <div className="mb-8 md:mb-12">
      <div className="flex items-center justify-center space-x-2 md:space-x-4">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <div key={index} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-bold transition ${
                    isActive
                      ? "bg-cyan-500 text-white"
                      : isCompleted
                      ? "bg-green-500 text-white"
                      : "bg-white/20 text-white/60"
                  }`}
                >
                  {isCompleted ? "✓" : stepNumber}
                </div>
                <span
                  className={`mt-2 text-xs md:text-sm ${
                    isActive ? "text-white" : "text-white/60"
                  }`}
                >
                  {stepLabels[index]}
                </span>
              </div>
              {index < totalSteps - 1 && (
                <div
                  className={`w-8 md:w-16 h-0.5 md:h-1 mx-2 md:mx-4 ${
                    isCompleted ? "bg-green-500" : "bg-white/20"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


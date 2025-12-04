import type { Knowledge } from "../types";

interface CardBackProps {
  knowledge: Knowledge;
}

export function CardBack({ knowledge }: CardBackProps) {
  return (
    <div 
      className="absolute inset-0 flex flex-col items-center justify-center backface-hidden"
      style={{ transform: "rotateY(180deg)" }}
    >
      <div className="flex items-center gap-6 mb-8">
        <p className="text-7xl font-bold text-indigo-600 dark:text-indigo-400 text-center">
          {knowledge.description}
        </p>
      </div>

      {knowledge.metadata?.phonetic && (
        <p className="text-4xl text-indigo-600 dark:text-indigo-400 font-medium mb-8">
          {knowledge.metadata.phonetic}
        </p>
      )}

      <p className="text-xl text-gray-500 dark:text-gray-400">
        请为这张卡片评分
      </p>
    </div>
  );
}


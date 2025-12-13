import type { Knowledge } from "../types";
import { CardContent } from "@/components/ui/card";

interface CardBackProps {
  knowledge: Knowledge;
}

export const CardBack = ({ knowledge }: CardBackProps) => {
  return (
    <CardContent
      className="absolute inset-0 flex flex-col items-center justify-center backface-hidden p-0"
      style={{ transform: "rotateY(180deg)" }}
    >
      <div className="flex items-center gap-6 mb-8">
        <p className="text-7xl font-bold text-primary text-center">
          {knowledge.description}
        </p>
      </div>

      {knowledge.metadata.phonetic && (
        <p className="text-4xl text-primary font-medium mb-8">
          {knowledge.metadata.phonetic}
        </p>
      )}

      <p className="text-xl text-muted-foreground">
        请为这张卡片评分
      </p>
    </CardContent>
  );
};


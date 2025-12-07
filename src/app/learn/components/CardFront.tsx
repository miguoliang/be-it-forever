import type { Knowledge } from "../types";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";

interface CardFrontProps {
  knowledge: Knowledge;
  onSpeak: (text: string, lang: "en-US" | "en-GB") => void;
}

export const CardFront = ({ knowledge, onSpeak }: CardFrontProps) => {
  return (
    <CardContent className="absolute inset-0 flex flex-col items-center justify-center backface-hidden p-0">
      <h2 className="text-8xl font-bold text-foreground mb-8">
        {knowledge.name}
      </h2>

      {knowledge.metadata?.phonetic && (
        <p className="text-4xl text-primary font-medium mb-8">
          {knowledge.metadata.phonetic}
        </p>
      )}

      <div className="flex items-center justify-center gap-4 mb-8">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onSpeak(knowledge.name, "en-US");
          }}
          variant="secondary"
          size="lg"
          className="hover:scale-110 transition"
        >
          US Speaker
        </Button>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onSpeak(knowledge.name, "en-GB");
          }}
          variant="secondary"
          size="lg"
          className="hover:scale-110 transition"
        >
          UK Speaker
        </Button>
      </div>

      <p className="text-2xl text-muted-foreground">
        点击或滑动显示答案
      </p>
    </CardContent>
  );
};


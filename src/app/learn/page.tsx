"use client";

import { Button } from "@/components/ui/button";
import { LoadingState } from "./components/LoadingState";
import { EmptyState } from "./components/EmptyState";
import { ProgressIndicator } from "./components/ProgressIndicator";
import { StudyCard } from "./components/StudyCard";
import { RatingButtons } from "./components/RatingButtons";
import { CardStyles } from "./components/CardStyles";
import { LogOut } from "lucide-react";
import { useLearnSession } from "./hooks/useLearnSession";

export default function Learn() {
  const {
    loading,
    cards,
    currentCard,
    progress,
    flip,
    speech,
    touch,
    review,
    auth,
  } = useLearnSession();

  if (loading) return <LoadingState />;
  if (cards.length === 0) return <EmptyState />;

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <Button
          onClick={auth.handleSignOut}
          variant="ghost"
          size="sm"
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">退出登录</span>
        </Button>
      </div>
      <ProgressIndicator reviewed={progress.reviewed} total={progress.total} />

      <StudyCard
        card={currentCard}
        flipped={flip.isFlipped}
        onFlip={flip.toggle}
        onSpeak={speech.speak}
        onTouchStart={touch.handleTouchStart}
        onTouchEnd={touch.handleTouchEnd}
      />

      {flip.isFlipped && <RatingButtons onRate={review.handleRate} />}

      <CardStyles />
    </div>
  );
}

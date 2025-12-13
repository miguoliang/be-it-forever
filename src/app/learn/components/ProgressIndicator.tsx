interface ProgressIndicatorProps {
  reviewed: number; // Number of cards reviewed today
  total: number; // Total cards for today (due + reviewed today)
}

/**
 * ProgressIndicator displays daily progress:
 * Shows how many cards have been reviewed today out of total cards for today.
 * Display starts from 1 (e.g., "1 / 10" means starting first card, "5 / 10" means 4 reviewed).
 */
export function ProgressIndicator({ reviewed, total }: ProgressIndicatorProps) {
  // Display starts from 1, so add 1 to reviewed count, but cap at total
  const displayCount = Math.min(reviewed + 1, total);
  return (
    <div className="w-full max-w-2xl text-center mb-8">
      <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
        {displayCount} / {total}
      </p>
    </div>
  );
}


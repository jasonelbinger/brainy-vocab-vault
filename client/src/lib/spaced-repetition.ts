export interface SpacedRepetitionSettings {
  level0Interval: number; // Same session (0 days)
  level1Interval: number; // 1 day
  level2Interval: number; // 3 days
  level3Interval: number; // 7 days
  level4Interval: number; // 30 days
}

export function calculateNextReviewDate(
  currentLevel: number,
  correct: boolean,
  settings: SpacedRepetitionSettings
): { nextLevel: number; nextReviewDate: Date } {
  const now = new Date();
  let nextLevel: number;
  let intervalDays: number;

  if (correct) {
    // Advance to next level
    nextLevel = Math.min(currentLevel + 1, 4);
  } else {
    // Reset to level 0 if incorrect (allows same session review)
    nextLevel = 0;
  }

  // Calculate next review date based on level
  switch (nextLevel) {
    case 0:
      intervalDays = settings.level0Interval; // Same session (0 days)
      break;
    case 1:
      intervalDays = settings.level1Interval; // 1 day
      break;
    case 2:
      intervalDays = settings.level2Interval; // 3 days
      break;
    case 3:
      intervalDays = settings.level3Interval; // 7 days
      break;
    case 4:
      intervalDays = settings.level4Interval; // 30 days
      break;
    default:
      intervalDays = settings.level0Interval;
  }

  // For level 0, schedule for immediate review (same session)
  let nextReviewDate: Date;
  if (nextLevel === 0) {
    nextReviewDate = new Date(now.getTime()); // Now
  } else {
    nextReviewDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  }
  
  return { nextLevel, nextReviewDate };
}

export function getDifficultyColor(level: number): string {
  switch (level) {
    case 0: return 'text-red-500'; // Need immediate practice
    case 1: return 'text-orange-500'; // Review tomorrow
    case 2: return 'text-yellow-500'; // Learning
    case 3: return 'text-blue-500'; // Familiar
    case 4: return 'text-green-500'; // Mastered
    default: return 'text-gray-400';
  }
}

export function getDifficultyLabel(level: number): string {
  switch (level) {
    case 0: return 'Practice Again';
    case 1: return 'Review';
    case 2: return 'Learning';
    case 3: return 'Familiar';
    case 4: return 'Mastered';
    default: return 'Unknown';
  }
}

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useMasteryLevelCounts } from "@/hooks/use-review-session";
import { getDifficultyColor, getDifficultyLabel } from "@/lib/spaced-repetition";

export function ProgressTracker() {
  const { data: masteryLevels, isLoading } = useMasteryLevelCounts();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!masteryLevels) {
    return null;
  }

  const total = masteryLevels.level0 + masteryLevels.level1 + masteryLevels.level2 + masteryLevels.level3;
  const masteryRate = total > 0 ? Math.round((masteryLevels.level3 / total) * 100) : 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Learning Progress</h3>
          <div className="text-sm text-gray-600">
            <span className="font-medium">{masteryRate}%</span> mastered
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {([
            { level: 0, count: masteryLevels.level0 },
            { level: 1, count: masteryLevels.level1 },
            { level: 2, count: masteryLevels.level2 },
            { level: 3, count: masteryLevels.level3 },
          ]).map(({ level, count }) => (
            <div key={level} className="text-center">
              <div className={`text-2xl font-bold ${getDifficultyColor(level)}`}>
                {count}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                {getDifficultyLabel(level)}
              </div>
              <Progress 
                value={total > 0 ? (count / total) * 100 : 0} 
                className="h-2"
              />
            </div>
          ))}
        </div>
        
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Overall Progress</span>
            <span className="font-medium">{masteryRate}%</span>
          </div>
          <Progress value={masteryRate} className="h-3" />
        </div>
      </CardContent>
    </Card>
  );
}

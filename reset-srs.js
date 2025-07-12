// Reset SRS system - make some cards due for review
console.log("Resetting SRS system...");

// This will be run by the server to reset review sessions
const sampleCardUpdates = [
  // Make first 5 cards due for review with different mastery levels
  { cardId: 1, masteryLevel: 1, nextReviewDate: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Due yesterday
  { cardId: 2, masteryLevel: 2, nextReviewDate: new Date(Date.now() - 12 * 60 * 60 * 1000) }, // Due 12 hours ago
  { cardId: 3, masteryLevel: 0, nextReviewDate: new Date(Date.now()) }, // Due now
  { cardId: 4, masteryLevel: 1, nextReviewDate: new Date(Date.now() - 6 * 60 * 60 * 1000) }, // Due 6 hours ago
  { cardId: 5, masteryLevel: 3, nextReviewDate: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // Due 2 hours ago
];

export { sampleCardUpdates };
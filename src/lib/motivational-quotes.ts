export const MOTIVATIONAL_QUOTES = [
  "Discipline is choosing between what you want now and what you want most.",
  "The market doesn't reward being right. It rewards being disciplined.",
  "Your only job today is to execute the plan — not to predict the market.",
  "Cut losses fast, let winners run, and never negotiate with your stop.",
  "Every trade you don't take is a trade you didn't lose money on.",
  "Process over outcome. A good trade can lose, a bad trade can win.",
  "Patience is a position. Sometimes the best trade is no trade.",
  "You don't need to be right. You need to be disciplined and consistent.",
  "The trader who masters their emotions masters the market.",
  "Revenge trading is the market's favorite way of taking your money back.",
  "Size down when you're wrong more than you're right lately. It's data, not a feeling.",
  "A+ setups only. Everything else is gambling with extra steps.",
  "Consistency compounds. One great day means nothing without the next.",
  "You are not your last trade. Review it, learn, move on.",
  "The edge is in the plan. The leak is in not following it.",
  "Boredom is not a reason to enter a trade.",
  "Protect your capital first. Profits are a byproduct of good process.",
  "Journaling today is tomorrow's edge.",
  "Every rule you break costs more than the trade you were trying to save.",
  "Slow is smooth. Smooth is profitable.",
  "Keep getting 1% better.",
];

export function quoteOfTheDay(date: Date = new Date()): string {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (date.getTime() - startOfYear.getTime()) / 86_400_000,
  );
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
}

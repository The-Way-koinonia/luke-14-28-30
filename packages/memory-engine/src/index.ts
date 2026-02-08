export interface MemoryCard {
  id: string;
  easeFactor: number; // Defaults to 2.5
  interval: number; // Days until next review
  repetitions: number;
  dueDate: string; // ISO Date String
}

/**
 * Calculates the next review schedule using the SuperMemo-2 (SM-2) algorithm.
 * 
 * @param card Current state of the memory card
 * @param quality User rating 0-5 (0=Blackout, 5=Perfect)
 * @returns Updated memory card with new schedule
 */
export const calculateReview = (card: MemoryCard, quality: number): MemoryCard => {
  let { easeFactor, interval, repetitions } = card;

  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    
    repetitions += 1;
    
    // Update Ease Factor
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    
    // Ease Factor minimum floor is 1.3
    if (easeFactor < 1.3) easeFactor = 1.3;
    
  } else {
    // Incorrect response
    repetitions = 0;
    interval = 1;
    // Ease Factor remains unchanged on failure in standard SM-2, 
    // though some variations decrease it. We stick to standard.
  }

  // Calculate Due Date
  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + interval);
  
  return {
    ...card,
    easeFactor,
    interval,
    repetitions,
    dueDate: nextDueDate.toISOString(),
  };
};

/**
 * Creates a new memory card with default SM-2 values.
 */
export const createNewCard = (id: string): MemoryCard => {
  return {
    id,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: new Date().toISOString(), // Due immediately
  };
};

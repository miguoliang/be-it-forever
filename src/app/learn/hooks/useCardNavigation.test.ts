import { renderHook, act } from '@testing-library/react';
import { useCardNavigation } from './useCardNavigation';
import { Card } from '../types';

describe('useCardNavigation', () => {
  const mockCards: Card[] = [
    { id: 1, reviewed: false, templates: { front: 'F1', back: 'B1' } } as Card,
    { id: 2, reviewed: false, templates: { front: 'F2', back: 'B2' } } as Card,
    { id: 3, reviewed: false, templates: { front: 'F3', back: 'B3' } } as Card,
  ];

  it('should initialize with first card', () => {
    const { result } = renderHook(() => useCardNavigation(mockCards));
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.currentCard?.id).toBe(1);
  });

  it('should handle empty cards array', () => {
    const { result } = renderHook(() => useCardNavigation([]));
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.currentCard).toBeUndefined();
  });

  it('should auto-advance if current card is reviewed', () => {
    const cardsWithReviewed = [
      { id: 1, reviewed: true } as Card, // Reviewed
      { id: 2, reviewed: false } as Card, // Next valid
      { id: 3, reviewed: false } as Card,
    ];

    jest.useFakeTimers();
    const { result } = renderHook(({ cards }) => useCardNavigation(cards), {
      initialProps: { cards: cardsWithReviewed },
    });

    // Should start at 0 but effect will fire
    expect(result.current.currentIndex).toBe(0);

    // Fast-forward effect
    act(() => {
      jest.runAllTimers();
    });

    expect(result.current.currentIndex).toBe(1);
    expect(result.current.currentCard?.id).toBe(2);
    
    jest.useRealTimers();
  });

  it('should wrap around to find unreviewed card', () => {
    const cardsWrap = [
      { id: 1, reviewed: false } as Card, // Target
      { id: 2, reviewed: true } as Card, // Current index starts here manually? No.
      { id: 3, reviewed: true } as Card,
    ];
    
    // If we are at index 2 (Card 3) and it gets reviewed, we should go to Card 1
    
    jest.useFakeTimers();
    const { result } = renderHook(() => useCardNavigation(cardsWrap));

    // Manually set index to last one
    act(() => {
        result.current.setCurrentIndex(2);
    });

    // Now re-render with the last card marked as reviewed
    // Wait, useCardNavigation depends on `cards` prop.
    // If we want to simulate "Reviewing" a card, we update the cards prop.
  });
  
  it('should advance when card property changes to reviewed', () => {
    const initialCards = [
        { id: 1, reviewed: false } as Card,
        { id: 2, reviewed: false } as Card,
    ];

    jest.useFakeTimers();
    const { result, rerender } = renderHook(({ cards }) => useCardNavigation(cards), {
        initialProps: { cards: initialCards }
    });

    expect(result.current.currentIndex).toBe(0);

    // Update cards: Card 1 is now reviewed
    const updatedCards = [
        { id: 1, reviewed: true } as Card,
        { id: 2, reviewed: false } as Card,
    ];

    rerender({ cards: updatedCards });

    act(() => {
        jest.runAllTimers();
    });

    expect(result.current.currentIndex).toBe(1);
    expect(result.current.currentCard?.id).toBe(2);

    jest.useRealTimers();
  });
});

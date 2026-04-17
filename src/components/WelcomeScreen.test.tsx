import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import WelcomeScreen from './WelcomeScreen';

describe('WelcomeScreen Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the initial welcome state accurately', () => {
    const mockStart = vi.fn();
    const mockSetup = vi.fn();
    render(<WelcomeScreen onStart={mockStart} onSetupApi={mockSetup} />);

    expect(screen.getByText(/UnbiasNet/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Fairness Intelligence/i)).toBeInTheDocument();
    expect(screen.getByText(/Enter Platform/i)).toBeInTheDocument();
  });

  it('calls onStart when the begin button is clicked after the cinematic delay', async () => {
    const mockStart = vi.fn();
    const mockSetup = vi.fn();
    render(<WelcomeScreen onStart={mockStart} onSetupApi={mockSetup} />);

    const startBtn = screen.getByText(/Enter Platform/i);
    fireEvent.click(startBtn);

    // Initial click should not trigger onStart immediately due to setTimeout(1800)
    expect(mockStart).not.toHaveBeenCalled();

    // Fast-forward time to skip the 1.8s animation
    act(() => {
      vi.advanceTimersByTime(1800);
    });

    expect(mockStart).toHaveBeenCalledTimes(1);
  });
});

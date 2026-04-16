import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import WelcomeScreen from './WelcomeScreen';

describe('WelcomeScreen Component', () => {
  it('renders the initial welcome state accurately', () => {
    const mockStart = vi.fn();
    render(<WelcomeScreen onStart={mockStart} />);

    expect(screen.getByText(/UnbiasNet/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Fairness Intelligence/i)).toBeInTheDocument();
    expect(screen.getByText(/Get Started/i)).toBeInTheDocument();
  });

  it('calls onStart when the begin button is clicked', () => {
    const mockStart = vi.fn();
    render(<WelcomeScreen onStart={mockStart} />);

    const startBtn = screen.getByText(/Get Started/i);
    fireEvent.click(startBtn);

    expect(mockStart).toHaveBeenCalledTimes(1);
  });
});

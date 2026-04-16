import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Toast from './Toast';

describe('Toast Component', () => {
  it('renders the given message', () => {
    render(<Toast msg="Hello from Toast" close={() => {}} />);
    expect(screen.getByText('Hello from Toast')).toBeInTheDocument();
  });

  it('calls close callback when dismiss button is clicked', () => {
    const handleClose = vi.fn();
    render(<Toast msg="Hello" close={handleClose} />);
    const closeBtn = screen.getByRole('button', { name: /close notification/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

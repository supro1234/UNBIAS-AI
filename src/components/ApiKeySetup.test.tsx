import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import ApiKeySetup from './ApiKeySetup';

// Mock the global fetch
global.fetch = vi.fn();

describe('ApiKeySetup Component', () => {
  it('renders input field and validate button natively', () => {
    const mockOnSuccess = vi.fn();
    const mockOnBack = vi.fn();

    render(<ApiKeySetup onSuccess={mockOnSuccess} onBack={mockOnBack} />);

    expect(screen.getByPlaceholderText(/Enter your API key here/i)).toBeInTheDocument();
    expect(screen.getByText(/Validate and continue/i)).toBeInTheDocument();
    expect(screen.getByText(/Back/i)).toBeInTheDocument();
  });

  it('handles back button click', () => {
    const mockOnSuccess = vi.fn();
    const mockOnBack = vi.fn();

    render(<ApiKeySetup onSuccess={mockOnSuccess} onBack={mockOnBack} />);
    fireEvent.click(screen.getByText(/Back/i));
    
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('triggers manual validation rejecting short invalid keys', async () => {
    const mockOnSuccess = vi.fn();
    const mockOnBack = vi.fn();

    render(<ApiKeySetup onSuccess={mockOnSuccess} onBack={mockOnBack} />);
    
    const input = screen.getByPlaceholderText(/Enter your API key here/i);
    const validateBtn = screen.getByText(/Validate and continue/i);

    fireEvent.change(input, { target: { value: 'short-key' } });
    fireEvent.click(validateBtn);

    expect(await screen.findByText(/Please enter a valid Google Gemini API Key/i)).toBeInTheDocument();
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('triggers auto-validation with valid key length and succeeds', async () => {
    const mockOnSuccess = vi.fn();
    const mockOnBack = vi.fn();

    // Mock an OK network response for our test payload
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: true })
    });

    render(<ApiKeySetup onSuccess={mockOnSuccess} onBack={mockOnBack} />);

    const input = screen.getByPlaceholderText(/Enter your API key here/i);
    
    // Paste a convincingly long valid mock API key
    const dummyKey = 'AIzaSyA_mock_safe_testing_hash_string_39c';
    fireEvent.change(input, { target: { value: dummyKey } });

    // Ensure the debounce hook triggers, skipping the 'click' directly
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/validate-key'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ apiKey: dummyKey })
        })
      );
    }, { timeout: 1500 }); // Wait for the 1000ms debounce loop

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(dummyKey);
    });
  });
});

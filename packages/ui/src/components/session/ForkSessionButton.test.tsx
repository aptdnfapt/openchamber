import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as React from 'react';
import { ForkSessionButton } from './ForkSessionButton';

// Mock the stores
vi.mock('@/stores/useSessionStore', () => ({
  useSessionStore: vi.fn(),
}));

vi.mock('@/lib/device', () => ({
  useDeviceInfo: vi.fn(() => ({ isMobile: false })),
}));

describe('ForkSessionButton', () => {
  const mockOpenForkDialog = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default store state
    const { useSessionStore } = require('@/stores/useSessionStore');
    useSessionStore.mockImplementation((selector) => {
      const state = {
        currentSessionId: 'mock-session-id',
        openForkDialog: mockOpenForkDialog,
        forkDialogState: { isLoading: false, sourceSessionId: null, selectedMessageId: null },
      };
      return selector(state);
    });
  });

  it('renders without crashing', () => {
    render(<ForkSessionButton />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders the branch icon', () => {
    render(<ForkSessionButton />);
    const icon = screen.getByRole('button').querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('has proper aria-label', () => {
    render(<ForkSessionButton />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Fork session');
  });

  it('calls openForkDialog with current session ID when clicked', () => {
    render(<ForkSessionButton />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(mockOpenForkDialog).toHaveBeenCalledWith('mock-session-id');
  });

  it('is disabled when on mobile', () => {
    const { useDeviceInfo } = require('@/lib/device');
    useDeviceInfo.mockReturnValue({ isMobile: true });

    render(<ForkSessionButton />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when no current session', () => {
    const { useSessionStore } = require('@/stores/useSessionStore');
    useSessionStore.mockImplementation((selector) => {
      const state = {
        currentSessionId: null,
        openForkDialog: mockOpenForkDialog,
        forkDialogState: { isLoading: false, sourceSessionId: null, selectedMessageId: null },
      };
      return selector(state);
    });

    render(<ForkSessionButton />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading state when fork is in progress', () => {
    const { useSessionStore } = require('@/stores/useSessionStore');
    useSessionStore.mockImplementation((selector) => {
      const state = {
        currentSessionId: 'mock-session-id',
        openForkDialog: mockOpenForkDialog,
        forkDialogState: { isLoading: true, sourceSessionId: 'mock-id', selectedMessageId: null },
      };
      return selector(state);
    });

    render(<ForkSessionButton />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('animate-pulse');
  });

  it('does not call openForkDialog when disabled', () => {
    const { useSessionStore } = require('@/stores/useSessionStore');
    useSessionStore.mockImplementation((selector) => {
      const state = {
        currentSessionId: null,
        openForkDialog: mockOpenForkDialog,
        forkDialogState: { isLoading: false, sourceSessionId: null, selectedMessageId: null },
      };
      return selector(state);
    });

    render(<ForkSessionButton />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(mockOpenForkDialog).not.toHaveBeenCalled();
  });
});

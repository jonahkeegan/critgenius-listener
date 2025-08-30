import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PermissionPrompt } from './PermissionPrompt';
import { usePermissions, PermissionState } from '../../hooks/usePermissions';

// Mock the usePermissions hook
vi.mock('../../hooks/usePermissions');

const mockUsePermissions = usePermissions as vi.Mock;

describe('PermissionPrompt', () => {
  const requestPermissionMock = vi.fn();

  beforeEach(() => {
    requestPermissionMock.mockClear();
    mockUsePermissions.mockReturnValue({
      permissionState: 'prompt',
      requestPermission: requestPermissionMock,
    });
    // Reset userAgent mock
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'test',
      configurable: true,
    });
  });

  const renderComponent = (state: PermissionState) => {
    mockUsePermissions.mockReturnValue({
      permissionState: state,
      requestPermission: requestPermissionMock,
    });
    return render(<PermissionPrompt />);
  };

  it('should display prompt message and button when permission state is "prompt"', () => {
    renderComponent('prompt');
    expect(
      screen.getByText('Microphone Permission Required')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Please grant permission to use your microphone to continue.'
      )
    ).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /Grant Permission/i });
    expect(button).toBeInTheDocument();
  });

  it('should call requestPermission when the button is clicked', () => {
    renderComponent('prompt');
    const button = screen.getByRole('button', { name: /Grant Permission/i });
    fireEvent.click(button);
    expect(requestPermissionMock).toHaveBeenCalledTimes(1);
  });

  it('should display granted message when permission state is "granted"', () => {
    renderComponent('granted');
    expect(screen.getByText('Permission Granted')).toBeInTheDocument();
    expect(
      screen.getByText('You can now start recording.')
    ).toBeInTheDocument();
  });

  it('should display denied message, and retry button when permission state is "denied"', () => {
    renderComponent('denied');
    expect(screen.getByText('Permission Denied')).toBeInTheDocument();
    expect(
      screen.getByText(/Microphone access was denied/)
    ).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /Retry/i });
    expect(retryButton).toBeInTheDocument();
    fireEvent.click(retryButton);
    expect(requestPermissionMock).toHaveBeenCalledTimes(1);
  });

  it('should show a guide link for a known browser', () => {
    // Mock userAgent to simulate Chrome
    Object.defineProperty(window.navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
      configurable: true,
    });
    renderComponent('denied');
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      'href',
      'https://support.google.com/chrome/answer/2693767'
    );
  });
});

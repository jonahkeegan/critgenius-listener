/**
 * @fileoverview Tests for the main App component
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import { critgeniusTheme } from './theme';

// Test wrapper with MUI theme provider
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={critgeniusTheme}>
      <CssBaseline />
      {component}
    </ThemeProvider>
  );
};

describe('App Component', () => {
  it('renders the main heading', () => {
    renderWithTheme(<App />);
    const heading = screen.getByText('CritGenius Listener');
    expect(heading).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    renderWithTheme(<App />);
    const subtitle = screen.getByText('Real-time audio capture and processing');
    expect(subtitle).toBeInTheDocument();
  });

  it('displays the version number', () => {
    renderWithTheme(<App />);
    const versionElement = screen.getByText(/^v\d+\.\d+\.\d+/);
    expect(versionElement).toBeInTheDocument();
  });

  it('shows start recording button initially', () => {
    renderWithTheme(<App />);
    const startButton = screen.getByText('🎤 Start Recording');
    expect(startButton).toBeInTheDocument();
  });

  it('changes to stop recording button when recording starts', () => {
    renderWithTheme(<App />);
    const startButton = screen.getByText('🎤 Start Recording');
    
    fireEvent.click(startButton);
    
    const stopButton = screen.getByText('⏹️ Stop Recording');
    expect(stopButton).toBeInTheDocument();
    expect(screen.queryByText('🎤 Start Recording')).not.toBeInTheDocument();
  });

  it('returns to start recording button when recording stops', () => {
    renderWithTheme(<App />);
    const startButton = screen.getByText('🎤 Start Recording');
    
    // Start recording
    fireEvent.click(startButton);
    const stopButton = screen.getByText('⏹️ Stop Recording');
    
    // Stop recording
    fireEvent.click(stopButton);
    
    const newStartButton = screen.getByText('🎤 Start Recording');
    expect(newStartButton).toBeInTheDocument();
    expect(screen.queryByText('⏹️ Stop Recording')).not.toBeInTheDocument();
  });

  it('renders file upload input', () => {
    renderWithTheme(<App />);
    const fileInput = screen.getByLabelText(/Or upload audio files/);
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('accept', 'audio/*');
    expect(fileInput).toHaveAttribute('multiple');
  });

  it('renders processing status section', () => {
    renderWithTheme(<App />);
    const statusHeading = screen.getByText('Processing Status');
    expect(statusHeading).toBeInTheDocument();
    
    const statusMessage = screen.getByText('No files currently processing');
    expect(statusMessage).toBeInTheDocument();
  });

  it('renders footer with copyright', () => {
    renderWithTheme(<App />);
    const footer = screen.getByText(/© 2024 CritGenius Listener/);
    expect(footer).toBeInTheDocument();
  });
});

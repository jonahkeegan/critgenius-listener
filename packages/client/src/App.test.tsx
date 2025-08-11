/**
 * @fileoverview Tests for the main App component
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('renders the main heading', () => {
    render(<App />);
    const heading = screen.getByText('CritGenius Listener');
    expect(heading).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(<App />);
    const subtitle = screen.getByText('Real-time audio capture and processing');
    expect(subtitle).toBeInTheDocument();
  });

  it('displays the version number', () => {
    render(<App />);
    const versionElement = screen.getByText(/^v\d+\.\d+\.\d+/);
    expect(versionElement).toBeInTheDocument();
  });

  it('shows start recording button initially', () => {
    render(<App />);
    const startButton = screen.getByText('🎤 Start Recording');
    expect(startButton).toBeInTheDocument();
  });

  it('changes to stop recording button when recording starts', () => {
    render(<App />);
    const startButton = screen.getByText('🎤 Start Recording');
    
    fireEvent.click(startButton);
    
    const stopButton = screen.getByText('⏹️ Stop Recording');
    expect(stopButton).toBeInTheDocument();
    expect(screen.queryByText('🎤 Start Recording')).not.toBeInTheDocument();
  });

  it('returns to start recording button when recording stops', () => {
    render(<App />);
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
    render(<App />);
    const fileInput = screen.getByLabelText(/Or upload audio files/);
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('accept', 'audio/*');
    expect(fileInput).toHaveAttribute('multiple');
  });

  it('renders processing status section', () => {
    render(<App />);
    const statusHeading = screen.getByText('Processing Status');
    expect(statusHeading).toBeInTheDocument();
    
    const statusMessage = screen.getByText('No files currently processing');
    expect(statusMessage).toBeInTheDocument();
  });

  it('renders footer with copyright', () => {
    render(<App />);
    const footer = screen.getByText(/© 2024 CritGenius Listener/);
    expect(footer).toBeInTheDocument();
  });
});
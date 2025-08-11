/**
 * @fileoverview Main React component for CritGenius Listener
 * Provides the primary user interface for audio capture and processing
 */

import React, { useState } from 'react';
import { version } from '@critgenius/shared';
import './App.css';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAudioFiles(Array.from(files));
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    // TODO: Implement audio recording logic
    console.log('Starting audio recording...');
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // TODO: Implement stop recording and save logic
    console.log('Stopping audio recording...');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>CritGenius Listener</h1>
        <p>Real-time audio capture and processing</p>
        <span className="version">v{version}</span>
      </header>

      <main className="app-main">
        <section className="audio-capture">
          <h2>Audio Capture</h2>
          
          <div className="recording-controls">
            {!isRecording ? (
              <button 
                className="record-button start" 
                onClick={handleStartRecording}
              >
                🎤 Start Recording
              </button>
            ) : (
              <button 
                className="record-button stop" 
                onClick={handleStopRecording}
              >
                ⏹️ Stop Recording
              </button>
            )}
          </div>

          <div className="file-upload">
            <label htmlFor="audio-files">
              📁 Or upload audio files:
            </label>
            <input
              id="audio-files"
              type="file"
              multiple
              accept="audio/*"
              onChange={handleFileUpload}
            />
          </div>

          {audioFiles.length > 0 && (
            <div className="file-list">
              <h3>Selected Files:</h3>
              <ul>
                {audioFiles.map((file, index) => (
                  <li key={index}>
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="processing-status">
          <h2>Processing Status</h2>
          <p>No files currently processing</p>
          {/* TODO: Add real-time processing status */}
        </section>
      </main>

      <footer className="app-footer">
        <p>&copy; 2024 CritGenius Listener. Built with React + TypeScript.</p>
      </footer>
    </div>
  );
}

export default App;
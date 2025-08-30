/**
 * Requests permission to use the user's microphone.
 * @returns {Promise<boolean>} A promise that resolves to true if permission is granted, and false otherwise.
 */
export const requestMicrophonePermission = async (): Promise<boolean> => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error('getUserMedia not supported on this browser!');
    return false;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // We don't need to keep the stream, just to know we got it.
    // Stop the tracks to release the microphone.
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (err) {
    console.error('Error requesting microphone permission:', err);
    return false;
  }
};

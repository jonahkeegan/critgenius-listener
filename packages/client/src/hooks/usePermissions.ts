import { useState, useEffect, useCallback } from 'react';
import { requestMicrophonePermission } from '../services/audioService';

export type PermissionState = 'granted' | 'denied' | 'prompt';

export const usePermissions = () => {
  const [permissionState, setPermissionState] =
    useState<PermissionState>('prompt');

  useEffect(() => {
    const checkPermission = async () => {
      if (navigator.permissions) {
        try {
          // The type for PermissionName in TS lib doesn't include 'microphone' yet.
          const permissionStatus = await navigator.permissions.query({
            name: 'microphone' as PermissionName,
          });
          setPermissionState(permissionStatus.state);

          permissionStatus.onchange = () => {
            setPermissionState(permissionStatus.state);
          };
        } catch (error) {
          console.error('Error querying microphone permission:', error);
          // Fallback for browsers that might not support query for 'microphone'
          // The state will remain 'prompt'
        }
      }
    };

    checkPermission();
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const granted = await requestMicrophonePermission();
      // If the browser doesn't support navigator.permissions, we need to set the state manually.
      // Otherwise, the 'onchange' event will handle it.
      if (!navigator.permissions) {
        setPermissionState(granted ? 'granted' : 'denied');
      }
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      setPermissionState('denied');
    }
  }, []);

  return { permissionState, requestPermission };
};

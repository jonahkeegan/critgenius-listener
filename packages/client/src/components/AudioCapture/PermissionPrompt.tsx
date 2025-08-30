import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { Button, Typography, Paper, Link } from '@mui/material';

const BROWSER_GUIDES: { [key: string]: string } = {
  Chrome: 'https://support.google.com/chrome/answer/2693767',
  Firefox:
    'https://support.mozilla.org/en-US/kb/how-manage-your-camera-and-microphone-permissions',
  Safari: 'https://support.apple.com/guide/safari/websites-ibrwe2159f50/mac',
  Edge: 'https://support.microsoft.com/en-us/windows/manage-app-permissions-for-your-microphone-in-windows-10-ba0e505b-3993-35cf-5ea6-e26bdbd4474a',
};

const getBrowserName = () => {
  const agent = window.navigator.userAgent.toLowerCase();
  if (agent.includes('edge')) return 'Edge';
  if (agent.includes('chrome') && !agent.includes('edg')) return 'Chrome';
  if (agent.includes('firefox')) return 'Firefox';
  if (agent.includes('safari') && !agent.includes('chrome')) return 'Safari';
  return 'your browser';
};

export const PermissionPrompt: React.FC = () => {
  const { permissionState, requestPermission } = usePermissions();

  if (permissionState === 'granted') {
    return (
      <Paper elevation={3} style={{ padding: '2rem', textAlign: 'center' }}>
        <Typography variant='h5'>Permission Granted</Typography>
        <Typography>You can now start recording.</Typography>
      </Paper>
    );
  }

  if (permissionState === 'denied') {
    const browserName = getBrowserName();
    const guideUrl = BROWSER_GUIDES[browserName];

    return (
      <Paper elevation={3} style={{ padding: '2rem', textAlign: 'center' }}>
        <Typography variant='h5'>Permission Denied</Typography>
        <Typography>
          Microphone access was denied. Please enable it in your browser
          settings.
          {guideUrl && (
            <>
              {' '}
              <Link href={guideUrl} target='_blank' rel='noopener'>
                Click here for instructions on how to enable microphone access
                in {browserName}.
              </Link>
            </>
          )}
        </Typography>
        <Button
          variant='contained'
          color='primary'
          onClick={requestPermission}
          style={{ marginTop: '1rem' }}
        >
          Retry
        </Button>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} style={{ padding: '2rem', textAlign: 'center' }}>
      <Typography variant='h5'>Microphone Permission Required</Typography>
      <Typography>
        Please grant permission to use your microphone to continue.
      </Typography>
      <Button
        variant='contained'
        color='primary'
        onClick={requestPermission}
        style={{ marginTop: '1rem' }}
      >
        Grant Permission
      </Button>
    </Paper>
  );
};

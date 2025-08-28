// Valid a11y examples to ensure rules don't over-report
import React from 'react';

export const GoodImage: React.FC = () => (
  <figure>
    <img src='/logo.png' alt='Project logo' />
    <figcaption>Project logo</figcaption>
  </figure>
);

export const AccessibleButtonLike: React.FC = () => (
  <div
    role='button'
    tabIndex={0}
    onClick={() => console.log('activate')}
    onKeyDown={e => {
      if (e.key === 'Enter' || e.key === ' ') console.log('activate');
    }}
  >
    Activate
  </div>
);

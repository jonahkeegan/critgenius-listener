// Intentional a11y violations for ESLint regression testing
import React from 'react';

export const BadImage: React.FC = () => (
  <div>
    {/* Missing alt text */}
    <img src="/some/path.png" />
    {/* click handler without key events */}
    <div onClick={() => console.log('clicked')} role="button">Clickable</div>
  </div>
);

export const AutofocusInput: React.FC = () => (
  <form>
    {/* autofocus disallowed */}
    <input autoFocus />
  </form>
);

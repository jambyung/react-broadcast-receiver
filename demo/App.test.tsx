import { test, expect } from 'vitest';

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import App from './App';
import { BroadcastProvider } from '../lib/main';

test('demo renders', async () => {
  render(
    <BroadcastProvider>
      <App />
    </BroadcastProvider>,
  );

  expect(screen.getByRole('title')).toHaveTextContent(
    'React Broadcast Receiver',
  );
});

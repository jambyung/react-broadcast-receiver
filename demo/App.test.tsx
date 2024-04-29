import { test, expect } from 'vitest';

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import App from './App';
import { ReactBroadcastContextProvider } from '../lib/main';

test('demo renders', async () => {
  render(
    <ReactBroadcastContextProvider>
      <App />
    </ReactBroadcastContextProvider>,
  );

  expect(screen.getByRole('title')).toHaveTextContent(
    'React Broadcast Receiver',
  );
});

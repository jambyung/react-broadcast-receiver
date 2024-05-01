import { useState } from 'react';

import { getRandomActionName } from './utils/actionUtils';

import SendMessage from './SendMessage';
import Listener from './Listener';

import reactLogo from './assets/react.svg';
import logo from './assets/rbr.svg';

import './App.css';

export const TEST_ACTION = 'test';

function App() {
  const [randomActionNames] = useState(
    Array.from({ length: 100 }, () => getRandomActionName()),
  );

  const listeners = randomActionNames.map((name, i) => (
    <div key={i} style={{ padding: '1rem' }}>
      <Listener action={name} num={i} />
    </div>
  ));

  return (
    <>
      <div>
        <a href='https://react.dev' target='_blank' rel='noreferrer'>
          <img
            src={logo}
            className='logo react'
            alt='React BroadCast Receiver Logo'
          />
        </a>
        <a href='https://react.dev' target='_blank' rel='noreferrer'>
          <img src={reactLogo} className='logo react' alt='React logo' />
        </a>
      </div>
      <h1 role='title'>React Broadcast Receiver</h1>
      <p className='read-the-docs'>
        Trigger broadcast receiver in any component in the application with
        intent!
      </p>
      <div className='card'>
        <SendMessage />
      </div>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {listeners}
        </div>
      </div>
    </>
  );
}

export default App;

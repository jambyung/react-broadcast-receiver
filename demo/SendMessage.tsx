import { useCallback, useState } from 'react';
import { useBroadcast } from '../lib/main';

function SendMessage() {
  const [text, setText] = useState('');
  const [action, setAction] = useState('');

  const { sendBroadcast } = useBroadcast();

  const sendMessage = useCallback(() => {
    sendBroadcast({
      action: new RegExp(`^${action}`),
      payload: text,
    });
  }, [sendBroadcast, action, text]);

  return (
    <div>
      <h1>Send Message</h1>
      <p>SendMessage by clicking button</p>
      <label htmlFor='input-action' style={{ marginRight: 10 }}>
        Action:
      </label>
      <input
        id='input-action'
        style={{ height: 30, marginRight: 10 }}
        onChange={(e) => setAction(e.target.value)}
      />
      <label htmlFor='input-text' style={{ marginRight: 10 }}>
        Text:
      </label>
      <input
        id='input-text'
        style={{ height: 30, marginRight: 10 }}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={() => sendMessage()}>Send Message</button>
    </div>
  );
}

export default SendMessage;

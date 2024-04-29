import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ReactBroadcastContext } from '../lib/main';

function Listener({ action }: { action: string; num: number }) {
  const [text, setText] = useState('empty');
  const [triggered, setTriggered] = useState(false);

  const { registerBroadcastReceiver, removeBroadcastReceiver } = useContext(
    ReactBroadcastContext,
  );

  const broadcastReceiver = useCallback(
    (payload: unknown) => {
      setText(JSON.stringify(payload));
      setTriggered(true);
      setTimeout(() => setTriggered(false), 2000);
    },
    [setText, setTriggered],
  );

  // receiver id
  const receiverId = useRef<string | null>(null);
  useEffect(() => {
    receiverId.current = registerBroadcastReceiver({
      action,
      trigger: broadcastReceiver,
    });
  }, [registerBroadcastReceiver, action, broadcastReceiver]);

  // when broadcastReceiver changes, unregister the old one, and register the
  // new one since the reference to the function will always be the same if we don't change it
  useEffect(() => {
    if (receiverId.current) {
      removeBroadcastReceiver({ id: receiverId.current });
    }
    receiverId.current = registerBroadcastReceiver({
      action: action,
      trigger: broadcastReceiver,
    });
  }, [broadcastReceiver]);

  return (
    <div
      style={{
        width: '100%',
        padding: '5px',
        borderColor: triggered ? 'blue' : 'black',
        borderRadius: '15px',
        border: '2px solid black',
        boxShadow: '1px 1px 15px 5px rgba(0, 0, 0, 0.15)',
      }}
    >
      <h3 style={{ textWrap: 'nowrap' }}>Action: {action}</h3>
      <p>Text: {text}</p>
    </div>
  );
}

export default Listener;

import { useCallback, useState } from 'react';
import {
  BroadcastReceiver,
  BroadcastReceiverStatus,
  useRegisterReceiver,
} from '@lib/context/ReactBroadcastProvider';

function Listener({ action }: { action: string; num: number }) {
  const [text, setText] = useState('empty');
  const [triggered, setTriggered] = useState(false);
  const [status, setStatus] = useState<BroadcastReceiverStatus>({
    id: '',
    filter: {
      action: '',
    },
  });

  const receiver: BroadcastReceiver = useCallback(
    (payload: unknown, api, status) => {
      setText(JSON.stringify(payload));
      setTriggered(true);
      setTimeout(() => {
        setTriggered(false);

        // tell other receiver to remove this listener's animal
        api.sendBroadcast({ action: 'remove-animal', payload: action });
        setStatus(status);
        // api.unregisterReceiver({ id: status.id });
      }, 2000);
    },
    [setText, setTriggered, action],
  );

  const { uuid } = useRegisterReceiver(
    {
      action,
    },
    receiver,
  );

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
      <div className='text-box-container'>
        <div className='text-box'>
          <label>payload</label>
          <p>{text}</p>
        </div>
        {uuid && (
          <div className='text-box'>
            <label>UUID</label>
            <p>{uuid}</p>
          </div>
        )}
        {status && (
          <div className='text-box'>
            <label>Status</label>
            <p>{JSON.stringify(status)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Listener;

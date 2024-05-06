import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { uuidv4 } from '../utils/uuid';
import usePrevious from '../utils/usePrevious';

const DEBUG = false;

/**
 * Intent is what you send to reach listeners
 */
export interface Intent {
  action: string | RegExp;
  payload?: unknown;
}

/**
 * IntentFilter filters that will be used to filter intents
 */
export interface IntentFilter {
  /**
   * Action name
   */
  action: string;
}

export interface BroadcastReceiverStatus {
  id: string;
  filter: IntentFilter;
  // TODO: add more like below
  // status: 'active' | 'inactive';
}

/**
 * BroadcastReceiver
 *
 * This is function that receives
 *
 * @param {Intent} intent that were sent
 * @param {ReactBroadcastContextValue} api has all the hook values. Use this to resend / unregister filter / register new filter
 */
export type BroadcastReceiver = (
  intent: Intent,
  api: ReactBroadcastContextValue,
  status: BroadcastReceiverStatus,
) => void;

/**
 * BroadcastIntentResult
 *
 * Result of broadcastIntent()
 */
export type SendBroadcastResult = {
  /**
   * Number of intents filters that were triggered
   */
  count: number;
};

/**
 * BroadcastOptions
 *
 * Options for sending broadcast
 */
export type BroadcastOptions = {
  /**
   * When you send sticky intent, any newly registered receiver will be triggered right away
   */
  sticky: boolean;
};

/**
 * Returns intent history
 */
export type GetIntentHistory = () => Intent[];

/**
 * Send out intent
 *
 * @param {Intent} intent to send
 * @param {Partial<BroadcastIntentOptions>} options
 *
 * @returns {SendBroadcastResult} result of broadcasting
 */
export type SendBroadcast = (
  i: Intent,
  options?: Partial<BroadcastOptions>,
) => SendBroadcastResult;

/**
 * Function for broadcasting sticky intent
 *
 * @param {Intent} intent to send
 * @param {Partial<BroadcastIntentOptions>} options
 *
 * @returns {SendBroadcastResult} result of initial broadcasting
 */
export type SendStickyBroadcast = (
  i: Intent,
  options?: Partial<BroadcastOptions>,
) => SendBroadcastResult;

/**
 * filter that is passed to removeStickyBroadcast()
 *
 * NOTE: action is not passed since multiple sticky intent can have same action
 */
export type RemoveStickyBroadcastFilter = {
  /**
   * key of the stickyIntentMap
   */
  id: string;
};

/**
 * Remove Sticky Intent from the system
 *
 * @param {Intent} sticky intent to remove
 *
 * @returns intent removed?
 */
export type RemoveStickyBroadcast = (
  filter: RemoveStickyBroadcastFilter,
) => boolean;

/**
 * Register broadcast receiver
 *
 * @param {BroadcastReceiver} receiver that gets triggered
 * @param {IntentFilter} intentFilter that filters intents
 *
 * @returns {string} generated id. use this to remove receiver
 */
type RegisterReceiver = (
  receiver: BroadcastReceiver,
  it: IntentFilter,
) => string;

/**
 * Filter that is passed to unregisterReceiver()
 */
type UnregisterReceiverFilter = {
  /**
   * When this is passed, exact receiver will be removed
   */
  id: string;
  /**
   * When action is passed, all receivers under action will be removed
   */
  action: string;
};

/**
 * Unregister broadcast receiver
 *
 * @param {Partial<UnregisterReceiverFilter>} config
 */
type UnregisterReceiver = (filter: Partial<UnregisterReceiverFilter>) => void;

/**
 * IntentFilter with assigned id and receiver
 */
export interface FilterReceiverRecord {
  id: string;
  filter: IntentFilter;
  receiver: BroadcastReceiver;
}

interface ReactBroadcastContextValue {
  getIntentHistory: GetIntentHistory;
  registerReceiver: RegisterReceiver;
  unregisterReceiver: UnregisterReceiver;
  sendBroadcast: SendBroadcast;
  sendStickyBroadcast: SendStickyBroadcast;
  removeStickyBroadcast: RemoveStickyBroadcast;
}

const notImplemented = () => {
  throw new Error('Not implemented');
};

export const ReactBroadcastContext = createContext<ReactBroadcastContextValue>({
  getIntentHistory: notImplemented,
  registerReceiver: notImplemented,
  unregisterReceiver: notImplemented,
  sendBroadcast: notImplemented,
  sendStickyBroadcast: notImplemented,
  removeStickyBroadcast: notImplemented,
});

/**
 * Register broadcast receiver with intent filter
 */
export const useRegisterReceiver = (
  intentFilter: IntentFilter,
  receiver: BroadcastReceiver,
) => {
  const { registerReceiver, unregisterReceiver } = useContext(
    ReactBroadcastContext,
  );

  const uuid = useRef(registerReceiver!(receiver, intentFilter));

  const prevReceiver = usePrevious(receiver);
  useEffect(() => {
    if (!Object.is(receiver, prevReceiver)) {
      if (prevReceiver && uuid.current) {
        // if prevReceiver is not null
        unregisterReceiver({ id: uuid.current });
      }
      uuid.current = registerReceiver(receiver, intentFilter);
    }

    return () => {
      unregisterReceiver({ id: uuid.current });
    };
  }, [
    receiver,
    prevReceiver,
    intentFilter,
    registerReceiver,
    unregisterReceiver,
  ]);

  /**
   * Unregister receiver with registered id
   */
  const unregister = useCallback(() => {
    unregisterReceiver({ id: uuid.current });
  }, [unregisterReceiver]);

  return {
    uuid: uuid.current,
    unregister,
  };
};

/**
 * Hook to get all the api functions of broadcast receiver
 */
export const useBroadcast = () => {
  const {
    sendBroadcast,
    sendStickyBroadcast,
    removeStickyBroadcast,
    registerReceiver,
    unregisterReceiver,
  } = useContext(ReactBroadcastContext);

  return {
    sendBroadcast,
    sendStickyBroadcast,
    removeStickyBroadcast,
    registerReceiver,
    unregisterReceiver,
  };
};

interface ProviderProps {
  children: React.ReactNode;
}

export function ReactBroadcastContextProvider({ children }: ProviderProps) {
  const filterReceiverRecordMap = useRef(
    new Map<string, FilterReceiverRecord[]>(),
  );
  const stickyIntentMap = useRef(new Map<string, Intent>());
  const maxHistoryCount = useRef(10);
  // Intent History will contain intents that have been sent, or registered as sticky intent.
  const intentHistory = useRef(new Array<Intent>());

  const registerReceiver = useCallback(function (
    receiver: BroadcastReceiver,
    filter: IntentFilter,
  ) {
    const id: string = uuidv4();

    const recordList = filterReceiverRecordMap.current.get(filter.action) || [];

    const newRecord = { id, filter, receiver };

    filterReceiverRecordMap.current = filterReceiverRecordMap.current.set(
      filter.action,
      [...recordList, newRecord],
    );

    if (DEBUG) {
      console.log(`registerBroadcastReceiver: ${id}`);
    }

    return id;
  }, []);

  const unregisterReceiver: UnregisterReceiver = useCallback(function (
    config: Partial<UnregisterReceiverFilter>,
  ) {
    for (const key in filterReceiverRecordMap) {
      // key is action, and config has action
      if (config?.action === key) {
        filterReceiverRecordMap.current.delete(key);
        return;
      }

      if (config.id) {
        const records = filterReceiverRecordMap.current.get(key) || [];
        for (const record of records) {
          if (config.id === record.id) {
            filterReceiverRecordMap.current =
              filterReceiverRecordMap.current.set(record.filter.action, [
                ...records.filter((item) => item.id === config.id),
              ]);
          }
        }
      }
    }
  }, []);

  const removeStickyBroadcast = useCallback(function (
    filter: RemoveStickyBroadcastFilter,
  ) {
    if (filter.id) {
      return stickyIntentMap.current.delete(filter.id);
    }

    return false;
  }, []);

  let sendStickyBroadcast: SendStickyBroadcast | null = null;

  const addIntentHistory = useCallback((intent: Intent) => {
    const arr = intentHistory.current;

    if (arr.length >= maxHistoryCount.current) {
      for (let i = 0; i < arr.length - maxHistoryCount.current + 1; i++) {
        arr.shift();
      }
    }

    arr.push(intent);
  }, []);

  const getIntentHistory = useCallback(() => intentHistory.current, []);

  const sendBroadcast = useCallback(
    function (intent: Intent) {
      const functions: FilterReceiverRecord[] = [];
      if (intent.action instanceof RegExp) {
        for (const key of filterReceiverRecordMap.current.keys()) {
          if (intent.action.test(key)) {
            const records = filterReceiverRecordMap.current.get(key);
            if (records) {
              functions.push(...records);
            }
          }
        }
      } else {
        // just string
        const records = filterReceiverRecordMap.current.get(intent.action);
        if (records) {
          functions.push(...records);
        }
      }

      for (const record of functions) {
        record.receiver(intent, api, {
          id: record.id,
          filter: record.filter,
        });
      }

      addIntentHistory(intent);

      return {
        count: functions?.length || 0,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      filterReceiverRecordMap,
      sendStickyBroadcast,
      removeStickyBroadcast,
      registerReceiver,
      unregisterReceiver,
      addIntentHistory,
    ],
  );

  sendStickyBroadcast = useCallback(
    (intent: Intent) => {
      const result = sendBroadcast(intent);

      const id = uuidv4();

      stickyIntentMap.current = stickyIntentMap.current.set(id, intent);

      addIntentHistory(intent);

      return result;
    },
    [addIntentHistory, sendBroadcast],
  );

  const api: ReactBroadcastContextValue = useMemo(
    () => ({
      getIntentHistory,
      registerReceiver,
      unregisterReceiver,
      sendBroadcast,
      sendStickyBroadcast,
      removeStickyBroadcast,
    }),
    [
      getIntentHistory,
      registerReceiver,
      unregisterReceiver,
      sendBroadcast,
      sendStickyBroadcast,
      removeStickyBroadcast,
    ],
  );

  return (
    <ReactBroadcastContext.Provider value={api}>
      {children}
    </ReactBroadcastContext.Provider>
  );
}

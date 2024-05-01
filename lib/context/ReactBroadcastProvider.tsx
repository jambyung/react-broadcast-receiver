import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { uuidv4 } from '../utils/uuid';
import usePrevious from '../utils/usePrevious';

const DEBUG = false;

/**
 * Intent is what you send to reach listeners
 */
export interface Intent {
  action: string;
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
 */
export type RemoveStickyBroadcastFilter = {
  /**
   * uuid of the intent in the map
   */
  id: string;
  /**
   * TODO: action filter of the action
   */
  // action: ActionFilter,
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
 * @param {RemoveBroadcastReceiverActionConfig} config
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

/**
 * Initial reducer state
 */
const INITIAL_REDUCER_STATE = {
  filterReceiverRecordMap: new Map<string, FilterReceiverRecord[]>(),
  stickyIntentMap: new Map<string, Intent>(),
  maxHistoryCount: 10,
  intentHistory: [],
};

interface ProviderProps {
  children: React.ReactNode;
}

export function ReactBroadcastContextProvider({ children }: ProviderProps) {
  const [state, dispatch] = useReducer(broadcastReducer, INITIAL_REDUCER_STATE);

  const registerReceiver = useCallback(
    function (receiver: BroadcastReceiver, it: IntentFilter) {
      const id: string = uuidv4();

      dispatch({
        type: IntentActionKind.REGISTER_BROADCAST_RECEIVER,
        payload: {
          id,
          filter: it,
          receiver,
        },
      });

      if (DEBUG) {
        console.log(`registerBroadcastReceiver: ${id}`);
      }

      return id;
    },
    [dispatch],
  );

  const unregisterReceiver = useCallback(
    function (config: RemoveBroadcastReceiverActionConfig) {
      dispatch({
        type: IntentActionKind.REMOVE_BROADCAST_RECEIVER,
        payload: config,
      });
    },
    [dispatch],
  );

  const removeStickyBroadcast = useCallback(
    function (filter: RemoveStickyBroadcastFilter) {
      dispatch({
        type: IntentActionKind.REMOVE_BROADCAST_RECEIVER,
        payload: filter,
      });

      if (filter.id) {
        if (state.stickyIntentMap.get(filter.id)) return false;
      }

      return true;
    },
    [dispatch, state.stickyIntentMap],
  );

  let sendStickyBroadcast: SendStickyBroadcast | null = null;

  const sendBroadcast = useCallback(
    function (intent: Intent) {
      const records = state.filterReceiverRecordMap.get(intent.action);
      if (records) {
        for (const record of records) {
          record.receiver(intent, api, {
            id: record.id,
            filter: record.filter,
          });
        }
      }

      return {
        count: records?.length || 0,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      state.filterReceiverRecordMap,
      sendStickyBroadcast,
      removeStickyBroadcast,
      registerReceiver,
      unregisterReceiver,
    ],
  );

  sendStickyBroadcast = useCallback(
    (intent: Intent) => {
      const result = api.sendBroadcast!(intent);

      const id = uuidv4();

      // add intent to the reducer state
      dispatch({
        type: IntentActionKind.ADD_STICKY_INTENT,
        payload: {
          id,
          intent,
        },
      });

      return result;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sendBroadcast, dispatch],
  );

  const api: ReactBroadcastContextValue = useMemo(
    () => ({
      registerReceiver,
      unregisterReceiver,
      sendBroadcast,
      sendStickyBroadcast,
      removeStickyBroadcast,
    }),
    [
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

enum IntentActionKind {
  ADD_STICKY_INTENT = 'ADD_STICKY_INTENT',
  REMOVE_STICKY_INTENT = 'REMOVE_STICKY_INTENT',
  SEND_BROADCAST = 'SEND_BROADCAST',
  REGISTER_BROADCAST_RECEIVER = 'REGISTER_BROADCAST_RECEIVER',
  REMOVE_BROADCAST_RECEIVER = 'REMOVE_BROADCAST_RECEIVER',
}

interface AddStickyIntentAction {
  type: IntentActionKind.ADD_STICKY_INTENT;
  payload: {
    id: string;
    intent: Intent;
  };
}

interface RemoveStickyIntentAction {
  type: IntentActionKind.REMOVE_STICKY_INTENT;
  payload: RemoveStickyBroadcastFilter;
}

interface SendBroadcastAction {
  type: IntentActionKind.SEND_BROADCAST;
  payload: Intent;
}

interface RegisterBroadcastReceiverAction {
  type: IntentActionKind.REGISTER_BROADCAST_RECEIVER;
  payload: FilterReceiverRecord;
}

export interface RemoveBroadcastReceiverActionConfig {
  id?: string;
  action?: string;
}

interface RemoveBroadcastReceiverAction {
  type: IntentActionKind.REMOVE_BROADCAST_RECEIVER;
  payload: RemoveBroadcastReceiverActionConfig;
}

type BroadcastActions =
  | AddStickyIntentAction
  | RemoveStickyIntentAction
  | SendBroadcastAction
  | RegisterBroadcastReceiverAction
  | RemoveBroadcastReceiverAction;

export interface BroadcastState {
  /**
   * Map of intent filters and receivers
   *
   * @class {Map}
   * @key {string} action name
   * @value {FilterReceiverRecord[]}
   */
  filterReceiverRecordMap: Map<string, FilterReceiverRecord[]>;

  /**
   * Map for sticky intents
   *
   * @class {Map}
   * @key {string} uuid
   * @value {Intent} intent
   */
  stickyIntentMap: Map<string, Intent>;

  /**
   * Max number of intents to keep in the history
   */
  maxHistoryCount: number;

  /**
   * All of the intents that have been sent
   *
   * @value {Intent} intents
   */
  intentHistory: Intent[];
}

export function broadcastReducer(
  state: BroadcastState,
  action: BroadcastActions,
) {
  const { type, payload } = action;
  const {
    filterReceiverRecordMap: frrM,
    stickyIntentMap: siM,
    maxHistoryCount: mhC,
    intentHistory: iH,
  } = state;

  switch (type) {
    case IntentActionKind.ADD_STICKY_INTENT: {
      const { id, intent } = payload;

      return {
        ...state,
        stickyIntentMap: siM.set(id, intent),
      };
    }

    case IntentActionKind.REMOVE_STICKY_INTENT: {
      const { id } = payload;

      const newMap = new Map<string, Intent>(siM);
      newMap.delete(id);

      return {
        ...state,
        stickyIntentMap: newMap,
      };
    }

    case IntentActionKind.SEND_BROADCAST: {
      const newHistory = iH.length == mhC ? iH.slice(1) : [...iH];
      newHistory.push(payload);

      return {
        ...state,
        intentHistory: newHistory,
      };
    }

    case IntentActionKind.REGISTER_BROADCAST_RECEIVER: {
      const recordList = frrM.get(payload.filter.action) || [];

      const newRecord = payload;

      const newMap = frrM.set(payload.filter.action, [
        ...recordList,
        newRecord,
      ]);

      return {
        ...state,
        filterReceiverRecordMap: newMap,
      };
    }

    case IntentActionKind.REMOVE_BROADCAST_RECEIVER: {
      for (const key in frrM) {
        const records = frrM.get(key) || [];
        for (const record of records) {
          if (payload.action && payload.action !== record.filter.action) {
            continue;
          }

          if (payload.id && payload.id === record.id) {
            return {
              ...state,
              filterReceiverRecordMap: frrM.set(record.filter.action, [
                ...records.filter((item) => item.id === payload),
              ]),
            };
          }
        }
      }

      return state;
    }

    default:
      console.log('Not handled, action = ', action);
      return state;
  }
}

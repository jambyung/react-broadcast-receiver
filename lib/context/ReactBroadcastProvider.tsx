import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from 'react';
import { uuidv4 } from '../utils/uuid';

const DEBUG = false;

export interface Intent {
  action: string;
  payload?: unknown;
}

/**
 * IntentFilter
 */
export interface IntentFilter {
  /**
   * Action name
   */
  action: string;
  /**
   * Trigger Function that will be called.
   */
  trigger: IntentFilterFunction;
}

/**
 * IntentFilterFunction
 *
 * This is function that should be triggered
 *
 * @param {ReactBroadcastContextValue} api has all the hook values. Use this to resend / unregister filter / register new filter
 */
export type IntentFilterFunction = (
  payload: unknown,
  api: ReactBroadcastContextValue,
) => void;

/**
 * Function for broadcasting intent
 *
 * @param {Intent} intent value
 */
export type SendBroadcast = (i: Intent) => void;

/**
 * Register broadcast receiver
 *
 * @param {IntentFilter} intentFilter
 */
export type RegisterBroadcastReceiver = (it: IntentFilter) => string;

/**
 * Remove broadcast receiver
 *
 * @param {RemoveBroadcastReceiverActionConfig} config
 */
export type RemoveBroadcastReceiver = (
  config: RemoveBroadcastReceiverActionConfig,
) => void;

/**
 * IntentFilter with assigned id
 */
export interface IntentFilterWithId extends IntentFilter {
  id: string;
}

interface ReactBroadcastContextValue {
  registerBroadcastReceiver: RegisterBroadcastReceiver;
  removeBroadcastReceiver: RemoveBroadcastReceiver;
  sendBroadcast: SendBroadcast;
}

const notImplemented = () => {
  throw new Error('Not implemented');
};

export const ReactBroadcastContext = createContext<ReactBroadcastContextValue>({
  registerBroadcastReceiver: notImplemented,
  removeBroadcastReceiver: notImplemented,
  sendBroadcast: notImplemented,
});

export const useBroadcast = () => {
  const { registerBroadcastReceiver, removeBroadcastReceiver, sendBroadcast } =
    useContext(ReactBroadcastContext);

  return {
    registerBroadcastReceiver,
    removeBroadcastReceiver,
    sendBroadcast,
  };
};

const INITIAL_REDUCER_STATE = {
  intentFilterMap: new Map<string, IntentFilterWithId[]>(),
  intentHistory: [],
};

interface Props {
  children: React.ReactNode;
}

export function ReactBroadcastContextProvider({ children }: Props) {
  const [state, dispatch] = useReducer(broadcastReducer, INITIAL_REDUCER_STATE);

  const registerBroadcastReceiver = useCallback(
    function (it: IntentFilter) {
      const id: string = uuidv4();

      dispatch({
        type: IntentActionKind.REGISTER_BROADCAST_RECEIVER,
        payload: {
          uuid: id,
          intentFilter: it,
        },
      });

      if (DEBUG) {
        console.log(`registerBroadcastReceiver: ${id}`);
      }

      return id;
    },
    [dispatch],
  );

  const removeBroadcastReceiver = useCallback(
    function (config: RemoveBroadcastReceiverActionConfig) {
      dispatch({
        type: IntentActionKind.REMOVE_BROADCAST_RECEIVER,
        payload: config,
      });
    },
    [dispatch],
  );

  const sendBroadcast: SendBroadcast = useCallback(
    function ({ action, payload }: Intent) {
      const filters = state.intentFilterMap.get(action);
      if (filters) {
        for (const filter of filters) {
          filter.trigger(payload, {
            sendBroadcast,
            registerBroadcastReceiver,
            removeBroadcastReceiver,
          });
        }
      }
    },
    [state.intentFilterMap, registerBroadcastReceiver, removeBroadcastReceiver],
  );

  const contextValue = useMemo<ReactBroadcastContextValue>(() => {
    return {
      registerBroadcastReceiver,
      removeBroadcastReceiver,
      sendBroadcast,
    };
  }, [registerBroadcastReceiver, removeBroadcastReceiver, sendBroadcast]);

  return (
    <ReactBroadcastContext.Provider value={contextValue}>
      {children}
    </ReactBroadcastContext.Provider>
  );
}

enum IntentActionKind {
  SEND_BROADCAST = 'SEND_BROADCAST',
  REGISTER_BROADCAST_RECEIVER = 'REGISTER_BROADCAST_RECEIVER',
  REMOVE_BROADCAST_RECEIVER = 'REMOVE_BROADCAST_RECEIVER',
}

interface SendBroadcastAction {
  type: IntentActionKind.SEND_BROADCAST;
  payload: Intent;
}

interface RegisterBroadcastReceiverAction {
  type: IntentActionKind.REGISTER_BROADCAST_RECEIVER;
  payload: {
    uuid: string;
    intentFilter: IntentFilter;
  };
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
  | SendBroadcastAction
  | RegisterBroadcastReceiverAction
  | RemoveBroadcastReceiverAction;

export interface BroadcastState {
  intentFilterMap: Map<string, IntentFilterWithId[]>;
  intentHistory: Intent[];
}

export function broadcastReducer(
  state: BroadcastState,
  action: BroadcastActions,
) {
  const { type, payload } = action;

  switch (type) {
    case IntentActionKind.SEND_BROADCAST:
      if (payload && typeof payload === 'object') {
        return { ...state, intentHistory: [...state.intentHistory, payload] };
      } else {
        return state;
      }

    case IntentActionKind.REGISTER_BROADCAST_RECEIVER: {
      const filterList =
        state.intentFilterMap.get(payload.intentFilter.action) || [];

      const newIntentFilter = {
        ...payload.intentFilter,
        id: payload.uuid,
      };

      const newMap = state.intentFilterMap.set(newIntentFilter.action, [
        ...filterList,
        newIntentFilter,
      ]);

      return {
        ...state,
        intentFilterMap: newMap,
      };
    }

    case IntentActionKind.REMOVE_BROADCAST_RECEIVER: {
      for (const key in state.intentFilterMap) {
        const filters = state.intentFilterMap.get(key) || [];
        for (const filter of filters) {
          if (payload.action && payload.action !== filter.action) {
            continue;
          }

          if (payload.id && payload.id === filter.id) {
            return {
              ...state,
              intentFilterMap: state.intentFilterMap.set(filter.action, [
                ...filters.filter((item) => item.id === payload),
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

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";
import { v4 as uuid } from "uuid";

const DEBUG = true;

export interface Intent {
  action: string;
  payload?: any;
}

export interface IntentFilter {
  action: string;
  f: Function;
}

export interface IntentFilterWithId {
  id: string;
  action: string;
  f: Function;
}

interface ReactBroadcastContextValue {
  registerBroadcastReceiver: (it: IntentFilter) => string;
  removeBroadcastReceiver: (
    config: RemoveBroadcastReceiverActionConfig,
  ) => void;
  sendBroadcast: (i: Intent) => void;
}

const notImplemented = () => {
  throw new Error("Not implemented");
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
  children: JSX.Element;
}

export function ReactBroadcastContextProvider({ children }: Props) {
  const [state, dispatch] = useReducer(broadcastReducer, INITIAL_REDUCER_STATE);

  const sendBroadcast = useCallback(function ({ action, payload }: Intent) {
    const filters = state.intentFilterMap.get(action);
    if (filters) {
      for (const filter of filters) {
        filter.f(payload);
      }
    }
  }, []);

  const registerBroadcastReceiver = useCallback(
    function (it: IntentFilter) {
      const id: string = uuid();

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
    [state.intentFilterMap],
  );

  const removeBroadcastReceiver = useCallback(
    function (config: RemoveBroadcastReceiverActionConfig) {
      dispatch({
        type: IntentActionKind.REMOVE_BROADCAST_RECEIVER,
        payload: config,
      });
    },
    [state.intentFilterMap],
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
  SEND_BROADCAST = "SEND_BROADCAST",
  REGISTER_BROADCAST_RECEIVER = "REGISTER_BROADCAST_RECEIVER",
  REMOVE_BROADCAST_RECEIVER = "REMOVE_BROADCAST_RECEIVER",
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

function broadcastReducer(state: BroadcastState, action: BroadcastActions) {
  const { type, payload } = action;

  switch (type) {
    case IntentActionKind.SEND_BROADCAST:
      if (payload && typeof payload === "object") {
        return { ...state, intentHistory: [...state.intentHistory, payload] };
      } else {
        return state;
      }

    case IntentActionKind.REGISTER_BROADCAST_RECEIVER:
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

    case IntentActionKind.REMOVE_BROADCAST_RECEIVER:
      // not implemented yet
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

    default:
      console.log("Not handled, action = ", action);
      return state;
  }
}

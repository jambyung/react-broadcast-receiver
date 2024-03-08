import { useCallback, useContext, useEffect, useRef, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { ReactBroadcastContext } from "../lib/main";
import SendMessage from "./SendMessage";
import Listener from "./Listener";

export const TEST_ACTION = "test";

function App() {
  const [count, setCount] = useState(0);

  const { registerBroadcastReceiver, removeBroadcastReceiver } = useContext(
    ReactBroadcastContext,
  );

  const broadcastReceiver = useCallback(() => {
    setCount(count + 1);
  }, [count, setCount]);

  const receiverId = useRef<string | null>(null);

  // when broadcastReceiver changes, unregister the old one, and register the
  // new one since the reference to the function will always be the same if we don't change it
  useEffect(() => {
    if (receiverId.current) {
      removeBroadcastReceiver({ id: receiverId.current });
    }
    receiverId.current = registerBroadcastReceiver({
      action: TEST_ACTION,
      f: broadcastReceiver,
    });
  }, [broadcastReceiver]);

  const renderListener = () => {
    const elementArr = [];
    for (let i = 0; i < 100; i++) {
      elementArr.push(
        <div key={i} style={{ padding: "1rem" }}>
          <Listener action={TEST_ACTION} num={i} />
        </div>,
      );
    }

    return elementArr;
  };

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
        <SendMessage />
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)" }}
        >
          {renderListener()}
        </div>
      </div>
    </>
  );
}

export default App;

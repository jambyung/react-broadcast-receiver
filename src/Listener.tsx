import { useCallback, useContext, useEffect, useState } from "react";
import { ReactBroadcastContext } from "../lib/main";

function Listener({ action, num }: { action: string; num: number }) {
  const [text, setText] = useState("empty");
  const { registerBroadcastReceiver } = useContext(ReactBroadcastContext);

  const broadcastReceiver = useCallback(
    (payload: any) => {
      setText(JSON.stringify(payload));
    },
    [setText],
  );

  useEffect(() => {
    registerBroadcastReceiver({
      action,
      f: broadcastReceiver,
    });
  }, []);

  return (
    <div
      style={{
        width: "100%",
        padding: "5px",
        borderRadius: "15px",
        border: "1px solid black",
        boxShadow: "1px 1px 15px 5px rgba(0, 0, 0, 0.15)",
      }}
    >
      <h3 style={{ textWrap: "nowrap" }}>Listener: {num}</h3>
      <p>{text}</p>
    </div>
  );
}

export default Listener;

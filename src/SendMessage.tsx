import { useCallback, useContext, useState } from "react";
import { ReactBroadcastContext } from "../lib/main";

function SendMessage() {
  const [text, setText] = useState("");
  const { sendBroadcast } = useContext(ReactBroadcastContext);

  const sendMessage = useCallback(
    (text: string) => {
      sendBroadcast({
        action: "test",
        payload: text,
      });
    },
    [sendBroadcast],
  );

  return (
    <div>
      <h1>Send Message</h1>
      <p>SendMessage by clicking button</p>
      <input
        style={{ height: 30, marginRight: 10 }}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={() => sendMessage(text)}>Send Message</button>
    </div>
  );
}

export default SendMessage;

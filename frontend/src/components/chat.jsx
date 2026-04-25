import { useState } from "react";
import axios from "axios";

export default function Chat({ text }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  async function send() {
    const res = await axios.post("/api/chat", {
      question: input,
      text
    });

    setMessages([
      ...messages,
      { user: input, bot: res.data.answer }
    ]);

    setInput("");
  }

  return (
    <div>
      <h2>AI Chat</h2>

      {messages.map((m, i) => (
        <div key={i}>
          <p><b>You:</b> {m.user}</p>
          <p><b>AI:</b> {m.bot}</p>
        </div>
      ))}

      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={send}>Send</button>
    </div>
  );
}

console.log("API URL:", import.meta.env.VITE_API_URL);
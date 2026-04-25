import { useState } from "react";
import FileUpload, { FileInfoBar } from "./components/FileUpload";
import Summary from "./components/Summary";
import Quiz from "./components/Quiz";
import Chat from "./components/Chat";

// active panel: null | 'summary' | 'quiz' | 'chat'
export default function App() {
  const [fileData, setFileData] = useState(null); // { filename, text, word_count, char_count, size }
  const [panel, setPanel] = useState(null);
  const [error, setError] = useState(null);

  function handleFileReady(data) {
    setFileData(data);
    setPanel(null);
    setError(null);
  }

  function handleClear() {
    setFileData(null);
    setPanel(null);
    setError(null);
  }

  function switchPanel(name) {
    setPanel((prev) => (prev === name ? null : name));
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-brand">
          <div className="header-icon">📓</div>
          <div>
            <div className="header-title">Notebook LLM</div>
            <div className="header-subtitle">
              Upload · Summarize · Quiz · Chat
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        <p>API: {import.meta.env.VITE_API_URL}</p>
        {/* Error from upload */}
        {error && (
          <div className="error-box" style={{ marginBottom: "1.5rem" }}>
            ⚠️ {error}
          </div>
        )}

        {!fileData ? (
          /* ── Upload state ── */
          <FileUpload onFileReady={handleFileReady} onError={setError} />
        ) : (
          /* ── Ready state ── */
          <>
            <FileInfoBar file={fileData} onClear={handleClear} />

            {/* Action cards */}
            <div className="actions">
              {/* Summarize */}
              <button
                className={`action-card summarize ${panel === "summary" ? "active" : ""}`}
                onClick={() => switchPanel("summary")}
              >
                <span className="action-card-icon">📋</span>
                <div className="action-card-text">
                  <h3>Summarize</h3>
                  <p>Get a structured overview with key points</p>
                </div>
              </button>

              {/* Quiz */}
              <button
                className={`action-card quiz ${panel === "quiz" ? "active" : ""}`}
                onClick={() => switchPanel("quiz")}
              >
                <span className="action-card-icon">🎯</span>
                <div className="action-card-text">
                  <h3>Generate Quiz</h3>
                  <p>Test your understanding with MCQ questions</p>
                </div>
              </button>

              {/* Chat */}
              <button
                className={`action-card chat ${panel === "chat" ? "active" : ""}`}
                onClick={() => switchPanel("chat")}
              >
                <span className="action-card-icon">💬</span>
                <div className="action-card-text">
                  <h3>Chat</h3>
                  <p>Ask questions from your document</p>
                </div>
              </button>
            </div>

            {/* Panels */}
            {panel === "summary" && (
              <Summary key={fileData.filename} text={fileData.text} />
            )}

            {panel === "quiz" && (
              <Quiz key={fileData.filename} text={fileData.text} />
            )}

            {panel === "chat" && <Chat text={fileData.text} />}
          </>
        )}
      </main>
    </div>
  );
}

console.log("API URL:", import.meta.env.VITE_API_URL);
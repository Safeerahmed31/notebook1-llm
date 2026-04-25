import { useState } from 'react'
import axios from 'axios'

function scoreMessage(score, total) {
  const pct = score / total
  if (pct === 1)    return '🏆 Perfect score! Outstanding!'
  if (pct >= 0.8)   return '🎉 Excellent work!'
  if (pct >= 0.6)   return '👍 Good job — keep it up!'
  if (pct >= 0.4)   return '📚 Keep studying — you\'ll get there!'
  return '💪 Review the material and try again!'
}

function QuestionCard({ q, index, answered, onAnswer }) {
  const { question, options, answer, explanation } = q
  const selected = answered?.selected
  const revealed = answered !== undefined

  return (
    <div className="question-card">
      <div className="question-num">Question {index + 1}</div>
      <div className="question-text">{question}</div>
      <div className="options">
        {options.map(opt => {
          const letter = opt[0]  // "A", "B", "C", "D"
          let cls = 'option'
          if (revealed) {
            if (letter === answer)   cls += ' correct'
            else if (letter === selected) cls += ' wrong'
          } else if (letter === selected) {
            cls += ' selected'
          }
          return (
            <button
              key={letter}
              className={cls}
              disabled={revealed}
              onClick={() => !revealed && onAnswer(index, letter)}
            >
              <span className="option-letter">{letter}</span>
              <span className="option-text">{opt.slice(3)}</span>
            </button>
          )
        })}
      </div>
      {revealed && explanation && (
        <div className="explanation">
          💡 {explanation}
        </div>
      )}
    </div>
  )
}

export default function Quiz({ text }) {
  const [numQ,      setNumQ]     = useState(5)
  const [questions, setQuestions] = useState([])
  const [answers,   setAnswers]   = useState({})  // { [index]: { selected } }
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [submitted, setSubmitted] = useState(false)

  async function fetchQuiz() {
    setLoading(true)
    setError(null)
    setAnswers({})
    setSubmitted(false)
    try {
      const { data } = await axios.post('/api/quiz', { text, num_questions: numQ })
      setQuestions(data.questions)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate quiz.')
    } finally {
      setLoading(false)
    }
  }

  function handleAnswer(index, letter) {
    setAnswers(prev => ({ ...prev, [index]: { selected: letter } }))
  }

  function handleSubmit() {
    // Fill unanswered questions with null
    const filled = { ...answers }
    questions.forEach((_, i) => {
      if (!filled[i]) filled[i] = { selected: null }
    })
    setAnswers(filled)
    setSubmitted(true)
  }

  const answeredCount = Object.keys(answers).length
  const allAnswered   = answeredCount === questions.length && questions.length > 0

  const score = submitted
    ? questions.filter((q, i) => answers[i]?.selected === q.answer).length
    : null

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-header-icon">🎯</span>
        <h2>Quiz</h2>
      </div>
      <div className="panel-body">

        {/* Controls */}
        {!loading && (
          <div className="quiz-controls">
            <label htmlFor="numQ">Questions:</label>
            <select
              id="numQ"
              value={numQ}
              onChange={e => setNumQ(Number(e.target.value))}
              disabled={questions.length > 0}
            >
              {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <button
              className="btn btn-navy"
              onClick={fetchQuiz}
            >
              {questions.length ? '🔄 New Quiz' : '⚡ Generate Quiz'}
            </button>
          </div>
        )}

        {/* Error */}
        {error && <div className="error-box">⚠️ {error}</div>}

        {/* Loading */}
        {loading && (
          <div className="loading">
            <div className="spinner" />
            Generating {numQ} questions…
          </div>
        )}

        {/* Score banner */}
        {submitted && score !== null && (
          <div className="score-banner">
            <div className="score-num">{score}/{questions.length}</div>
            <div className="score-label">Score</div>
            <div className="score-msg">{scoreMessage(score, questions.length)}</div>
          </div>
        )}

        {/* Questions */}
        {questions.map((q, i) => (
          <QuestionCard
            key={i}
            index={i}
            q={q}
            answered={submitted ? (answers[i] || { selected: null }) : answers[i]}
            onAnswer={handleAnswer}
          />
        ))}

        {/* Submit / Retry */}
        {questions.length > 0 && !submitted && (
          <div className="flex-end mt-2">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: 'auto' }}>
              {answeredCount}/{questions.length} answered
            </span>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!allAnswered}
            >
              Submit Answers ✓
            </button>
          </div>
        )}

        {submitted && (
          <div className="flex-end mt-2">
            <button className="btn btn-outline" onClick={fetchQuiz}>
              Try Again
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

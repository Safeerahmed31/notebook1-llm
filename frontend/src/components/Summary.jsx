import { useState } from 'react'
import axios from 'axios'

export default function Summary({ text }) {
  const [summary,  setSummary]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [fetched,  setFetched]  = useState(false)

  async function fetchSummary() {
    if (fetched) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await axios.post('/api/summarize', { text })
      setSummary(data.summary)
      setFetched(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate summary.')
    } finally {
      setLoading(false)
    }
  }

  // Trigger on first render of this component
  if (!fetched && !loading && !error) fetchSummary()

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-header-icon">📋</span>
        <h2>Summary</h2>
      </div>
      <div className="panel-body">
        {loading && (
          <div className="loading">
            <div className="spinner" />
            Generating summary…
          </div>
        )}
        {error && (
          <div className="error-box">⚠️ {error}</div>
        )}
        {summary && (
          <p className="summary-text">{summary}</p>
        )}
      </div>
    </div>
  )
}

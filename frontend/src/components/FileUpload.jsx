import { useRef, useState } from 'react'
import axios from 'axios'

const FILE_ICONS = {
  pdf: '📄', docx: '📝', pptx: '📊',
  jpg: '🖼️', jpeg: '🖼️', png: '🖼️',
  txt: '📃', md: '📃',
}

function getIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase()
  return FILE_ICONS[ext] || '📁'
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FileUpload({ onFileReady, onError }) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading]   = useState(false)
  const inputRef = useRef()

  async function processFile(file) {
    setLoading(true)
    onError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await axios.post('/api/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onFileReady({ ...data, size: file.size })
    } catch (err) {
      const msg = err.response?.data?.detail || 'Upload failed. Please try again.'
      onError(msg)
    } finally {
      setLoading(false)
    }
  }

  function handleFiles(files) {
    if (files.length) processFile(files[0])
  }

  return (
    <div>
      <div className="upload-hero">
        <h1>Your AI Study Companion</h1>
        <p>Upload any document — get an instant summary and quiz questions</p>
      </div>

      <div
        className={`upload-zone ${dragging ? 'drag-over' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => !loading && inputRef.current.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.pptx,.jpg,.jpeg,.png,.txt,.md"
          onChange={e => handleFiles(e.target.files)}
          style={{ display: 'none' }}
        />

        {loading ? (
          <>
            <span className="upload-icon">⏳</span>
            <h3>Extracting text…</h3>
            <p>This may take a moment for large files</p>
          </>
        ) : (
          <>
            <span className="upload-icon">📂</span>
            <h3>Drop your file here, or click to browse</h3>
            <p>Supports PDF, Word, PowerPoint, Images, and plain text</p>
            <div className="file-types">
              {['.pdf', '.docx', '.pptx', '.jpg/.png', '.txt', '.md'].map(t => (
                <span key={t} className="badge">{t}</span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function FileInfoBar({ file, onClear }) {
  return (
    <div className="file-info">
      <div className="file-info-icon">{getIcon(file.filename)}</div>
      <div className="file-info-details">
        <div className="file-info-name">{file.filename}</div>
        <div className="file-info-meta">
          {file.word_count.toLocaleString()} words · {file.char_count.toLocaleString()} characters
          {file.size ? ` · ${formatSize(file.size)}` : ''}
        </div>
      </div>
      <button className="btn-ghost" onClick={onClear} title="Remove file">✕</button>
    </div>
  )
}

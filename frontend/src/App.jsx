import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { jsPDF } from 'jspdf'
import './App.css'

const BACKEND_URL = 'http://localhost:8000'

/* ═══════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════ */

/* ── Animated SVG Score Circle ── */
function ScoreCircle({ score }) {
  const radius = 45
  const circ = 2 * Math.PI * radius  // ≈ 283
  const pct = Math.max(0, Math.min(100, score))
  const offset = circ - (pct / 100) * circ
  const tier = score >= 75 ? 'green' : score >= 50 ? 'amber' : 'red'
  const numColor = tier === 'green' ? '#34d399' : tier === 'amber' ? '#fbbf24' : '#f87171'

  return (
    <div className="score-circle-wrap">
      <svg
        className="score-circle-svg"
        width="110" height="110"
        viewBox="0 0 110 110"
        style={{ '--target-offset': offset }}
      >
        <defs>
          <linearGradient id="grad-green" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <linearGradient id="grad-amber" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="grad-red" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#f87171" />
          </linearGradient>
        </defs>

        <circle
          className="score-circle-bg"
          cx="55" cy="55"
          r={radius}
        />
        <circle
          className={`score-circle-track ${tier}`}
          cx="55" cy="55"
          r={radius}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ '--target-offset': offset }}
        />
        <text
          className="score-circle-num"
          x="55" y="51"
          fill={numColor}
        >
          {score}
        </text>
        <text
          className="score-circle-label"
          x="55" y="68"
        >
          / 100
        </text>
      </svg>
      <p className="score-caption">
        {score >= 75 && '✨ Excellent match — ready to apply'}
        {score >= 50 && score < 75 && '👍 Good match — consider improvements below'}
        {score < 50 && '⚠️ Needs work — apply suggested changes'}
      </p>
    </div>
  )
}

/* ── Chip Tag ── */
function ChipTag({ label, type }) {
  return <span className={`chip ${type}`}>{label}</span>
}

/* ── Skeleton Loader ── */
function SkeletonLoader() {
  return (
    <div className="riq-skeleton-wrap">
      <div className="skeleton-circle" />
      <div className="skeleton-line" style={{ width: '60%', margin: '0 auto 20px' }} />
      <div className="skeleton-line" style={{ width: '90%' }} />
      <div className="skeleton-line" style={{ width: '75%' }} />
      <div className="skeleton-line" style={{ width: '85%', marginBottom: '24px' }} />
      <div className="skeleton-block" />
    </div>
  )
}

/* ── ATS Result Card (compare mode) ── */
function ATSResultCard({ data, title, isWinner }) {
  return (
    <div className={`compare-card ${isWinner ? 'winner' : ''}`}>
      {isWinner && <div className="winner-banner">🏆 Better Fit</div>}
      <p className="compare-result-title">{title}</p>
      <ScoreCircle score={data.ats_score} />

      {data.top_matches?.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <p className="riq-section-heading" style={{ fontSize: '13px' }}>
            ✅ Strengths
          </p>
          <div className="chip-tags">
            {data.top_matches.map((m, i) => <ChipTag key={i} label={m} type="match" />)}
          </div>
        </div>
      )}

      {data.missing_keywords?.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <p className="riq-section-heading" style={{ fontSize: '13px' }}>
            ⚠️ Missing
          </p>
          <div className="chip-tags">
            {data.missing_keywords.map((m, i) => <ChipTag key={i} label={m} type="missing" />)}
          </div>
        </div>
      )}

      {data.rewritten_bullets?.length > 0 && (
        <div>
          <p className="riq-section-heading" style={{ fontSize: '13px' }}>
            💡 Suggested Bullets
          </p>
          <ul className="riq-bullets">
            {data.rewritten_bullets.map((b, i) => (
              <li key={i} className="riq-bullet-item" style={{ animationDelay: `${i * 0.06}s` }}>
                <span className="riq-bullet-num">{i + 1}.</span>{b}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ── Salary Section ── */
function SalarySection({ salaryResults }) {
  if (!salaryResults) return null

  const min = salaryResults.min_salary_lpa ?? 0
  const max = salaryResults.max_salary_lpa ?? 1
  const median = salaryResults.median_salary_lpa ?? 0
  const range = max - min || 1
  const pct = Math.max(4, Math.min(96, ((median - min) / range) * 100))

  const confLevel = (salaryResults.confidence || '').toLowerCase()
  const confClass = ['high', 'medium', 'low'].includes(confLevel) ? confLevel : 'medium'

  return (
    <div className="salary-section">
      <hr className="riq-divider" />

      <div className="salary-header">
        <h3 className="salary-title">💼 Salary Prediction</h3>
        {salaryResults.confidence && (
          <span className={`conf-badge ${confClass}`}>
            {salaryResults.confidence} Confidence
          </span>
        )}
      </div>

      {/* Gauge */}
      <div className="salary-gauge-wrap">
        <div className="salary-extremes" style={{ marginBottom: '4px' }}>
          <span className="salary-extreme-label">
            <span>Min</span>
          </span>
          <span className="salary-extreme-label" style={{ alignItems: 'center' }}>
            <span>Median</span>
          </span>
          <span className="salary-extreme-label">
            <span>Max</span>
          </span>
        </div>

        <div className="salary-track">
          {/* median marker */}
          <div className="salary-marker" style={{ left: `${pct}%` }}>
            <div className="salary-marker-bubble">{median} LPA</div>
            <div className="salary-marker-line" />
            <div className="salary-marker-dot" />
          </div>
        </div>

        <div className="salary-extremes">
          <span className="salary-extreme-label">
            <span className="salary-extreme-val">{min} LPA</span>
          </span>
          <span className="salary-extreme-label" style={{ alignItems: 'center' }}>
            <span className="salary-extreme-val" style={{ color: '#c4b5fd' }}>{median} LPA</span>
          </span>
          <span className="salary-extreme-label">
            <span className="salary-extreme-val">{max} LPA</span>
          </span>
        </div>
      </div>

      {/* Profile Tags */}
      <h4 className="riq-section-heading" style={{ fontSize: '14px' }}>🔍 Profile Analysis</h4>
      <div className="salary-tags" style={{ marginBottom: '20px' }}>
        {salaryResults.extracted_role && (
          <span className="salary-tag role">💼 {salaryResults.extracted_role}</span>
        )}
        {salaryResults.years_of_experience !== undefined && (
          <span className="salary-tag exp">⏳ {salaryResults.years_of_experience} Yrs Exp</span>
        )}
        {salaryResults.college_tier && (
          <span className="salary-tag college">🎓 {salaryResults.college_tier}</span>
        )}
        {salaryResults.tech_stack?.map((t, i) => (
          <span key={i} className="salary-tag tech">🛠️ {t}</span>
        ))}
      </div>

      {/* Reasoning & Negotiation */}
      {salaryResults.reasoning && (
        <div className="riq-infobox reasoning">
          <strong>Market Reasoning:</strong> {salaryResults.reasoning}
        </div>
      )}
      {salaryResults.negotiation_tip && (
        <div className="riq-infobox negotiation">
          <strong>💡 Negotiation Tip:</strong> {salaryResults.negotiation_tip}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════ */
export default function App() {
  const [pdfFile, setPdfFile] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [jobDescription2, setJobDescription2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)
  const [salaryResults, setSalaryResults] = useState(null)
  const [compareMode, setCompareMode] = useState(false)
  const [compareResults, setCompareResults] = useState(null)

  const fileInputRef = useRef(null)

  const resetAll = () => {
    setResults(null); setSalaryResults(null)
    setCompareResults(null); setPdfFile(null)
    setJobDescription(''); setJobDescription2('')
    setError(null); setCompareMode(false)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported'); setPdfFile(null)
      e.target.value = ''; return
    }
    setPdfFile(file); setError(null)
  }

  const handleSubmit = async () => {
    if (!pdfFile) { setError('Please upload a resume PDF'); return }
    if (!jobDescription.trim()) { setError('Please enter a job description'); return }
    if (compareMode && !jobDescription2.trim()) {
      setError('Please enter the second job description for comparison'); return
    }

    setLoading(true); setError(null)
    setResults(null); setSalaryResults(null); setCompareResults(null)

    try {
      const formData = new FormData()
      formData.append('file', pdfFile)
      const parseRes = await axios.post(`${BACKEND_URL}/parse-resume`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (parseRes.data.status === 'error') throw new Error(parseRes.data.message || 'Failed to parse resume')
      const resumeText = parseRes.data.text || parseRes.data.text_preview
      if (!resumeText) throw new Error('Failed to extract resume text')

      if (compareMode) {
        const [compareRes, salaryRes] = await Promise.all([
          axios.post(`${BACKEND_URL}/compare-jd`, {
            resume_text: resumeText,
            job_description_1: jobDescription,
            job_description_2: jobDescription2
          }),
          axios.post(`${BACKEND_URL}/predict-salary`, { resume_text: resumeText })
        ])
        if (compareRes.data.status === 'success') setCompareResults(compareRes.data.data)
        else throw new Error(compareRes.data.message || 'Comparison failed')
        if (salaryRes.data?.status !== 'error') setSalaryResults(salaryRes.data)
      } else {
        const [analyzeRes, salaryRes] = await Promise.all([
          axios.post(`${BACKEND_URL}/analyze`, {
            resume_text: resumeText,
            job_description: jobDescription
          }),
          axios.post(`${BACKEND_URL}/predict-salary`, { resume_text: resumeText })
        ])
        if (analyzeRes.data.status === 'success') setResults(analyzeRes.data.data)
        else throw new Error(analyzeRes.data.message || 'Analysis failed')
        if (salaryRes.data?.status !== 'error') setSalaryResults(salaryRes.data)
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Something went wrong, try again'
      setError(errMsg)
    } finally {
      setLoading(false)
    }
  }

  /* ── PDF Export ── */
  const handleDownloadPDF = () => {
    const doc = new jsPDF()
    const margin = 15
    let y = margin

    const addText = (text, fontSize = 12, isBold = false, color = [225, 220, 255]) => {
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', isBold ? 'bold' : 'normal')
      doc.setTextColor(...color)
      const lines = doc.splitTextToSize(text, 180)
      lines.forEach((line) => {
        if (y > 275) { doc.addPage(); y = margin }
        doc.text(line, margin, y)
        y += fontSize * 0.45
      })
      y += 3
    }

    addText('ResumeIQ — Resume Improvement Tips', 18, true, [138, 92, 246])
    y += 5
    if (results) {
      addText(`ATS Match Score: ${results.ats_score}/100`, 14, true)
      y += 2
      if (results.missing_keywords?.length > 0) {
        addText('Missing Keywords (Add These!):', 13, true, [239, 68, 68])
        results.missing_keywords.forEach(kw => addText(`  • ${kw}`, 11))
        y += 2
      }
      if (results.top_matches?.length > 0) {
        addText('Your Strengths:', 13, true, [16, 185, 129])
        results.top_matches.forEach(m => addText(`  • ${m}`, 11))
        y += 2
      }
      if (results.rewritten_bullets?.length > 0) {
        addText('Suggested Resume Bullets:', 13, true, [138, 92, 246])
        results.rewritten_bullets.forEach((b, i) => addText(`  ${i + 1}. ${b}`, 11))
        y += 2
      }
    }
    if (salaryResults) {
      addText('Salary Prediction:', 14, true, [138, 92, 246])
      addText(`Role: ${salaryResults.extracted_role || 'N/A'}`, 11)
      addText(`Experience: ${salaryResults.years_of_experience || 0} years`, 11)
      addText(`Range: ${salaryResults.min_salary_lpa} – ${salaryResults.median_salary_lpa} – ${salaryResults.max_salary_lpa} LPA`, 11)
      if (salaryResults.negotiation_tip) {
        addText(`Negotiation Tip: ${salaryResults.negotiation_tip}`, 11, false, [196, 181, 253])
      }
    }
    doc.save('ResumeIQ_Tips.pdf')
  }

  const hasResults = results || compareResults

  /* ── Compare winner calc ── */
  const winner = compareResults?.jd1 && compareResults?.jd2
    ? compareResults.jd1.ats_score > compareResults.jd2.ats_score
      ? 'jd1'
      : compareResults.jd2.ats_score > compareResults.jd1.ats_score
        ? 'jd2'
        : 'tie'
    : null

  return (
    <div className="riq-page">

      {/* Decorative corner star */}
      <svg className="riq-star" viewBox="0 0 40 40" fill="none">
        <path d="M20 2 L22.4 16.4 L36 20 L22.4 23.6 L20 38 L17.6 23.6 L4 20 L17.6 16.4 Z"
          fill="white" />
      </svg>

      <div className="riq-wrapper">

        {/* ── Header ── */}
        <header className="riq-header">
          <h1 className="riq-title">ResumeIQ AI Analyzer</h1>
          <p className="riq-subtitle">
            {hasResults
              ? 'Your AI-powered analysis, insights, and salary predictions'
              : 'Upload your resume and paste job descriptions to get advanced AI analysis, insights, and salary predictions'
            }
          </p>
        </header>

        {/* ── Main Card ── */}
        <div className="riq-card">

          {!hasResults && !loading ? (
            /* ════ INPUT FORM ════ */
            <>
              {/* File Upload */}
              <div className="riq-file-wrap">
                <label className="riq-label">📄 Upload Resume (PDF)</label>
                <div className="riq-file-input-row">
                  <button
                    className="riq-file-btn"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    Choose File
                  </button>
                  <span className={`riq-file-name ${pdfFile ? 'has-file' : ''}`}>
                    {pdfFile ? pdfFile.name : 'No file chosen'}
                  </span>
                  <div className="riq-file-icon">
                    <div className={`riq-pdf-badge ${pdfFile ? 'visible' : ''}`}>PDF</div>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                {pdfFile && (
                  <p className="riq-file-success">
                    ✓ {pdfFile.name} selected
                  </p>
                )}
              </div>

              {/* JD 1 */}
              <div className="riq-textarea-wrap">
                <label className="riq-label">
                  💼 {compareMode ? 'Job Description 1' : 'Paste Job Description'}
                </label>
                <textarea
                  className="riq-textarea"
                  value={jobDescription}
                  onChange={(e) => { setJobDescription(e.target.value); setError(null) }}
                  placeholder="Paste the job description here..."
                />
              </div>

              {/* JD 2 — compare mode */}
              {compareMode && (
                <div className="riq-textarea-wrap" style={{ animation: 'fadeUp 0.3s var(--ease-out) both' }}>
                  <label className="riq-label">📋 Job Description 2</label>
                  <textarea
                    className="riq-textarea"
                    value={jobDescription2}
                    onChange={(e) => { setJobDescription2(e.target.value); setError(null) }}
                    placeholder="Paste the second job description here..."
                  />
                </div>
              )}

              {/* Compare Toggle */}
              <div className="riq-compare-row">
                <button
                  className={`riq-toggle-btn ${compareMode ? 'active' : ''}`}
                  onClick={() => setCompareMode(!compareMode)}
                  type="button"
                >
                  {compareMode ? '✅ Compare Mode ON' : '⚖️ Compare Two JDs'}
                </button>
                <span className="riq-toggle-hint">
                  {compareMode
                    ? 'Paste two JDs to find your best-fit role'
                    : 'Toggle to compare two job descriptions'}
                </span>
              </div>

              {/* Error */}
              {error && (
                <div className="riq-error">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* CTA */}
              <button
                className="riq-cta"
                onClick={handleSubmit}
                disabled={loading}
                type="button"
              >
                {compareMode ? '⚖️ Compare & Analyze →' : '✨ Analyze Resume →'}
              </button>
            </>

          ) : loading ? (
            /* ════ LOADING STATE ════ */
            <>
              <button className="riq-cta riq-cta-loading" disabled>
                ⏳ Analyzing your resume…
              </button>
              <SkeletonLoader />
            </>

          ) : (
            /* ════ RESULTS ════ */
            <div className="riq-results">

              {/* ── Standard Results ── */}
              {results && (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h2 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '17px',
                      fontWeight: '700',
                      color: 'var(--text-secondary)',
                      marginBottom: '20px',
                      letterSpacing: '0.3px'
                    }}>
                      Your ATS Match Score
                    </h2>
                    <ScoreCircle score={results.ats_score} />
                  </div>

                  {results.company_keywords?.length > 0 && (
                    <div style={{ marginBottom: '28px' }}>
                      <p className="riq-section-heading">🏢 Company Keywords</p>
                      <div className="chip-tags">
                        {results.company_keywords.map((kw, i) => (
                          <ChipTag key={i} label={kw} type="company" />
                        ))}
                      </div>
                    </div>
                  )}

                  {results.top_matches?.length > 0 && (
                    <div style={{ marginBottom: '28px' }}>
                      <p className="riq-section-heading">✅ Your Strengths</p>
                      <div className="chip-tags">
                        {results.top_matches.map((m, i) => (
                          <ChipTag key={i} label={m} type="match" />
                        ))}
                      </div>
                    </div>
                  )}

                  {results.missing_keywords?.length > 0 && (
                    <div style={{ marginBottom: '28px' }}>
                      <p className="riq-section-heading">⚠️ Missing Keywords</p>
                      <div className="chip-tags">
                        {results.missing_keywords.map((m, i) => (
                          <ChipTag key={i} label={m} type="missing" />
                        ))}
                      </div>
                    </div>
                  )}

                  {results.rewritten_bullets?.length > 0 && (
                    <div style={{ marginBottom: '28px' }}>
                      <p className="riq-section-heading">💡 Suggested Bullets</p>
                      <ul className="riq-bullets">
                        {results.rewritten_bullets.map((b, i) => (
                          <li
                            key={i}
                            className="riq-bullet-item"
                            style={{ animationDelay: `${i * 0.07}s` }}
                          >
                            <span className="riq-bullet-num">{i + 1}.</span>{b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {/* ── Compare Results ── */}
              {compareResults && (
                <div style={{ marginBottom: '32px' }}>
                  <h2 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '17px',
                    fontWeight: '700',
                    color: 'var(--text-secondary)',
                    textAlign: 'center',
                    marginBottom: '24px'
                  }}>
                    ⚖️ Side-by-Side Comparison
                  </h2>

                  {winner && (
                    <div className="compare-winner-row">
                      {winner === 'jd1' && `🏆 Job Description 1 is a better fit (${compareResults.jd1.ats_score} vs ${compareResults.jd2.ats_score})`}
                      {winner === 'jd2' && `🏆 Job Description 2 is a better fit (${compareResults.jd2.ats_score} vs ${compareResults.jd1.ats_score})`}
                      {winner === 'tie' && `🤝 Both are an equal match (${compareResults.jd1.ats_score})`}
                    </div>
                  )}

                  <div className="compare-grid">
                    {compareResults.jd1 && (
                      <ATSResultCard
                        data={compareResults.jd1}
                        title="Job Description 1"
                        isWinner={winner === 'jd1'}
                      />
                    )}
                    {compareResults.jd2 && (
                      <ATSResultCard
                        data={compareResults.jd2}
                        title="Job Description 2"
                        isWinner={winner === 'jd2'}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* ── Salary ── */}
              <SalarySection salaryResults={salaryResults} />

              {/* ── Action Buttons ── */}
              <div className="riq-actions">
                <button className="btn-download" onClick={handleDownloadPDF} type="button">
                  📥 Download Improvement Tips (PDF)
                </button>
                <button className="btn-back" onClick={resetAll} type="button">
                  ← Analyze Another Resume
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
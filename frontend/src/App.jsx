import { useState } from 'react'
import axios from 'axios'
import { jsPDF } from 'jspdf'
import './App.css'

const BACKEND_URL = 'http://localhost:8000'

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

  const resetAll = () => {
    setResults(null)
    setSalaryResults(null)
    setCompareResults(null)
    setPdfFile(null)
    setJobDescription('')
    setJobDescription2('')
    setError(null)
    setCompareMode(false)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported')
      setPdfFile(null)
      e.target.value = ''
      return
    }
    setPdfFile(file)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!pdfFile) {
      setError('Please upload a resume PDF')
      return
    }
    if (!jobDescription.trim()) {
      setError('Please enter a job description')
      return
    }
    if (compareMode && !jobDescription2.trim()) {
      setError('Please enter the second job description for comparison')
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)
    setSalaryResults(null)
    setCompareResults(null)

    try {
      // Step 1: Parse resume
      const formData = new FormData()
      formData.append('file', pdfFile)
      const parseRes = await axios.post(`${BACKEND_URL}/parse-resume`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (parseRes.data.status === 'error') {
        throw new Error(parseRes.data.message || 'Failed to parse resume')
      }

      const resumeText = parseRes.data.text || parseRes.data.text_preview
      if (!resumeText) throw new Error('Failed to extract resume text')

      if (compareMode) {
        // Compare mode: analyze against two JDs
        const [compareRes, salaryRes] = await Promise.all([
          axios.post(`${BACKEND_URL}/compare-jd`, {
            resume_text: resumeText,
            job_description_1: jobDescription,
            job_description_2: jobDescription2
          }),
          axios.post(`${BACKEND_URL}/predict-salary`, {
            resume_text: resumeText
          })
        ])

        if (compareRes.data.status === 'success') {
          setCompareResults(compareRes.data.data)
        } else {
          throw new Error(compareRes.data.message || 'Comparison failed')
        }

        if (salaryRes.data && salaryRes.data.status !== 'error') {
          setSalaryResults(salaryRes.data)
        }
      } else {
        // Standard mode: analyze + salary
        const [analyzeRes, salaryRes] = await Promise.all([
          axios.post(`${BACKEND_URL}/analyze`, {
            resume_text: resumeText,
            job_description: jobDescription
          }),
          axios.post(`${BACKEND_URL}/predict-salary`, {
            resume_text: resumeText
          })
        ])

        if (analyzeRes.data.status === 'success') {
          setResults(analyzeRes.data.data)
        } else {
          throw new Error(analyzeRes.data.message || 'Analysis failed')
        }

        if (salaryRes.data && salaryRes.data.status !== 'error') {
          setSalaryResults(salaryRes.data)
        }
      }
    } catch (err) {
      console.error('Error:', err)
      const errMsg = err.response?.data?.message || err.message || 'Something went wrong, try again'
      setError(errMsg)
    } finally {
      setLoading(false)
    }
  }

  /* ─── PDF Export ─── */
  const handleDownloadPDF = () => {
    const doc = new jsPDF()
    const margin = 15
    let y = margin

    const addText = (text, fontSize = 12, isBold = false, color = [31, 41, 55]) => {
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

    addText('ResumeIQ — Resume Improvement Tips', 18, true, [102, 126, 234])
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
        addText('Suggested Resume Bullets:', 13, true, [102, 126, 234])
        results.rewritten_bullets.forEach((b, i) => addText(`  ${i + 1}. ${b}`, 11))
        y += 2
      }
    }

    if (salaryResults) {
      addText('Salary Prediction:', 14, true, [118, 75, 162])
      addText(`Role: ${salaryResults.extracted_role || 'N/A'}`, 11)
      addText(`Experience: ${salaryResults.years_of_experience || 0} years`, 11)
      addText(`Range: ${salaryResults.min_salary_lpa} - ${salaryResults.median_salary_lpa} - ${salaryResults.max_salary_lpa} LPA`, 11)
      if (salaryResults.negotiation_tip) {
        addText(`Negotiation Tip: ${salaryResults.negotiation_tip}`, 11, false, [88, 28, 135])
      }
    }

    doc.save('ResumeIQ_Tips.pdf')
  }

  /* ─── Helpers ─── */
  const getScoreColor = (score) => {
    if (score >= 75) return '#10b981'
    if (score >= 50) return '#f59e0b'
    return '#ef4444'
  }

  const ScoreCircle = ({ score }) => (
    <div style={{
      width: '100px', height: '100px', borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '40px', fontWeight: 'bold',
      border: `5px solid ${getScoreColor(score)}`,
      color: getScoreColor(score), margin: '0 auto 15px'
    }}>
      {score}
    </div>
  )

  const ChipTag = ({ label, type }) => {
    const colors = {
      missing: { bg: '#fee2e2', text: '#991b1b' },
      match: { bg: '#dcfce7', text: '#166534' },
      company: { bg: '#f3e8ff', text: '#6b21a8' }
    }
    const c = colors[type] || colors.match
    return (
      <span style={{
        display: 'inline-block', padding: '6px 12px',
        backgroundColor: c.bg, color: c.text,
        borderRadius: '20px', fontSize: '14px', margin: '4px', fontWeight: '500'
      }}>
        {label}
      </span>
    )
  }

  /* ─── ATS Results Card (reusable for compare mode) ─── */
  const ATSResultCard = ({ data, title }) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <h3 style={{ fontSize: '16px', color: '#475569', marginBottom: '15px', textAlign: 'center' }}>{title}</h3>
      <ScoreCircle score={data.ats_score} />
      <p style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center', marginBottom: '15px' }}>
        {data.ats_score >= 75 && 'Excellent match!'}
        {data.ats_score >= 50 && data.ats_score < 75 && 'Good match.'}
        {data.ats_score < 50 && 'Needs work.'}
      </p>

      {data.top_matches?.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <strong style={{ fontSize: '13px', color: '#166534' }}>Strengths:</strong>
          <div>{data.top_matches.map((m, i) => <ChipTag key={i} label={m} type="match" />)}</div>
        </div>
      )}

      {data.missing_keywords?.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <strong style={{ fontSize: '13px', color: '#991b1b' }}>Missing:</strong>
          <div>{data.missing_keywords.map((m, i) => <ChipTag key={i} label={m} type="missing" />)}</div>
        </div>
      )}

      {data.rewritten_bullets?.length > 0 && (
        <div>
          <strong style={{ fontSize: '13px', color: '#667eea' }}>Suggested Bullets:</strong>
          <ol style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
            {data.rewritten_bullets.map((b, i) => (
              <li key={i} style={{
                background: '#f0f9ff', padding: '10px', marginBottom: '6px',
                borderLeft: '3px solid #667eea', borderRadius: '4px', fontSize: '13px', color: '#1f2937'
              }}>
                <strong style={{ color: '#667eea' }}>{i + 1}.</strong> {b}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )

  /* ─── Salary Section ─── */
  const SalarySection = () => {
    if (!salaryResults) return null
    const min = salaryResults.min_salary_lpa || 0
    const max = salaryResults.max_salary_lpa || 1
    const median = salaryResults.median_salary_lpa || 0
    const range = max - min || 1
    const pct = Math.max(0, Math.min(100, ((median - min) / range) * 100))

    const confColor = {
      high: { bg: '#dcfce7', text: '#166534' },
      medium: { bg: '#fef08a', text: '#854d0e' },
      low: { bg: '#fee2e2', text: '#991b1b' }
    }
    const conf = confColor[(salaryResults.confidence || '').toLowerCase()] || confColor.medium

    return (
      <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '2px dashed #e2e8f0', marginBottom: '30px' }}>
        <h3 style={{ fontSize: '18px', color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          💼 Predict My Salary
          {salaryResults.confidence && (
            <span style={{
              marginLeft: 'auto', padding: '4px 10px', borderRadius: '12px',
              fontSize: '13px', fontWeight: 'bold', backgroundColor: conf.bg, color: conf.text
            }}>
              {salaryResults.confidence} Confidence
            </span>
          )}
        </h3>

        {/* Range Bar */}
        <div style={{
          margin: '25px 0 35px', padding: '20px', background: '#f8fafc',
          borderRadius: '12px', border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '15px' }}>
            <span>Min</span><span>Median</span><span>Max</span>
          </div>
          <div style={{
            position: 'relative', height: '16px',
            background: 'linear-gradient(to right, #93c5fd, #3b82f6, #1d4ed8)',
            borderRadius: '8px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', padding: '0 2px', marginBottom: '35px', marginTop: '25px'
          }}>
            <div style={{ width: '4px', height: '12px', background: 'white', borderRadius: '2px' }} />
            <div style={{
              position: 'absolute', left: `${pct}%`, transform: 'translateX(-50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', top: '-22px'
            }}>
              <div style={{
                background: '#ef4444', color: 'white', fontWeight: 'bold', fontSize: '13px',
                padding: '4px 10px', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.15)', whiteSpace: 'nowrap'
              }}>{median} LPA</div>
              <div style={{ width: '3px', height: '32px', background: '#ef4444', marginTop: '2px' }} />
            </div>
            <div style={{ width: '4px', height: '12px', background: 'white', borderRadius: '2px' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>
            <span>{min} LPA</span>
            <span style={{ color: '#ef4444' }}>{median} LPA</span>
            <span>{max} LPA</span>
          </div>
        </div>

        {/* Tags */}
        <div style={{ marginBottom: '25px' }}>
          <h4 style={{ fontSize: '15px', color: '#475569', fontWeight: '600', marginBottom: '10px' }}>🔍 Profile Analysis</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {salaryResults.extracted_role && <span style={{ padding: '6px 12px', background: '#e0f2fe', color: '#0369a1', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>💼 {salaryResults.extracted_role}</span>}
            {salaryResults.years_of_experience !== undefined && <span style={{ padding: '6px 12px', background: '#ecfdf5', color: '#047857', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>⏳ {salaryResults.years_of_experience} Yrs Exp</span>}
            {salaryResults.college_tier && <span style={{ padding: '6px 12px', background: '#fff7ed', color: '#c2410c', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>🎓 {salaryResults.college_tier}</span>}
            {salaryResults.tech_stack?.map((t, i) => <span key={i} style={{ padding: '6px 12px', background: '#f1f5f9', color: '#475569', borderRadius: '8px', fontSize: '13px', fontWeight: '500' }}>🛠️ {t}</span>)}
          </div>
        </div>

        {/* Reasoning & Negotiation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {salaryResults.reasoning && (
            <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '8px', fontSize: '14px', color: '#334155', lineHeight: '1.5', borderLeft: '4px solid #cbd5e1' }}>
              <strong>Market Reasoning:</strong> {salaryResults.reasoning}
            </div>
          )}
          {salaryResults.negotiation_tip && (
            <div style={{ background: '#faf5ff', padding: '16px', borderRadius: '8px', fontSize: '14px', color: '#581c87', lineHeight: '1.5', border: '1.5px solid #d8b4fe', borderLeft: '6px solid #a855f7' }}>
              <strong>💡 Negotiation Tip:</strong> {salaryResults.negotiation_tip}
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ─── Show results or form ─── */
  const hasResults = results || compareResults

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '40px 20px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', background: 'white', borderRadius: '12px', padding: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '10px', color: '#1f2937', fontFamily: 'system-ui' }}>
          ResumeIQ AI Analyzer
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '30px', fontSize: '16px' }}>
          Upload your resume and paste a job description to get an AI-powered analysis
        </p>

        {!hasResults ? (
          <div style={{ background: '#f9fafb', padding: '30px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            {/* File Upload */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                📄 Upload Resume (PDF)
              </label>
              <input type="file" accept=".pdf" onChange={handleFileChange}
                style={{ width: '100%', padding: '10px', border: '2px solid #d1d5db', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }} />
              {pdfFile && <p style={{ color: '#059669', fontSize: '14px', marginTop: '5px' }}>✓ {pdfFile.name} selected</p>}
            </div>

            {/* JD 1 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                💼 {compareMode ? 'Job Description 1' : 'Paste Job Description'}
              </label>
              <textarea value={jobDescription} onChange={(e) => { setJobDescription(e.target.value); setError(null) }}
                placeholder="Paste the job description here..."
                style={{ width: '100%', padding: '12px', border: '2px solid #d1d5db', borderRadius: '6px', fontSize: '14px', fontFamily: 'system-ui', minHeight: '150px', boxSizing: 'border-box', resize: 'vertical' }} />
            </div>

            {/* JD 2 (Compare Mode) */}
            {compareMode && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                  📋 Job Description 2
                </label>
                <textarea value={jobDescription2} onChange={(e) => { setJobDescription2(e.target.value); setError(null) }}
                  placeholder="Paste the second job description here..."
                  style={{ width: '100%', padding: '12px', border: '2px solid #d1d5db', borderRadius: '6px', fontSize: '14px', fontFamily: 'system-ui', minHeight: '150px', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
            )}

            {/* Compare Toggle */}
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={() => setCompareMode(!compareMode)}
                style={{
                  padding: '8px 16px', border: `2px solid ${compareMode ? '#764ba2' : '#d1d5db'}`,
                  borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                  background: compareMode ? '#f3e8ff' : 'white', color: compareMode ? '#764ba2' : '#6b7280',
                  transition: 'all 0.2s'
                }}>
                {compareMode ? '✅ Compare Mode ON' : '⚖️ Compare Two JDs'}
              </button>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                {compareMode ? 'Paste two JDs to see which is a better fit' : 'Toggle to compare two job descriptions'}
              </span>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', border: '1px solid #fecaca' }}>
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button onClick={handleSubmit} disabled={loading}
              style={{
                width: '100%', padding: '12px',
                background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer', transition: 'opacity 0.3s', opacity: loading ? 0.7 : 1
              }}>
              {loading ? '🔄 Analyzing Resume...' : (compareMode ? '⚖️ Compare & Analyze' : '✨ Analyze Resume')}
            </button>

            {loading && (
              <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '16px', color: '#667eea', fontWeight: '600' }}>
                <style>{`@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } } .pulsing-dot { animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; display: inline-block; }`}</style>
                <div>Analyzing your resume<span className="pulsing-dot">...</span></div>
              </div>
            )}
          </div>
        ) : (
          /* ─── Results Section ─── */
          <div>
            {/* ── Standard Single-JD Results ── */}
            {results && (
              <>
                <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                  <h2 style={{ fontSize: '20px', color: '#1f2937', marginBottom: '20px' }}>Your ATS Match Score</h2>
                  <ScoreCircle score={results.ats_score} />
                  <p style={{ color: '#6b7280', fontSize: '14px' }}>
                    {results.ats_score >= 75 && '✨ Excellent match! Ready to apply.'}
                    {results.ats_score >= 50 && results.ats_score < 75 && '👍 Good match. Consider improvements below.'}
                    {results.ats_score < 50 && '⚠️ Needs work. Make suggested changes.'}
                  </p>
                </div>

                {results.company_keywords?.length > 0 && (
                  <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ fontSize: '18px', color: '#1f2937', marginBottom: '12px' }}>🏢 Company Keywords</h3>
                    <div>{results.company_keywords.map((kw, i) => <ChipTag key={i} label={kw} type="company" />)}</div>
                  </div>
                )}

                {results.top_matches?.length > 0 && (
                  <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ fontSize: '18px', color: '#1f2937', marginBottom: '12px' }}>✅ Your Strengths</h3>
                    <div>{results.top_matches.map((m, i) => <ChipTag key={i} label={m} type="match" />)}</div>
                  </div>
                )}

                {results.missing_keywords?.length > 0 && (
                  <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ fontSize: '18px', color: '#1f2937', marginBottom: '12px' }}>⚠️ Missing Keywords</h3>
                    <div>{results.missing_keywords.map((m, i) => <ChipTag key={i} label={m} type="missing" />)}</div>
                  </div>
                )}

                {results.rewritten_bullets?.length > 0 && (
                  <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ fontSize: '18px', color: '#1f2937', marginBottom: '12px' }}>💡 Suggested Bullets</h3>
                    <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {results.rewritten_bullets.map((b, i) => (
                        <li key={i} style={{ background: '#f0f9ff', padding: '12px', marginBottom: '10px', borderLeft: '4px solid #667eea', borderRadius: '4px', fontSize: '14px', color: '#1f2937' }}>
                          <strong style={{ color: '#667eea' }}>{i + 1}.</strong> {b}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </>
            )}

            {/* ── Compare Mode Results ── */}
            {compareResults && (
              <div style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '20px', color: '#1f2937', marginBottom: '20px', textAlign: 'center' }}>
                  ⚖️ JD Comparison Results
                </h2>
                {/* Winner banner */}
                {compareResults.jd1 && compareResults.jd2 && (
                  <div style={{
                    textAlign: 'center', marginBottom: '25px', padding: '12px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '8px', color: 'white', fontWeight: '600', fontSize: '15px'
                  }}>
                    {compareResults.jd1.ats_score > compareResults.jd2.ats_score
                      ? `🏆 Job Description 1 is a better fit (${compareResults.jd1.ats_score} vs ${compareResults.jd2.ats_score})`
                      : compareResults.jd2.ats_score > compareResults.jd1.ats_score
                        ? `🏆 Job Description 2 is a better fit (${compareResults.jd2.ats_score} vs ${compareResults.jd1.ats_score})`
                        : `🤝 Both are an equal match (${compareResults.jd1.ats_score})`
                    }
                  </div>
                )}
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  {compareResults.jd1 && <ATSResultCard data={compareResults.jd1} title="Job Description 1" />}
                  {compareResults.jd2 && <ATSResultCard data={compareResults.jd2} title="Job Description 2" />}
                </div>
              </div>
            )}

            {/* Salary Section */}
            <SalarySection />

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {/* Download PDF */}
              <button onClick={handleDownloadPDF}
                style={{
                  flex: 1, padding: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px',
                  fontWeight: '600', cursor: 'pointer', transition: 'opacity 0.3s', minWidth: '200px'
                }}
                onMouseOver={(e) => e.target.style.opacity = '0.85'}
                onMouseOut={(e) => e.target.style.opacity = '1'}
              >
                📥 Download Improvement Tips (PDF)
              </button>

              {/* Back */}
              <button onClick={resetAll}
                style={{
                  flex: 1, padding: '12px', background: '#e5e7eb', color: '#374151',
                  border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: '600',
                  cursor: 'pointer', transition: 'background 0.3s', minWidth: '200px'
                }}
                onMouseOver={(e) => e.target.style.background = '#d1d5db'}
                onMouseOut={(e) => e.target.style.background = '#e5e7eb'}
              >
                ← Analyze Another Resume
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
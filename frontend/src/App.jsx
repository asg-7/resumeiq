import { useState } from 'react'
import axios from 'axios'
import './App.css'

const BACKEND_URL = 'http://localhost:8000'

export default function App() {
  const [pdfFile, setPdfFile] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)
  const [salaryResults, setSalaryResults] = useState(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported')
      setPdfFile(null)
      e.target.value = '' // Clear input value
      return
    }
    setPdfFile(file)
    setError(null)
  }

  const handleJobDescChange = (e) => {
    setJobDescription(e.target.value)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!pdfFile && !jobDescription.trim()) {
      setError('Please upload a resume PDF and enter a job description')
      return
    }
    if (!pdfFile) {
      setError('Please upload a resume PDF')
      return
    }
    if (!jobDescription.trim()) {
      setError('Please enter a job description')
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)
    setSalaryResults(null)

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

      // Step 2: Analyze resume and Predict salary concurrently
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
      } else {
        console.warn('Salary prediction failed or returned error:', salaryRes.data?.message)
      }
    } catch (err) {
      console.error('Error:', err)
      const errMsg = err.response?.data?.message || err.message || 'Something went wrong, try again'
      setError(errMsg)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 75) return '#10b981' // green
    if (score >= 50) return '#f59e0b' // yellow
    return '#ef4444' // red
  }

  const getBorderStyle = (score) => {
    return {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '48px',
      fontWeight: 'bold',
      border: `5px solid ${getScoreColor(score)}`,
      color: getScoreColor(score),
      margin: '0 auto 20px'
    }
  }

  const ChipTag = ({ label, type }) => {
    let backgroundColor, textColor
    
    if (type === 'missing') {
      backgroundColor = '#fee2e2'
      textColor = '#991b1b'
    } else if (type === 'match') {
      backgroundColor = '#dcfce7'
      textColor = '#166534'
    } else if (type === 'company') {
      backgroundColor = '#f3e8ff'
      textColor = '#6b21a8'
    }

    return (
      <span style={{
        display: 'inline-block',
        padding: '6px 12px',
        backgroundColor,
        color: textColor,
        borderRadius: '20px',
        fontSize: '14px',
        margin: '4px',
        fontWeight: '500'
      }}>
        {label}
      </span>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
      }}>
        <h1 style={{
          fontSize: '36px',
          marginBottom: '10px',
          color: '#1f2937',
          fontFamily: 'system-ui'
        }}>
          ResumeIQ AI Analyzer
        </h1>
        <p style={{
          color: '#6b7280',
          marginBottom: '30px',
          fontSize: '16px'
        }}>
          Upload your resume and paste a job description to get an AI-powered analysis
        </p>

        {!results ? (
          <div style={{
            background: '#f9fafb',
            padding: '30px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            {/* File Upload */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#374151'
              }}>
                📄 Upload Resume (PDF)
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              />
              {pdfFile && (
                <p style={{ color: '#059669', fontSize: '14px', marginTop: '5px' }}>
                  ✓ {pdfFile.name} selected
                </p>
              )}
            </div>

            {/* Job Description */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#374151'
              }}>
                💼 Paste Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={handleJobDescChange}
                placeholder="Paste the job description here..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'system-ui',
                  minHeight: '150px',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                background: '#fee2e2',
                color: '#991b1b',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '20px',
                fontSize: '14px',
                border: '1px solid #fecaca'
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.3s',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? '🔄 Analyzing Resume...' : '✨ Analyze Resume'}
            </button>

            {/* Loading Animation */}
            {loading && (
              <div style={{
                marginTop: '20px',
                textAlign: 'center',
                fontSize: '16px',
                color: '#667eea',
                fontWeight: '600'
              }}>
                <style>{`
                  @keyframes pulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                  }
                  .pulsing-dot {
                    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                    display: inline-block;
                  }
                `}</style>
                <div>Analyzing your resume<span className="pulsing-dot">...</span></div>
              </div>
            )}
          </div>
        ) : (
          /* Results Section */
          <div>
            {/* ATS Score Circle */}
            <div style={{ marginBottom: '40px', textAlign: 'center' }}>
              <h2 style={{ fontSize: '20px', color: '#1f2937', marginBottom: '20px' }}>
                Your ATS Match Score
              </h2>
              <div style={getBorderStyle(results.ats_score)}>
                {results.ats_score}
              </div>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                {results.ats_score >= 75 && '✨ Excellent match! Ready to apply.'}
                {results.ats_score >= 50 && results.ats_score < 75 && '👍 Good match. Consider improvements below.'}
                {results.ats_score < 50 && '⚠️ Needs work. Make suggested changes.'}
              </p>
            </div>

            {/* Company Keywords */}
            {results.company_keywords && results.company_keywords.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '18px', color: '#1f2937', marginBottom: '12px' }}>
                  🏢 Company Keywords to Highlight
                </h3>
                <div>
                  {results.company_keywords.map((kw, idx) => (
                    <ChipTag key={idx} label={kw} type="company" />
                  ))}
                </div>
              </div>
            )}

            {/* Top Matches */}
            {results.top_matches && results.top_matches.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '18px', color: '#1f2937', marginBottom: '12px' }}>
                  ✅ Your Strengths (Matching Keywords)
                </h3>
                <div>
                  {results.top_matches.map((match, idx) => (
                    <ChipTag key={idx} label={match} type="match" />
                  ))}
                </div>
              </div>
            )}

            {/* Missing Keywords */}
            {results.missing_keywords && results.missing_keywords.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '18px', color: '#1f2937', marginBottom: '12px' }}>
                  ⚠️ Missing Keywords (Add These!)
                </h3>
                <div>
                  {results.missing_keywords.map((missing, idx) => (
                    <ChipTag key={idx} label={missing} type="missing" />
                  ))}
                </div>
              </div>
            )}

            {/* Rewritten Bullets */}
            {results.rewritten_bullets && results.rewritten_bullets.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '18px', color: '#1f2937', marginBottom: '12px' }}>
                  💡 Suggested Resume Bullets
                </h3>
                <ol style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0
                }}>
                  {results.rewritten_bullets.map((bullet, idx) => (
                    <li key={idx} style={{
                      background: '#f0f9ff',
                      padding: '12px',
                      marginBottom: '10px',
                      borderLeft: '4px solid #667eea',
                      borderRadius: '4px',
                      fontSize: '14px',
                      color: '#1f2937'
                    }}>
                      <strong style={{ color: '#667eea' }}>{idx + 1}.</strong> {bullet}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Predict My Salary Section */}
            {salaryResults && (
              <div style={{
                marginTop: '40px',
                paddingTop: '30px',
                borderTop: '2px dashed #e2e8f0',
                marginBottom: '40px'
              }}>
                <h3 style={{ fontSize: '18px', color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  💼 Predict My Salary
                  {salaryResults.confidence && (
                    <span style={{
                      marginLeft: 'auto',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      backgroundColor: salaryResults.confidence.toLowerCase() === 'high' ? '#dcfce7' : 
                                       salaryResults.confidence.toLowerCase() === 'medium' ? '#fef08a' : '#fee2e2',
                      color: salaryResults.confidence.toLowerCase() === 'high' ? '#166534' : 
                             salaryResults.confidence.toLowerCase() === 'medium' ? '#854d0e' : '#991b1b'
                    }}>
                      {salaryResults.confidence.charAt(0).toUpperCase() + salaryResults.confidence.slice(1)} Confidence
                    </span>
                  )}
                </h3>
                
                {/* Visual salary range bar */}
                <div style={{
                  margin: '25px 0 35px',
                  padding: '20px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '15px' }}>
                    <span>Min Range</span>
                    <span>Median Target</span>
                    <span>Max Range</span>
                  </div>
                  
                  {/* The Flex-based Track */}
                  <div style={{
                    position: 'relative',
                    height: '16px',
                    background: 'linear-gradient(to right, #93c5fd, #3b82f6, #1d4ed8)', // Smooth blue gradient representation of salary spectrum
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 2px',
                    marginBottom: '35px',
                    marginTop: '25px'
                  }}>
                    {/* Min Label Tick */}
                    <div style={{ width: '4px', height: '12px', background: 'white', borderRadius: '2px' }} />
                    
                    {/* Median Marker (Colored Pin/Marker) */}
                    {(() => {
                      const min = salaryResults.min_salary_lpa || 0;
                      const max = salaryResults.max_salary_lpa || 1;
                      const median = salaryResults.median_salary_lpa || 0;
                      const range = max - min || 1;
                      const percentage = Math.max(0, Math.min(100, ((median - min) / range) * 100));
                      return (
                        <div style={{
                          position: 'absolute',
                          left: `${percentage}%`,
                          transform: 'translateX(-50%)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          top: '-22px' // Float slightly above/centered
                        }}>
                          {/* Top pin/pointer */}
                          <div style={{
                            background: '#ef4444',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '13px',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.15)',
                            whiteSpace: 'nowrap'
                          }}>
                            {median} LPA
                          </div>
                          {/* Stem of the pin */}
                          <div style={{
                            width: '3px',
                            height: '32px',
                            background: '#ef4444',
                            marginTop: '2px'
                          }} />
                        </div>
                      );
                    })()}
                    
                    {/* Max Label Tick */}
                    <div style={{ width: '4px', height: '12px', background: 'white', borderRadius: '2px' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>
                    <span>{salaryResults.min_salary_lpa} LPA</span>
                    <span style={{ color: '#ef4444' }}>{salaryResults.median_salary_lpa} LPA</span>
                    <span>{salaryResults.max_salary_lpa} LPA</span>
                  </div>
                </div>

                {/* Extracted Profile Highlights Tags */}
                <div style={{ marginBottom: '25px' }}>
                  <h4 style={{ fontSize: '15px', color: '#475569', fontWeight: '600', marginBottom: '10px' }}>
                    🔍 Profile Analysis
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {salaryResults.extracted_role && (
                      <span style={{
                        padding: '6px 12px',
                        background: '#e0f2fe',
                        color: '#0369a1',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        💼 Role: {salaryResults.extracted_role}
                      </span>
                    )}
                    {salaryResults.years_of_experience !== undefined && (
                      <span style={{
                        padding: '6px 12px',
                        background: '#ecfdf5',
                        color: '#047857',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        ⏳ Experience: {salaryResults.years_of_experience} Yrs
                      </span>
                    )}
                    {salaryResults.college_tier && (
                      <span style={{
                        padding: '6px 12px',
                        background: '#fff7ed',
                        color: '#c2410c',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        🎓 College: {salaryResults.college_tier}
                      </span>
                    )}
                    {salaryResults.tech_stack && salaryResults.tech_stack.map((tech, idx) => (
                      <span key={idx} style={{
                        padding: '6px 12px',
                        background: '#f1f5f9',
                        color: '#475569',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}>
                        🛠️ {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Reasoning & Negotiation Box */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
                  {salaryResults.reasoning && (
                    <div style={{
                      background: '#f1f5f9',
                      padding: '16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#334155',
                      lineHeight: '1.5',
                      borderLeft: '4px solid #cbd5e1'
                    }}>
                      <strong>Market Reasoning:</strong> {salaryResults.reasoning}
                    </div>
                  )}
                  {salaryResults.negotiation_tip && (
                    <div style={{
                      background: '#faf5ff',
                      padding: '16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#581c87',
                      lineHeight: '1.5',
                      border: '1.5px solid #d8b4fe',
                      borderLeft: '6px solid #a855f7'
                    }}>
                      <strong>💡 Negotiation Tip:</strong> {salaryResults.negotiation_tip}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Back Button */}
            <button
              onClick={() => {
                setResults(null)
                setSalaryResults(null)
                setPdfFile(null)
                setJobDescription('')
                setError(null)
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: '#e5e7eb',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.3s'
              }}
              onMouseOver={(e) => e.target.style.background = '#d1d5db'}
              onMouseOut={(e) => e.target.style.background = '#e5e7eb'}
            >
              ← Analyze Another Resume
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
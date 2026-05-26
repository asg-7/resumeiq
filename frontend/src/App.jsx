import { useState } from 'react'
import axios from 'axios'

export default function App() {
  const [backendMessage, setBackendMessage] = useState('')

  const testConnection = async () => {
    try {
      // Pointing directly to your custom backend port 8080
      const response = await axios.get('http://localhost:8080/')
      setBackendMessage(response.data.message)
    } catch (error) {
      console.error(error)
      setBackendMessage('Failed to connect to backend server.')
    }
  }

  return (
    <div style={{ padding: 40, fontFamily: 'monospace', background: '#080810', color: '#CBD5E1', minHeight: '100vh' }}>
      <h1>ResumeIQ Frontend</h1>
      <p>Status: Frontend working cleanly.</p>
      <button 
        onClick={testConnection}
        style={{ padding: '10px 20px', background: '#38BDF8', border: 'none', cursor: 'pointer', fontWeight: 'bold', marginTop: 10 }}
      >
        Test Backend Connection
      </button>
      {backendMessage && (
        <div style={{ marginTop: 20, padding: 15, background: '#12121F', border: '1px solid #1E1E30' }}>
          <strong>Backend Says:</strong> {backendMessage}
        </div>
      )}
    </div>
  )
}
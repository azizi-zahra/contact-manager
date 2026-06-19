import { useState, useEffect } from 'react'
import api from './api'

function App() {
  // Auth State
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')
  const [isLogin, setIsLogin] = useState(true)

  // Contacts State
  const [contacts, setContacts] = useState([])
  const [form, setForm] = useState({
    name: '',
    family_name: '',
    phone: '',
    email: '',
    city: ''
  })
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    if (!token) return

    async function loadContacts() {
      try {
        const response = await api.get('/api/contacts')
        setContacts(response.data) 
      } catch (error) {
        // Handle backend returning 404 when user has zero contacts
        if (error.response && error.response.status === 404) {
          setContacts([])
        } else {
          console.error("Error fetching contacts:", error)
        }
      }
    }

    loadContacts()
  }, [token])

  // Parses both standard HTTPExceptions and nested Pydantic arrays safely
  function parseFastAPIError(error, defaultMessage) {
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail
      
      if (Array.isArray(detail)) {
        return detail.map(err => {
          const cleanMsg = err.msg.replace('Value error, ', '')
          const field = err.loc[err.loc.length - 1]
          return `${field}: ${cleanMsg}`
        }).join(' | ')
      }
      
      if (typeof detail === 'string') {
        return detail
      }
    }
    return defaultMessage
  }

  // --- Auth Handlers ---
  async function handleSubmitAuth(e) {
    e.preventDefault()
    setAuthError('')
    setAuthSuccess('')

    try {
      if (isLogin) {
        const response = await api.post('/auth/login', { username, password })
        const newToken = response.data.access_token || response.data.token 
        localStorage.setItem('token', newToken)
        setToken(newToken)
        setUsername('')
        setPassword('')
      } else {
        await api.post('/auth/register', { username, password })
        setAuthSuccess("Registration successful! Please log in.")
        setIsLogin(true)
        setPassword('')
      }
    } catch (error) {
      if (isLogin) {
        setAuthError(parseFastAPIError(error, "Invalid username or password!"))
      } else {
        setAuthError(parseFastAPIError(error, "Registration failed."))
      }
    }
  }

  function handleLogout() {
    localStorage.removeItem('token')
    setToken(null)
    setContacts([])
  }

  function toggleAuthMode() {
    setIsLogin(!isLogin)
    setAuthError('')
    setAuthSuccess('')
    setUsername('')
    setPassword('')
  }

  // --- Contact Handlers ---
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function addOrUpdateContact() {
    if (!form.name || !form.phone) {
      setError('Name and Phone are required!')
      return
    }
    setError('')
      
    try {
      if (editingId) {
        const response = await api.put(`/api/contacts/${editingId}`, form)
        setContacts(contacts.map(c => c.id === editingId ? response.data : c))
        setEditingId(null)
      } else {
        const response = await api.post('/api/contacts', form)
        setContacts([...contacts, response.data])
      }
      setForm({ name: '', family_name: '', phone: '', email: '', city: '' })
    } catch (error) {
      console.error("Error saving contact:", error)
      setError(parseFastAPIError(error, 'Failed to save contact.'))
    }
  }

  function startEdit(contact) {
    setEditingId(contact.id)
    setForm({
      name: contact.name || '',
      family_name: contact.family_name || '',
      phone: contact.phone || '',
      email: contact.email || '',
      city: contact.city || ''
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm({ name: '', family_name: '', phone: '', email: '', city: '' })
    setError('')
  }

  async function deleteContact(id) {
    try {
      await api.delete(`/api/contacts/${id}`)
      setContacts(contacts.filter(c => c.id !== id))
    } catch (error) {
      console.error("Error deleting contact:", error)
    }
  }

  // --- Authentication UI ---
  if (!token) {
    return (
      <div style={{ padding: 20, maxWidth: 400, margin: "50px auto", textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1>{isLogin ? '🔐 Login' : '📝 Sign Up'}</h1>
        
        {authSuccess && <p style={{ color: "green", background: "#e6ffe6", padding: 10, borderRadius: 5 }}>{authSuccess}</p>}
        
        <form onSubmit={handleSubmitAuth}>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
            style={{ display: "block", padding: 10, marginBottom: 15, width: "100%", boxSizing: 'border-box' }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            style={{ display: "block", padding: 10, marginBottom: 15, width: "100%", boxSizing: 'border-box' }}
          />
          <button type="submit" style={{ padding: 10, width: "100%", cursor: 'pointer', background: '#007BFF', color: 'white', border: 'none', borderRadius: 4 }}>
            {isLogin ? 'Log In' : 'Create Account'}
          </button>
        </form>

        {authError && <p style={{ color: "red", marginTop: 10, wordBreak: 'break-word' }}>{authError}</p>}

        <div style={{ marginTop: 20 }}>
          <span style={{ color: '#666' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button 
            onClick={toggleAuthMode}
            style={{ background: 'none', border: 'none', color: '#007BFF', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </div>
    )
  }

  // --- Main Contact Dashboard UI ---
  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>Contact Manager</h1>
        <button onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer' }}>Logout</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 30, background: '#f9f9f9', padding: 20, borderRadius: 8 }}>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name *" style={{ padding: 8 }} />
        <input name="family_name" value={form.family_name} onChange={handleChange} placeholder="Family Name" style={{ padding: 8 }} />
        <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone (e.g. 09123456789) *" style={{ padding: 8 }} />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" style={{ padding: 8 }} />
        <input name="city" value={form.city} onChange={handleChange} placeholder="City" style={{ padding: 8 }} />
        {error && <p style={{ color: 'red', margin: 0, wordBreak: 'break-word' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={addOrUpdateContact} style={{ padding: '10px', flex: 1, cursor: 'pointer', background: '#28a745', color: 'white', border: 'none', borderRadius: 4 }}>
            {editingId ? 'Update Contact' : 'Add Contact'}
          </button>
          {editingId && (
            <button onClick={cancelEdit} style={{ padding: '10px', flex: 1, cursor: 'pointer', background: '#dc3545', color: 'white', border: 'none', borderRadius: 4 }}>
              Cancel
            </button>
          )}
        </div>
      </div>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {contacts.map(c => (
          <li key={c.id} style={{
            padding: 15,
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: editingId === c.id ? '#f0f8ff' : 'transparent',
            borderRadius: 4,
            marginBottom: 5
          }}>
            <div onClick={() => startEdit(c)} style={{ cursor: 'pointer', flex: 1 }}>
              <strong style={{ fontSize: '1.1em' }}>{c.name} {c.family_name}</strong>
              <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
                📱 {c.phone} | ✉️ {c.email || 'N/A'} | 📍 {c.city || 'N/A'}
              </div>
            </div>
            <button onClick={() => deleteContact(c.id)} style={{ padding: '6px 12px', cursor: 'pointer', background: '#ff4d4d', color: 'white', border: 'none', borderRadius: 4 }}>
              Delete
            </button>
          </li>
        ))}
      </ul>

      {contacts.length === 0 && (
        <p style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>No contacts found. Add your first one above!</p>
      )}

      <p style={{ marginTop: 20, color: '#666', fontWeight: 'bold' }}>Total Contacts: {contacts.length}</p>
    </div>
  )
}

export default App
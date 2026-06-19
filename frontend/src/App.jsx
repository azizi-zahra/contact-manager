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
  const [form, setForm] = useState({ name: '', family_name: '', phone: '', email: '', city: '' })
  const [selectedLabelIds, setSelectedLabelIds] = useState([]) // Tracks labels checked for a contact
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)

  // Labels State
  const [labels, setLabels] = useState([])
  const [labelForm, setLabelForm] = useState({ name: '', color: '#808080' })
  const [labelError, setLabelError] = useState('')

  // Load Contacts and Labels on auth
  useEffect(() => {
    if (!token) return

    async function fetchData() {
      try {
        const contactRes = await api.get('/api/contacts')
        setContacts(contactRes.data)
      } catch (err) {
        if (err.response?.status === 404) setContacts([])
      }

      try {
        const labelRes = await api.get('/api/labels')
        setLabels(labelRes.data)
      } catch (err) {
        console.error("Error fetching labels:", err)
      }
    }

    fetchData()
  }, [token])

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
      if (typeof detail === 'string') return detail
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
    } catch (err) {
      setAuthError(parseFastAPIError(err, isLogin ? "Invalid credentials!" : "Registration failed."))
    }
  }

  function handleLogout() {
    localStorage.removeItem('token')
    setToken(null)
    setContacts([])
    setLabels([])
  }

  // --- Contact Handlers ---
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleLabelCheckboxChange(labelId) {
    if (selectedLabelIds.includes(labelId)) {
      setSelectedLabelIds(selectedLabelIds.filter(id => id !== labelId))
    } else {
      setSelectedLabelIds([...selectedLabelIds, labelId])
    }
  }

  async function addOrUpdateContact() {
    if (!form.name || !form.phone) {
      setError('Name and Phone are required!')
      return
    }
    setError('')

    const payload = { 
      ...form, 
      email: form.email.trim() || null,
      family_name: form.family_name.trim() || null,
      city: form.city.trim() || null,
      label_ids: selectedLabelIds 
    }
      
    try {
      if (editingId) {
        const response = await api.put(`/api/contacts/${editingId}`, payload)
        setContacts(contacts.map(c => c.id === editingId ? response.data : c))
        setEditingId(null)
      } else {
        const response = await api.post('/api/contacts', payload)
        setContacts([...contacts, response.data])
      }
      setForm({ name: '', family_name: '', phone: '', email: '', city: '' })
      setSelectedLabelIds([])
    } catch (err) {
      setError(parseFastAPIError(err, 'Failed to save contact.'))
    }
  }

  function startEdit(contact) {
    setEditingId(contact.id)
    setForm({
      name: contact.name || '', family_name: contact.family_name || '',
      phone: contact.phone || '', email: contact.email || '', city: contact.city || ''
    })
    // Pre-populate checkboxes with contact's current labels
    setSelectedLabelIds(contact.labels ? contact.labels.map(l => l.id) : [])
  }

  function cancelEdit() {
    setEditingId(null)
    setForm({ name: '', family_name: '', phone: '', email: '', city: '' })
    setSelectedLabelIds([])
    setError('')
  }

  async function deleteContact(id) {
    try {
      await api.delete(`/api/contacts/${id}`)
      setContacts(contacts.filter(c => c.id !== id))
    } catch (err) {
      console.error("Error deleting contact:", err)
    }
  }

  // --- Label Handlers ---
  async function handleCreateLabel(e) {
    e.preventDefault()
    setLabelError('')
    if (!labelForm.name.trim()) return

    try {
      const response = await api.post('/api/labels', labelForm)
      setLabels([...labels, response.data])
      setLabelForm({ name: '', color: '#808080' })
    } catch (err) {
      setLabelError(parseFastAPIError(err, 'Failed to create label.'))
    }
  }

  async function handleDeleteLabel(id) {
    try {
      await api.delete(`/api/labels/${id}`)
      setLabels(labels.filter(l => l.id !== id))
      // Remove deleted label from any active UI filters or states
      setSelectedLabelIds(selectedLabelIds.filter(lid => lid !== id))
      // Update contacts locally to clear the deleted label badge
      setContacts(contacts.map(c => ({
        ...c,
        labels: c.labels ? c.labels.filter(l => l.id !== id) : []
      })))
    } catch (err) {
      console.error("Error deleting label:", err)
    }
  }

  // --- Auth View ---
  if (!token) {
    return (
      <div style={{ padding: 20, maxWidth: 400, margin: "50px auto", textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1>{isLogin ? '🔐 Login' : '📝 Sign Up'}</h1>
        {authSuccess && <p style={{ color: "green", background: "#e6ffe6", padding: 10, borderRadius: 5 }}>{authSuccess}</p>}
        <form onSubmit={handleSubmitAuth}>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required style={{ display: "block", padding: 10, marginBottom: 15, width: "100%", boxSizing: 'border-box' }} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required style={{ display: "block", padding: 10, marginBottom: 15, width: "100%", boxSizing: 'border-box' }} />
          <button type="submit" style={{ padding: 10, width: "100%", cursor: 'pointer', background: '#007BFF', color: 'white', border: 'none', borderRadius: 4 }}>
            {isLogin ? 'Log In' : 'Create Account'}
          </button>
        </form>
        {authError && <p style={{ color: "red", marginTop: 10, wordBreak: 'break-word' }}>{authError}</p>}
        <div style={{ marginTop: 20 }}>
          <span style={{ color: '#666' }}>{isLogin ? "Don't have an account? " : "Already have an account? "}</span>
          <button onClick={() => { setIsLogin(!isLogin); setAuthError(''); setAuthSuccess(''); }} style={{ background: 'none', border: 'none', color: '#007BFF', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </div>
    )
  }

  // --- Dashboard View ---
  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '0 auto', fontFamily: 'sans-serif', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
      
      {/* LEFT COLUMN: Contacts */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1>Contact Manager</h1>
          <button onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer' }}>Logout</button>
        </div>

        {/* Contact Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 30, background: '#f9f9f9', padding: 20, borderRadius: 8 }}>
          <h3>{editingId ? '✏️ Edit Contact' : '➕ Add New Contact'}</h3>
          <input name="name" value={form.name} onChange={handleChange} placeholder="Name *" style={{ padding: 8 }} />
          <input name="family_name" value={form.family_name} onChange={handleChange} placeholder="Family Name" style={{ padding: 8 }} />
          <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone (e.g. 09123456789) *" style={{ padding: 8 }} />
          <input name="email" value={form.email} onChange={handleChange} placeholder="Email" style={{ padding: 8 }} />
          <input name="city" value={form.city} onChange={handleChange} placeholder="City" style={{ padding: 8 }} />
          
          {/* Label Checkboxes inside Contact Form */}
          {labels.length > 0 && (
            <div style={{ margin: '10px 0' }}>
              <label style={{ fontSize: 14, fontWeight: 'bold', display: 'block', marginBottom: 5 }}>Assign Labels:</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {labels.map(l => (
                  <label key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#eee', padding: '4px 8px', borderRadius: 4, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={selectedLabelIds.includes(l.id)} onChange={() => handleLabelCheckboxChange(l.id)} />
                    <span style={{ width: 10, hieght: 10, inlineSize: 10, height: 10, backgroundColor: l.color, borderRadius: '50%', display: 'inline-block' }}></span>
                    {l.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && <p style={{ color: 'red', margin: 0, wordBreak: 'break-word' }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={addOrUpdateContact} style={{ padding: '10px', flex: 1, cursor: 'pointer', background: '#28a745', color: 'white', border: 'none', borderRadius: 4 }}>
              {editingId ? 'Update Contact' : 'Add Contact'}
            </button>
            {editingId && <button onClick={cancelEdit} style={{ padding: '10px', flex: 1, cursor: 'pointer', background: '#dc3545', color: 'white', border: 'none', borderRadius: 4 }}>Cancel</button>}
          </div>
        </div>

        {/* Contacts List */}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {contacts.map(c => (
            <li key={c.id} style={{ padding: 15, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: editingId === c.id ? '#f0f8ff' : 'transparent', borderRadius: 4, marginBottom: 5 }}>
              <div onClick={() => startEdit(c)} style={{ cursor: 'pointer', flex: 1 }}>
                <strong style={{ fontSize: '1.1em' }}>{c.name} {c.family_name}</strong>
                
                {/* Render Label Badges */}
                <div style={{ display: 'flex', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
                  {c.labels && c.labels.map(l => (
                    <span key={l.id} style={{ background: l.color, color: '#fff', fontSize: 11, padding: '2px 6px', borderRadius: 10, fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                      {l.name}
                    </span>
                  ))}
                </div>

                <div style={{ fontSize: 14, color: '#666', marginTop: 6 }}>
                  📱 {c.phone} | ✉️ {c.email || 'N/A'} | 📍 {c.city || 'N/A'}
                </div>
              </div>
              <button onClick={() => deleteContact(c.id)} style={{ padding: '6px 12px', cursor: 'pointer', background: '#ff4d4d', color: 'white', border: 'none', borderRadius: 4 }}>Delete</button>
            </li>
          ))}
        </ul>
        {contacts.length === 0 && <p style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>No contacts found.</p>}
        <p style={{ marginTop: 20, color: '#666', fontWeight: 'bold' }}>Total Contacts: {contacts.length}</p>
      </div>

      {/* RIGHT COLUMN: Label Management */}
      <div style={{ borderLeft: '1px solid #ddd', paddingLeft: 20 }}>
        <h2>🏷️ Manage Labels</h2>
        
        {/* Create Label Form */}
        <form onSubmit={handleCreateLabel} style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#f0f0f0', padding: 15, borderRadius: 8, marginBottom: 20 }}>
          <input type="text" placeholder="Label Name" value={labelForm.name} onChange={e => setLabelForm({ ...labelForm, name: e.target.value })} required style={{ padding: 6 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ fontSize: 14 }}>Pick Color:</label>
            <input type="color" value={labelForm.color} onChange={e => setLabelForm({ ...labelForm, color: e.target.value })} style={{ cursor: 'pointer', border: 'none', background: 'transparent', width: 40, height: 30 }} />
          </div>
          <button type="submit" style={{ padding: 6, background: '#007BFF', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Create Label</button>
          {labelError && <p style={{ color: 'red', fontSize: 13, margin: 0 }}>{labelError}</p>}
        </form>

        {/* Existing Labels List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {labels.map(l => (
            <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fff', border: `1px solid ${l.color}`, borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 12, height: 12, backgroundColor: l.color, borderRadius: '50%', display: 'inline-block' }}></span>
                <span style={{ fontWeight: '500' }}>{l.name}</span>
              </div>
              <button onClick={() => handleDeleteLabel(l.id)} style={{ background: 'none', border: 'none', color: '#cc0000', cursor: 'pointer', fontSize: 12 }}>✕</button>
            </div>
          ))}
          {labels.length === 0 && <p style={{ color: '#888', fontSize: 14, textAlign: 'center' }}>No labels created yet.</p>}
        </div>
      </div>

    </div>
  )
}

export default App
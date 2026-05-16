import { useState } from 'react'
 
function App() {
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

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function addContact() {
    if (!form.name || !form.phone) {
      setError('Name and Phone are required!')
      return
    }
    setError('')
      
    if (editingId) {
      setContacts(contacts.map(c =>
        c.id === editingId ? {...c, ...form} : c
      ))
      setEditingId(null)
    } else {
      const newContact = { id: Date.now(), ...form }
      setContacts([...contacts, newContact])
    }

    setForm({ name: '', family_name: '', phone: '', email: '', city: '' })
  }

  function startEdit(contact) {
    setEditingId(contact.id)
    setForm({
      name: contact.name,
      family_name: contact.family_name,
      phone: contact.phone,
      email: contact.email,
      city: contact.city
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm({ name: '', family_name: '', phone: '', email: '', city: '' })
  }

  function deleteContact(id) {
    setContacts(contacts.filter(c => c.id !== id))
  }

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
      <h1>Contact Manager</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name *" />
        <input name="family_name" value={form.family_name} onChange={handleChange} placeholder="Family Name" />
        <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone *" />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" />
        <input name="city" value={form.city} onChange={handleChange} placeholder="City" />
        {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}

        <button onClick={addContact}>{editingId ? 'Update' : 'Add Contact'}</button>
        {editingId && <button onClick={cancelEdit}>Cancel</button>}
      </div>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {contacts.map(c => (
          <li key={c.id} style={{
            padding: 10,
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: editingId === c.id ? '#f0f8ff' : 'transparent'
          }}>
            <div onClick={() => startEdit(c)} tyle={{ cursor: 'pointer', flex: 1 }}>
              <strong>{c.name} {c.family_name}</strong>
              <div style={{ fontSize: 14, color: '#666' }}>
                {c.phone} | {c.email} | {c.city}
              </div>
            </div>
            <button onClick={() => deleteContact(c.id)}>Delete</button>
          </li>
        ))}
      </ul>

      <p>Total Contacts: {contacts.length}</p>
    </div>
  )
}

export default App
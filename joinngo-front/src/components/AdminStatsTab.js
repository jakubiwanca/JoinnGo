import React, { useEffect, useState } from 'react'
import { getAdminAllEvents } from '../api/events'
import { getAllUsers } from '../api/users'

const StatCard = ({ title, value, color }) => (
  <div
    style={{
      background: 'var(--card-bg)',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: 'var(--shadow-sm)',
      borderLeft: `5px solid ${color}`,
      flex: 1,
      minWidth: '200px',
    }}
  >
    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
      {title}
    </div>
    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-color)' }}>{value}</div>
  </div>
)

const AdminStatsTab = () => {
  const [stats, setStats] = useState({
    users: 0,
    events: 0,
    activeEvents: 0,
    expiredEvents: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAllUsers(), getAdminAllEvents()])
      .then(([users, events]) => {
        setStats({
          users: users.length,
          events: events.length,
          activeEvents: events.filter((e) => !e.isExpired).length,
          expiredEvents: events.filter((e) => e.isExpired).length,
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Ładowanie statystyk...</p>

  return (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      <StatCard title="Użytkownicy" value={stats.users} color="#3b82f6" />
      <StatCard title="Wszystkie Wydarzenia" value={stats.events} color="#8b5cf6" />
      <StatCard title="Aktywne Wydarzenia" value={stats.activeEvents} color="#10b981" />
      <StatCard title="Wygasłe Wydarzenia" value={stats.expiredEvents} color="#ef4444" />
    </div>
  )
}

export default AdminStatsTab

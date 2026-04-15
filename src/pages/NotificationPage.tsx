import { useState, useEffect } from "react"
import { supabase } from "../services/supabaseClient"

interface Notification {
  id: string
  type: string
  message: string
  is_read: boolean
  created_at: string
}

const getIcon = (type: string) => {
  switch (type) {
    case "buy":     return "🟢"
    case "sell":    return "🔴"
    case "deposit": return "💷"
    case "receive": return "📥"
    case "send":    return "📤"
    case "alert":   return "🔔"
    default:        return "ℹ️"
  }
}

const getLabel = (type: string) => {
  switch (type) {
    case "buy":     return "Purchase"
    case "sell":    return "Sale"
    case "deposit": return "Deposit"
    case "receive": return "Received"
    case "send":    return "Sent"
    case "alert":   return "Price Alert"
    default:        return "Notification"
  }
}

const formatTime = (ts: string) => {
  const date = new Date(ts)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export function NotificationPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (data) setNotifications(data)
    setLoading(false)
  }

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false)

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const deleteAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from("notifications").delete().eq("user_id", user.id)
    setNotifications([])
  }

  const FILTERS = ["all", "buy", "sell", "send", "receive", "deposit", "alert"]

  const filtered = filter === "all"
    ? notifications
    : notifications.filter(n => n.type === filter)

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) return <p style={{ padding: "40px" }}>Loading notifications...</p>

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", padding: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ margin: 0 }}>Notifications</h2>
          {unreadCount > 0 && (
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
              {unreadCount} unread
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={s.actionBtn}>
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={deleteAll} style={{ ...s.actionBtn, color: "#dc2626", borderColor: "#fecaca" }}>
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" as const }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              ...s.filterBtn,
              ...(filter === f ? s.filterBtnActive : {})
            }}
          >
            {f === "all" ? "All" : getLabel(f)}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {filtered.length === 0 ? (
        <div style={s.empty}>
          <p style={{ fontSize: "32px", margin: "0 0 8px" }}>🔔</p>
          <p style={{ color: "#64748b", margin: 0 }}>
            {filter === "all" ? "No notifications yet" : `No ${getLabel(filter)} notifications`}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map(n => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              style={{
                ...s.item,
                background: n.is_read ? "#ffffff" : "#f0f9ff",
                borderLeft: n.is_read ? "3px solid #e2e8f0" : "3px solid #3b82f6",
                cursor: n.is_read ? "default" : "pointer",
              }}
            >
              <span style={s.icon}>{getIcon(n.type)}</span>
              <div style={s.itemBody}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={s.typeLabel}>{getLabel(n.type)}</span>
                  <span style={s.time}>{formatTime(n.created_at)}</span>
                </div>
                <p style={s.message}>{n.message}</p>
              </div>
              {!n.is_read && <div style={s.dot} />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  actionBtn: {
    padding: "6px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    background: "transparent",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    color: "#374151",
  },
  filterBtn: {
    padding: "6px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    background: "#f8fafc",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    color: "#374151",
  },
  filterBtnActive: {
    background: "#1e293b",
    color: "#ffffff",
    border: "1px solid #1e293b",
  },
  empty: {
    textAlign: "center" as const,
    padding: "60px 20px",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  item: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "14px 16px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    transition: "background 0.15s",
  },
  icon: {
    fontSize: "22px",
    marginTop: "2px",
    flexShrink: 0,
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
  },
  typeLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  message: {
    margin: "4px 0 0",
    fontSize: "14px",
    color: "#1e293b",
    lineHeight: 1.5,
  },
  time: {
    fontSize: "12px",
    color: "#94a3b8",
    flexShrink: 0,
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#3b82f6",
    flexShrink: 0,
    marginTop: "6px",
  },
}

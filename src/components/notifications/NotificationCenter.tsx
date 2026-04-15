import { useState, useEffect, useRef } from "react"
import { supabase } from "../../services/supabaseClient"

interface Notification {
  id: string
  type: string
  message: string
  is_read: boolean
  created_at: string
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotifications()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)

    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.is_read).length)
    }
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
    setUnreadCount(0)
  }

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
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

  const formatTime = (ts: string) => {
    const date = new Date(ts)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diff < 60) return "just now"
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="chip"
        onClick={() => { setOpen(prev => !prev); if (!open) fetchNotifications() }}
        style={{ position: "relative" }}
      >
        Notifications
        {unreadCount > 0 && (
          <span style={s.badge}>{unreadCount}</span>
        )}
      </button>

      {open && (
        <div style={s.dropdown}>
          <div style={s.header}>
            <a href="#/notifications" style={{ textDecoration: "none", color: "inherit" }} onClick={() => setOpen(false)}>
              <span style={s.headerTitle}>Notifications →</span>
            </a>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={s.markAllBtn}>Mark all read</button>
            )}
          </div>

          <div style={s.list}>
            {notifications.length === 0 ? (
              <p style={s.empty}>No notifications yet</p>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markRead(n.id)}
                  style={{
                    ...s.item,
                    background: n.is_read ? "#ffffff" : "#f0f9ff",
                    cursor: n.is_read ? "default" : "pointer",
                  }}
                >
                  <span style={s.icon}>{getIcon(n.type)}</span>
                  <div style={s.itemBody}>
                    <p style={s.message}>{n.message}</p>
                    <span style={s.time}>{formatTime(n.created_at)}</span>
                  </div>
                  {!n.is_read && <div style={s.dot} />}
                </div>
              ))
            )}
          </div>

          <a
            href="#/notifications"
            onClick={() => setOpen(false)}
            style={s.viewAll}
          >
            View all notifications
          </a>
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  badge: {
    position: "absolute",
    top: "-6px",
    right: "-6px",
    background: "#dc2626",
    color: "#ffffff",
    borderRadius: "50%",
    width: "18px",
    height: "18px",
    fontSize: "11px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    width: "340px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    zIndex: 1000,
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    borderBottom: "1px solid #e2e8f0",
  },
  headerTitle: {
    fontWeight: "600",
    fontSize: "15px",
    color: "#0f172a",
  },
  markAllBtn: {
    background: "transparent",
    border: "none",
    color: "#3b82f6",
    fontSize: "13px",
    cursor: "pointer",
    fontWeight: "500",
  },
  list: {
    maxHeight: "340px",
    overflowY: "auto" as const,
  },
  empty: {
    textAlign: "center" as const,
    color: "#94a3b8",
    padding: "32px 16px",
    fontSize: "14px",
  },
  item: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "12px 16px",
    borderBottom: "1px solid #f1f5f9",
  },
  icon: {
    fontSize: "20px",
    marginTop: "2px",
    flexShrink: 0,
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
  },
  message: {
    margin: 0,
    fontSize: "13px",
    color: "#1e293b",
    lineHeight: 1.5,
  },
  time: {
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "4px",
    display: "block",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#3b82f6",
    flexShrink: 0,
    marginTop: "6px",
  },
  viewAll: {
    display: "block",
    textAlign: "center" as const,
    padding: "12px",
    fontSize: "13px",
    color: "#3b82f6",
    fontWeight: "500",
    borderTop: "1px solid #e2e8f0",
    textDecoration: "none",
  },
}

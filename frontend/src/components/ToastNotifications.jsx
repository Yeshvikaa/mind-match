import { useAuth } from '../context/AuthContext'

const ToastNotifications = () => {
  const { toasts, removeToast } = useAuth()

  const icons = { success: '✅', error: '❌', info: 'ℹ️', achievement: '🏆' }

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`} onClick={() => removeToast(t.id)}>
          <span>{icons[t.type] || '💬'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}

export default ToastNotifications

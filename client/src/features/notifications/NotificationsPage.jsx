import api from '../../utils/api.js'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export default function NotificationsPage() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/notifications')
      setList(data?.data || [])
    } catch (e) {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const markRead = async (n) => {
    try {
      await api.put(`/notifications/${n._id}`, { read: !n.read })
      fetchData()
    } catch (e) {
      toast.error('Update failed')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Notifications</h2>
        <p className="text-gray-600 dark:text-gray-400">Your recent updates</p>
      </div>

      {loading ? (
        <div className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
      ) : (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          {list.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No notifications.</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {list.map((n) => (
                <li key={n._id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{n.title}</p>
                    <p className="text-sm text-gray-500">{n.message}</p>
                  </div>
                  <button onClick={()=>markRead(n)} className={`px-3 py-1.5 rounded-lg ${n.read ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'}`}>
                    {n.read ? 'Unread' : 'Mark as read'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

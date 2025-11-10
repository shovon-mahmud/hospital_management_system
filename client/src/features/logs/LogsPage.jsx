import api from '../../utils/api.js'
import { useEffect, useState } from 'react'

export default function LogsPage() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/logs?limit=100')
        setList(data?.data || [])
      } catch (e) {
        // ignore
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-transparent">System Logs</h2>
        <p className="text-gray-600 dark:text-gray-400">Recent actions</p>
      </div>
      {loading ? (
        <div className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
      ) : (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          {list.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No logs.</p>
          ) : (
            <ul className="space-y-2">
              {list.map((l) => (
                <li key={l._id} className="p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <p className="text-sm"><span className="font-medium">{l.action}</span> on {l.entity} #{l.entityId}</p>
                  <p className="text-xs text-gray-500">{new Date(l.createdAt).toLocaleString()} • {l.ip || 'local'}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

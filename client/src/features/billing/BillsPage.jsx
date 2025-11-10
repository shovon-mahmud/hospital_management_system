import api from '../../utils/api.js'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Icon from '../../components/Icon.jsx'
import Invoice from '../../components/Invoice.jsx'
import { useSelector } from 'react-redux'

export default function BillsPage() {
  const [list, setList] = useState([])
  const [filteredList, setFilteredList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedBill, setSelectedBill] = useState(null)
  const { user } = useSelector((s) => s.auth)
  const itemsPerPage = 10

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/bills?limit=200')
      setList(data?.data || [])
      setFilteredList(data?.data || [])
    } catch (e) {
      console.error('Failed to load bills', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    const term = search.toLowerCase()
    let filtered = list.filter(b => 
      b._id?.toLowerCase().includes(term) ||
      b.appointment?.patient?.user?.name?.toLowerCase().includes(term) ||
      b.appointment?.patient?.patientId?.toLowerCase().includes(term) ||
      b.appointment?.doctor?.user?.name?.toLowerCase().includes(term) ||
      b.status?.toLowerCase().includes(term)
    )
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter)
    }
    setFilteredList(filtered)
    setCurrentPage(1)
  }, [search, list, statusFilter])

  const totalPages = Math.ceil(filteredList.length / itemsPerPage)
  const paginatedList = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/bills/${id}`, { status })
      toast.success('Bill status updated')
      fetchData()
    } catch (e) {
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Billing</h2>
        <p className="text-gray-600 dark:text-gray-400">View and manage bills</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <Icon name="search" className="w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by patient, doctor, bill ID, or status..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <span className="text-sm text-gray-500">{filteredList.length} results</span>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {['all', 'unpaid', 'paid', 'refunded'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
      ) : (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          {filteredList.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No bills found.</p>
          ) : (
            <>
              <ul className="space-y-3">
                {paginatedList.map((b) => (
                <li key={b._id} className="p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          b.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200' :
                          b.status === 'refunded' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200' :
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200'
                        }`}>
                          {b.status || 'unpaid'}
                        </span>
                        <span className="text-xs text-gray-500">Bill #{b._id.slice(-8)}</span>
                      </div>
                      <p className="text-sm font-semibold">Total: ৳{(b.total||0).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Patient: {b.appointment?.patient?.user?.name || b.appointment?.patient?.patientId || '—'}</p>
                      <p className="text-xs text-gray-500">Doctor: {b.appointment?.doctor?.user?.name || '—'}</p>
                      <p className="text-xs text-gray-500">Created: {b.createdAt ? new Date(b.createdAt).toLocaleString() : '—'}</p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {user?.role !== 'Doctor' && (
                        <button 
                          onClick={()=>setSelectedBill(b)} 
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs hover:shadow-lg transition-all flex items-center gap-1"
                        >
                          <Icon name="printer" className="w-3 h-3" /> Invoice
                        </button>
                      )}
                      <button onClick={()=>setExpandedId(expandedId===b._id?null:b._id)} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs">{expandedId===b._id?'Hide':'Details'}</button>
                    </div>
                  </div>
                  {expandedId===b._id && (
                    <div className="mt-3 space-y-3">
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-xs">
                        <p className="font-semibold mb-2">Bill Items</p>
                        {(b.items||[]).length === 0 ? (
                          <p className="text-gray-500">No items</p>
                        ) : (
                          <ul className="space-y-1">
                            {b.items.map((item, idx) => (
                              <li key={idx} className="flex justify-between">
                                <span>{item.description || 'Item'}</span>
                                <span className="font-semibold">৳{(item.amount||0).toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600 flex justify-between font-bold">
                          <span>Total:</span>
                          <span>৳{(b.total||0).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs" onClick={()=>updateStatus(b._id,'paid')}>Mark Paid</button>
                        <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs" onClick={()=>updateStatus(b._id,'refunded')}>Mark Refunded</button>
                        <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs" onClick={()=>updateStatus(b._id,'unpaid')}>Mark Unpaid</button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
              </ul>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Invoice Modal */}
      {selectedBill && <Invoice bill={selectedBill} onClose={() => setSelectedBill(null)} />}
    </div>
  )
}

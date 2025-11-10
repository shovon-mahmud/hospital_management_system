import { useEffect, useState } from 'react';
import api from '../../utils/api.js';

export default function PrescriptionsPage() {
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		(async () => {
			try {
				const { data } = await api.get('/prescriptions/mine');
				setItems(data.data || []);
			} catch (e) {
				setError(e.response?.data?.message || 'Failed to load prescriptions');
			} finally { setLoading(false); }
		})();
	}, []);

	if (loading) return <div className="p-4">Loading prescriptions...</div>;
	if (error) return <div className="p-4 text-red-600">{error}</div>;

	return (
		<div className="p-4">
			<h2 className="text-xl font-semibold mb-4">My Prescriptions</h2>
			<div className="space-y-3">
				{items.map(p => (
					<div key={p._id} className="border rounded p-3">
						<div className="text-sm text-gray-600">{new Date(p.createdAt).toLocaleString()}</div>
						<div className="font-medium">{(p.medications||[]).map(m=>m.name).filter(Boolean).join(', ')}</div>
						<div className="flex gap-3 mt-2">
							<a className="text-blue-600 underline" href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/prescriptions/${p._id}/pdf`} target="_blank" rel="noreferrer">Open PDF</a>
						</div>
					</div>
				))}
				{items.length === 0 && <div>No prescriptions yet.</div>}
			</div>
		</div>
	);
}


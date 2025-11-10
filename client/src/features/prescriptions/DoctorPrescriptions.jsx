import { useEffect, useState } from 'react';
import api from '../../utils/api.js';
import PrescriptionForm from './PrescriptionForm.jsx';

export default function DoctorPrescriptions({ appointmentId }) {
	const [existing, setExisting] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		if (!appointmentId) return;
		(async () => {
			try {
				const { data } = await api.get(`/appointments/${appointmentId}/prescription`);
				if (data.success) setExisting(data.data);
			} catch (e) {
				// 404 means none yet; ignore
				if (e.response?.status !== 404) setError(e.response?.data?.message || 'Failed to load prescription');
			} finally { setLoading(false); }
		})();
	}, [appointmentId]);

	const handleCreated = (p) => setExisting(p);

	if (!appointmentId) return <div>Select an appointment.</div>;
	if (loading) return <div>Loading prescription...</div>;
	if (error) return <div className="text-red-600">{error}</div>;

	return (
		<div className="space-y-4">
			{existing ? (
				<div className="border p-3 rounded bg-white shadow">
					<h3 className="font-semibold">Prescription</h3>
					<ul className="text-sm list-disc pl-5">
						{existing.medications.map((m,i)=><li key={i}>{m.name} {m.strength} - {m.dosage} {m.frequency} {m.duration}</li>)}
					</ul>
					<div className="mt-2 text-xs text-gray-600">Created {new Date(existing.createdAt).toLocaleString()}</div>
					<a className="text-blue-600 underline text-sm" href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/prescriptions/${existing._id}/pdf`} target="_blank" rel="noreferrer">Open PDF</a>
				</div>
			) : (
				<PrescriptionForm appointmentId={appointmentId} onCreated={handleCreated} />
			)}
		</div>
	);
}


import { useState } from 'react';
import api from '../../utils/api.js';

const emptyMed = { name: '', form: '', strength: '', dosage: '', frequency: '', route: '', duration: '', instructions: '', prn: false };

export default function PrescriptionForm({ appointmentId, onCreated }) {
	const [medications, setMeds] = useState([{ ...emptyMed }]);
	const [advice, setAdvice] = useState('');
	const [followUpAfterDays, setFollow] = useState('');
	const [nextTests, setTests] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const updateMed = (i, key, val) => {
		setMeds(meds => meds.map((m, idx) => idx === i ? { ...m, [key]: val } : m));
	};

	const addMed = () => setMeds(m => [...m, { ...emptyMed }]);
	const removeMed = (i) => setMeds(m => m.length === 1 ? m : m.filter((_, idx) => idx !== i));

	const submit = async (e) => {
		e.preventDefault();
		setError('');
		setLoading(true);
		try {
			const payload = {
				medications: medications.filter(m => m.name.trim()),
				advice,
				followUpAfterDays: followUpAfterDays ? Number(followUpAfterDays) : undefined,
				nextTests: nextTests.split(',').map(s => s.trim()).filter(Boolean)
			};
			const { data } = await api.post(`/appointments/${appointmentId}/prescription`, payload);
			onCreated?.(data.data);
		} catch (err) {
			setError(err.response?.data?.message || 'Failed to create prescription');
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={submit} className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg shadow border border-gray-200 dark:border-gray-700">
			<h3 className="text-lg font-semibold text-gray-900 dark:text-white">New Prescription</h3>
			{medications.map((m, i) => (
				<div key={i} className="grid md:grid-cols-6 gap-2 border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-800">
					<input className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-1 text-sm rounded" placeholder="Name" value={m.name} onChange={e=>updateMed(i,'name',e.target.value)} required />
					<input className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-1 text-sm rounded" placeholder="Strength" value={m.strength} onChange={e=>updateMed(i,'strength',e.target.value)} />
					<input className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-1 text-sm rounded" placeholder="Dosage" value={m.dosage} onChange={e=>updateMed(i,'dosage',e.target.value)} required />
					<input className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-1 text-sm rounded" placeholder="Frequency" value={m.frequency} onChange={e=>updateMed(i,'frequency',e.target.value)} required />
					<input className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-1 text-sm rounded" placeholder="Duration" value={m.duration} onChange={e=>updateMed(i,'duration',e.target.value)} required />
					<div className="flex items-center gap-2"> 
						<label className="text-xs flex items-center gap-1 text-gray-700 dark:text-gray-300"><input type="checkbox" checked={m.prn} onChange={e=>updateMed(i,'prn',e.target.checked)} />PRN</label>
						<button type="button" onClick={()=>removeMed(i)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs" disabled={medications.length===1}>Del</button>
					</div>
					<input className="md:col-span-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-1 text-sm rounded" placeholder="Route (oral)" value={m.route} onChange={e=>updateMed(i,'route',e.target.value)} />
					<input className="md:col-span-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-1 text-sm rounded" placeholder="Instructions (after meal)" value={m.instructions} onChange={e=>updateMed(i,'instructions',e.target.value)} />
				</div>
			))}
			<button type="button" onClick={addMed} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">+ Add Medication</button>
			<textarea className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 text-sm rounded" placeholder="General advice" value={advice} onChange={e=>setAdvice(e.target.value)} />
			<div className="flex gap-4 flex-wrap">
				<input className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-1 rounded" placeholder="Follow-up days" type="number" min="0" value={followUpAfterDays} onChange={e=>setFollow(e.target.value)} />
				<input className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-1 flex-1 rounded" placeholder="Next tests (comma separated)" value={nextTests} onChange={e=>setTests(e.target.value)} />
			</div>
			{error && <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>}
			<button disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 transition-colors">{loading?'Saving...':'Save Prescription'}</button>
		</form>
	);
}


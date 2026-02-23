'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import api from '@/utils/api';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function AftaarPage() {
  const [entries, setEntries] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState(null);

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    totalBill: '',
    participantIds: [],
    note: '',
  });

  useEffect(() => {
    setRole(localStorage.getItem('role'));
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eRes, pRes] = await Promise.all([
        api.get('/aftaar'),
        api.get('/participants'),
      ]);
      setEntries(eRes.data);
      setParticipants(pRes.data.filter((p) => p.isActive));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleParticipant = (id) => {
    setForm((prev) => ({
      ...prev,
      participantIds: prev.participantIds.includes(id)
        ? prev.participantIds.filter((pid) => pid !== id)
        : [...prev.participantIds, id],
    }));
  };

  const selectAll = () => {
    setForm((prev) => ({ ...prev, participantIds: participants.map((p) => p._id) }));
  };

  const deselectAll = () => {
    setForm((prev) => ({ ...prev, participantIds: [] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.participantIds.length === 0) {
      setError('Please select at least one participant.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/aftaar', form);
      setForm({ date: new Date().toISOString().split('T')[0], totalBill: '', participantIds: [], note: '' });
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this Aftaar entry? This will reverse all expense calculations.')) return;
    try {
      await api.delete(`/aftaar/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting entry.');
    }
  };

  const perPerson = form.totalBill && form.participantIds.length > 0
    ? (Number(form.totalBill) / form.participantIds.length).toFixed(2)
    : 0;

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Daily Aftaar</h1>
          <p className="text-sm text-gray-500 mt-1">{entries.length} total entries</p>
        </div>
        {role === 'admin' && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Entry
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-400">No Aftaar entries yet. Create your first entry.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry._id} className="bg-white rounded-lg shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-sm font-semibold text-gray-800">{formatDate(entry.date)}</h3>
                    <span className="badge badge-sm badge-primary badge-outline">
                      {entry.participants.length} participants
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">Total: <span className="font-semibold">{formatCurrency(entry.totalBill)}</span></span>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-600">Per person: <span className="font-semibold">{formatCurrency(entry.perPersonShare)}</span></span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {entry.participants.map((p) => (
                      <span key={p.participant?._id || p._id} className="badge badge-sm badge-ghost">
                        {p.participant?.name || 'Unknown'}
                      </span>
                    ))}
                  </div>
                  {entry.note && <p className="text-xs text-gray-400 mt-2">{entry.note}</p>}
                </div>
                {role === 'admin' && (
                  <button onClick={() => handleDelete(entry._id)} className="btn btn-ghost btn-xs text-error">
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="font-semibold text-lg mb-4">New Aftaar Entry</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text">Date</span></label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input input-bordered input-sm w-full" required />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Total Bill Amount</span></label>
                  <input type="number" value={form.totalBill} onChange={(e) => setForm({ ...form, totalBill: e.target.value })} placeholder="0" className="input input-bordered input-sm w-full" min="1" required />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Select Participants</span>
                  <span className="label-text-alt">{form.participantIds.length} selected</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <button type="button" onClick={selectAll} className="btn btn-xs btn-outline">Select All</button>
                  <button type="button" onClick={deselectAll} className="btn btn-xs btn-outline">Deselect All</button>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {participants.map((p) => (
                    <label key={p._id} className="flex items-center gap-2 cursor-pointer py-1">
                      <input type="checkbox" checked={form.participantIds.includes(p._id)} onChange={() => toggleParticipant(p._id)} className="checkbox checkbox-sm checkbox-primary" />
                      <span className="text-sm">{p.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {form.totalBill && form.participantIds.length > 0 && (
                <div className="bg-base-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Per Person Share</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(perPerson)}</p>
                </div>
              )}

              <div className="form-control">
                <label className="label"><span className="label-text">Note (optional)</span></label>
                <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional note" className="input input-bordered input-sm w-full" />
              </div>

              {error && <p className="text-error text-sm">{error}</p>}

              <div className="modal-action">
                <button type="button" onClick={() => { setShowModal(false); setError(''); }} className="btn btn-ghost">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? <span className="loading loading-spinner loading-sm"></span> : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => { setShowModal(false); setError(''); }}></div>
        </div>
      )}
    </Layout>
  );
}

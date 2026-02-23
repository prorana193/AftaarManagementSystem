'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import api from '@/utils/api';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function DepositsPage() {
  const [deposits, setDeposits] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState(null);

  const [form, setForm] = useState({
    participantId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });

  useEffect(() => {
    setRole(localStorage.getItem('role'));
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dRes, pRes] = await Promise.all([
        api.get('/deposits'),
        api.get('/participants'),
      ]);
      setDeposits(dRes.data);
      setParticipants(pRes.data.filter((p) => p.isActive));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/deposits', form);
      setForm({ participantId: '', amount: '', date: new Date().toISOString().split('T')[0], note: '' });
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error recording deposit.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this deposit? The participant balance will be adjusted.')) return;
    try {
      await api.delete(`/deposits/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting deposit.');
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Deposits</h1>
          <p className="text-sm text-gray-500 mt-1">{deposits.length} total deposits</p>
        </div>
        {role === 'admin' && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Record Deposit
          </button>
        )}
      </div>

      {deposits.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-400">No deposits recorded yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="bg-base-200 text-gray-600">
                  <th>#</th>
                  <th>Participant</th>
                  <th>Date</th>
                  <th className="text-right">Amount</th>
                  <th>Note</th>
                  {role === 'admin' && <th className="text-right">Action</th>}
                </tr>
              </thead>
              <tbody>
                {deposits.map((d, idx) => (
                  <tr key={d._id} className="hover">
                    <td className="text-gray-400 text-sm">{idx + 1}</td>
                    <td className="font-medium text-gray-800">{d.participant?.name || 'Unknown'}</td>
                    <td className="text-sm">{formatDate(d.date)}</td>
                    <td className="text-right text-sm font-semibold text-green-600">+{formatCurrency(d.amount)}</td>
                    <td className="text-sm text-gray-400">{d.note || '-'}</td>
                    {role === 'admin' && (
                      <td className="text-right">
                        <button onClick={() => handleDelete(d._id)} className="btn btn-ghost btn-xs text-error">Delete</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-semibold text-lg mb-4">Record New Deposit</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Participant</span></label>
                <select
                  value={form.participantId}
                  onChange={(e) => setForm({ ...form, participantId: e.target.value })}
                  className="select select-bordered w-full"
                  required
                >
                  <option value="">Select participant</option>
                  {participants.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text">Amount</span></label>
                  <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" className="input input-bordered w-full" min="1" required />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Date</span></label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input input-bordered w-full" required />
                </div>
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">Note (optional)</span></label>
                <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional note" className="input input-bordered w-full" />
              </div>

              {error && <p className="text-error text-sm">{error}</p>}

              <div className="modal-action">
                <button type="button" onClick={() => { setShowModal(false); setError(''); }} className="btn btn-ghost">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? <span className="loading loading-spinner loading-sm"></span> : 'Save Deposit'}
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

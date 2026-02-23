'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import api from '@/utils/api';
import { formatCurrency } from '@/utils/formatters';
import Link from 'next/link';

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState(null);

  useEffect(() => {
    setRole(localStorage.getItem('role'));
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    try {
      const { data } = await api.get('/participants');
      setParticipants(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post('/participants', { name: newName.trim() });
      setNewName('');
      setShowModal(false);
      fetchParticipants();
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding participant.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to remove ${name}?`)) return;
    try {
      await api.delete(`/participants/${id}`);
      fetchParticipants();
    } catch (err) {
      alert(err.response?.data?.message || 'Error removing participant.');
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Participants</h1>
          <p className="text-sm text-gray-500 mt-1">{participants.length} total participants</p>
        </div>
        {role === 'admin' && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Participant
          </button>
        )}
      </div>

      {participants.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-gray-400">No participants yet. Add your first participant to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="bg-base-200 text-gray-600">
                  <th>#</th>
                  <th>Name</th>
                  <th className="text-right">Deposited</th>
                  <th className="text-right">Expense</th>
                  <th className="text-right">Balance</th>
                  <th className="text-center">Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p, idx) => (
                  <tr key={p._id} className="hover">
                    <td className="text-gray-400 text-sm">{idx + 1}</td>
                    <td>
                      <Link href={`/participants/${p._id}`} className="font-medium text-gray-800 hover:text-primary">
                        {p.name}
                      </Link>
                    </td>
                    <td className="text-right text-sm">{formatCurrency(p.totalDeposited)}</td>
                    <td className="text-right text-sm">{formatCurrency(p.totalExpense)}</td>
                    <td className={`text-right text-sm font-semibold ${p.remainingBalance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {formatCurrency(p.remainingBalance)}
                    </td>
                    <td className="text-center">
                      <span className={`badge badge-sm ${p.isActive ? 'badge-success' : 'badge-ghost'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/participants/${p._id}`} className="btn btn-ghost btn-xs">
                          View
                        </Link>
                        {role === 'admin' && (
                          <button onClick={() => handleDelete(p._id, p.name)} className="btn btn-ghost btn-xs text-error">
                            Remove
                          </button>
                        )}
                      </div>
                    </td>
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
            <h3 className="font-semibold text-lg mb-4">Add New Participant</h3>
            <form onSubmit={handleAdd}>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Full Name</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter participant name"
                  className="input input-bordered w-full"
                  required
                  autoFocus
                />
              </div>
              {error && <p className="text-error text-sm mt-2">{error}</p>}
              <div className="modal-action">
                <button type="button" onClick={() => { setShowModal(false); setError(''); }} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? <span className="loading loading-spinner loading-sm"></span> : 'Add'}
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

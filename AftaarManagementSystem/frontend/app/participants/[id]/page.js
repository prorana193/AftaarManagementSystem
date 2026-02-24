'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import api from '@/utils/api';
import { formatCurrency, formatDate } from '@/utils/formatters';
import Link from 'next/link';

export default function ParticipantProfilePage() {
  const params = useParams();
  const id = params.id;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('deposits');

  useEffect(() => {
    if (id) fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get(`/participants/${id}`);
      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;
  if (!profile) return <Layout><p className="text-gray-400">Participant not found.</p></Layout>;

  return (
    <Layout>
      <div className="mb-6">
        <Link href="/participants" className="text-sm text-gray-500 hover:text-primary mb-2 inline-flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Participants
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">{profile.name}</h1>
        <p className="text-sm text-gray-500 mt-1">Participant profile and transaction history</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Deposited" value={formatCurrency(profile.totalDeposited)} color="success" />
        <StatCard title="Total Expense" value={formatCurrency(profile.totalExpense)} color="warning" />
        <StatCard title="Remaining Balance" value={formatCurrency(profile.remainingBalance)} color={profile.remainingBalance >= 0 ? 'success' : 'error'} />
        <StatCard title="Aftaar Participations" value={profile.totalAftaarParticipations} color="info" />
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('deposits')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'deposits' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Deposit History ({profile.deposits.length})
            </button>
            <button
              onClick={() => setActiveTab('aftaar')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'aftaar' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Aftaar History ({profile.aftaarHistory.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'deposits' && (
            <>
              {profile.deposits.length === 0 ? (
                <p className="text-gray-400 text-sm py-4">No deposits recorded.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr className="text-gray-500">
                        <th>#</th>
                        <th>Date</th>
                        <th className="text-right">Amount</th>
                        <th>Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.deposits.map((d, idx) => (
                        <tr key={d._id} className="hover">
                          <td className="text-gray-400 text-sm">{idx + 1}</td>
                          <td className="text-sm">{formatDate(d.date)}</td>
                          <td className="text-right text-sm font-medium text-green-600">+{formatCurrency(d.amount)}</td>
                          <td className="text-sm text-gray-400">{d.note || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === 'aftaar' && (
            <>
              {profile.aftaarHistory.length === 0 ? (
                <p className="text-gray-400 text-sm py-4">No Aftaar participations.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr className="text-gray-500">
                        <th>#</th>
                        <th>Date</th>
                        <th className="text-right">Total Bill</th>
                        <th className="text-right">Your Share</th>
                        <th className="text-right">Participants</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.aftaarHistory.map((a, idx) => (
                        <tr key={a._id} className="hover">
                          <td className="text-gray-400 text-sm">{idx + 1}</td>
                          <td className="text-sm">{formatDate(a.date)}</td>
                          <td className="text-right text-sm">{formatCurrency(a.totalBill)}</td>
                          <td className="text-right text-sm font-medium text-orange-600">-{formatCurrency(a.share)}</td>
                          <td className="text-right text-sm text-gray-500">{a.totalParticipants}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import api from '@/utils/api';
import { formatCurrency, formatDate } from '@/utils/formatters';
import Link from 'next/link';

export default function Dashboard() {
  const [participants, setParticipants] = useState([]);
  const [entries, setEntries] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pRes, eRes, dRes] = await Promise.all([
        api.get('/participants'),
        api.get('/aftaar'),
        api.get('/deposits'),
      ]);
      setParticipants(pRes.data);
      setEntries(eRes.data);
      setDeposits(dRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  const totalDeposits = participants.reduce((sum, p) => sum + p.totalDeposited, 0);
  const totalExpenses = participants.reduce((sum, p) => sum + p.totalExpense, 0);
  const totalBalance = totalDeposits - totalExpenses;

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your Aftaar expense tracking</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Participants"
          value={participants.length}
          icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          color="primary"
        />
        <StatCard
          title="Total Deposits"
          value={formatCurrency(totalDeposits)}
          icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          color="success"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(totalExpenses)}
          icon="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
          color="warning"
        />
        <StatCard
          title="Net Balance"
          value={formatCurrency(totalBalance)}
          subtitle={totalBalance >= 0 ? 'Surplus' : 'Deficit'}
          icon="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          color={totalBalance >= 0 ? 'success' : 'error'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Participant Balances</h2>
            <Link href="/participants" className="text-sm text-primary hover:underline">View All</Link>
          </div>
          {participants.length === 0 ? (
            <p className="text-gray-400 text-sm py-4">No participants added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr className="text-gray-500">
                    <th>Name</th>
                    <th className="text-right">Deposited</th>
                    <th className="text-right">Expense</th>
                    <th className="text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.slice(0, 8).map((p) => (
                    <tr key={p._id} className="hover">
                      <td>
                        <Link href={`/participants/${p._id}`} className="font-medium text-gray-700 hover:text-primary">
                          {p.name}
                        </Link>
                      </td>
                      <td className="text-right text-sm">{formatCurrency(p.totalDeposited)}</td>
                      <td className="text-right text-sm">{formatCurrency(p.totalExpense)}</td>
                      <td className={`text-right text-sm font-medium ${p.remainingBalance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {formatCurrency(p.remainingBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Recent Aftaar Entries</h2>
            <Link href="/aftaar" className="text-sm text-primary hover:underline">View All</Link>
          </div>
          {entries.length === 0 ? (
            <p className="text-gray-400 text-sm py-4">No Aftaar entries yet.</p>
          ) : (
            <div className="space-y-3">
              {entries.slice(0, 5).map((entry) => (
                <div key={entry._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{formatDate(entry.date)}</p>
                    <p className="text-xs text-gray-400">
                      {entry.participants.length} participants
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">{formatCurrency(entry.totalBill)}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(entry.perPersonShare)} / person</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

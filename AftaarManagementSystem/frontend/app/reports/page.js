'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import api from '@/utils/api';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const { data } = await api.get('/aftaar/report');
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    setGenerating(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch('/api/reports/pdf', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to generate PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'aftaar-report.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error generating PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;
  if (!report) return <Layout><p className="text-gray-400">Unable to load report data.</p></Layout>;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Full summary and PDF export</p>
        </div>
        <button onClick={handleGeneratePDF} disabled={generating} className="btn btn-primary btn-sm">
          {generating ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard title="Participants" value={report.summary.totalParticipants} color="primary" />
        <StatCard title="Aftaar Days" value={report.summary.totalAftaarDays} color="info" />
        <StatCard title="Total Deposits" value={formatCurrency(report.summary.totalDeposits)} color="success" />
        <StatCard title="Total Expenses" value={formatCurrency(report.summary.totalExpenses)} color="warning" />
        <StatCard title="Net Balance" value={formatCurrency(report.summary.totalBalance)} color={report.summary.totalBalance >= 0 ? 'success' : 'error'} />
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">All Participants</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="bg-base-200 text-gray-600">
                <th>#</th>
                <th>Name</th>
                <th className="text-right">Deposited</th>
                <th className="text-right">Expense</th>
                <th className="text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {report.participants.map((p, idx) => (
                <tr key={idx} className="hover">
                  <td className="text-gray-400 text-sm">{idx + 1}</td>
                  <td className="font-medium">{p.name}</td>
                  <td className="text-right text-sm">{formatCurrency(p.totalDeposited)}</td>
                  <td className="text-right text-sm">{formatCurrency(p.totalExpense)}</td>
                  <td className={`text-right text-sm font-semibold ${p.remainingBalance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {formatCurrency(p.remainingBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Recent Aftaar Entries</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr className="text-gray-500">
                  <th>Date</th>
                  <th className="text-right">Bill</th>
                  <th className="text-right">Per Person</th>
                  <th className="text-right">Count</th>
                </tr>
              </thead>
              <tbody>
                {report.aftaarEntries.slice(0, 10).map((e) => (
                  <tr key={e._id} className="hover">
                    <td className="text-sm">{formatDate(e.date)}</td>
                    <td className="text-right text-sm">{formatCurrency(e.totalBill)}</td>
                    <td className="text-right text-sm">{formatCurrency(e.perPersonShare)}</td>
                    <td className="text-right text-sm">{e.participants.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Recent Deposits</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr className="text-gray-500">
                  <th>Participant</th>
                  <th>Date</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {report.deposits.slice(0, 10).map((d) => (
                  <tr key={d._id} className="hover">
                    <td className="text-sm font-medium">{d.participant?.name || 'Unknown'}</td>
                    <td className="text-sm">{formatDate(d.date)}</td>
                    <td className="text-right text-sm font-semibold text-green-600">+{formatCurrency(d.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

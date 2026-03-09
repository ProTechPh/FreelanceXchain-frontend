import { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Filter,
  Download,
  RefreshCw,
  Search
} from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../lib/api';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  payload: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  status: 'success' | 'failure' | 'pending';
  error_message: string | null;
  created_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  user_login: 'Logged In',
  user_logout: 'Logged Out',
  user_signup: 'Account Created',
  user_password_change: 'Password Changed',
  user_updated: 'Profile Updated',
  mfa_enabled: 'MFA Enabled',
  mfa_disabled: 'MFA Disabled',
  mfa_verified: 'MFA Verified',
  contract_created: 'Contract Created',
  contract_signed: 'Contract Signed',
  contract_updated: 'Contract Updated',
  contract_cancelled: 'Contract Cancelled',
  payment_initiated: 'Payment Initiated',
  payment_completed: 'Payment Completed',
  payment_failed: 'Payment Failed',
  payment_refunded: 'Payment Refunded',
  dispute_created: 'Dispute Created',
  dispute_resolved: 'Dispute Resolved',
  dispute_escalated: 'Dispute Escalated',
  project_created: 'Project Created',
  project_updated: 'Project Updated',
  proposal_submitted: 'Proposal Submitted',
  proposal_accepted: 'Proposal Accepted',
  kyc_submitted: 'KYC Submitted',
  kyc_approved: 'KYC Approved',
  kyc_rejected: 'KYC Rejected',
};

const RESOURCE_ICONS: Record<string, string> = {
  auth: '🔐',
  user: '👤',
  contract: '📄',
  payment: '💰',
  dispute: '⚖️',
  project: '📋',
  proposal: '📝',
  kyc: '✅',
};

export function ActivityLogPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failure'>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await api.getMyAuditLogs(500); // Fetch more for client-side pagination
      setLogs(response.logs);
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Failed to Load',
        message: error.message || 'Failed to fetch activity logs',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAuditLogs();
    showToast({
      type: 'info',
      title: 'Refreshing',
      message: 'Loading latest activity logs...',
    });
  };

  const handleExport = () => {
    // Convert logs to CSV
    const headers = ['Date', 'Action', 'Resource', 'Status', 'IP Address'];
    const rows = filteredLogs.map(log => [
      format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      getActionLabel(log.action),
      log.resource_type,
      log.status,
      log.ip_address || 'N/A',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showToast({
      type: 'success',
      title: 'Exported',
      message: 'Activity log exported successfully',
    });
  };

  const getActionLabel = (action: string): string => {
    return ACTION_LABELS[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failure':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      failure: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      getActionLabel(log.action).toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Log</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View your account activity and security events
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="failure">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Items per page */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-dark-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{logs.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Events</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">{filteredLogs.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Filtered</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">
                {logs.filter(l => l.status === 'success').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Successful</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">
                {logs.filter(l => l.status === 'failure').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Activity List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {filteredLogs.length === 0 ? 'No activity logs found' : 'No logs on this page'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    className="hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusIcon(log.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{RESOURCE_ICONS[log.resource_type] || '📌'}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {getActionLabel(log.action)}
                          </p>
                          {log.error_message && (
                            <p className="text-xs text-red-500 mt-1">{log.error_message}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {log.resource_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {format(new Date(log.created_at), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(log.created_at), 'HH:mm:ss')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                        {log.ip_address || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-dark-border flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length} entries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-bg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {/* Page numbers */}
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 rounded border ${
                        currentPage === pageNum
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-bg'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-bg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      {selectedLog && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div 
            className="bg-white dark:bg-dark-card rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-dark-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Activity Details
                </h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Action</label>
                <p className="text-gray-900 dark:text-white mt-1">{getActionLabel(selectedLog.action)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                <div className="mt-1">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(selectedLog.status)}`}>
                    {selectedLog.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Resource Type</label>
                <p className="text-gray-900 dark:text-white mt-1 capitalize">{selectedLog.resource_type}</p>
              </div>

              {selectedLog.resource_id && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Resource ID</label>
                  <p className="text-gray-900 dark:text-white mt-1 font-mono text-sm">{selectedLog.resource_id}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date & Time</label>
                <p className="text-gray-900 dark:text-white mt-1">
                  {format(new Date(selectedLog.created_at), 'MMMM dd, yyyy HH:mm:ss')}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">IP Address</label>
                <p className="text-gray-900 dark:text-white mt-1 font-mono">{selectedLog.ip_address || 'N/A'}</p>
              </div>

              {selectedLog.user_agent && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">User Agent</label>
                  <p className="text-gray-900 dark:text-white mt-1 text-sm break-all">{selectedLog.user_agent}</p>
                </div>
              )}

              {selectedLog.error_message && (
                <div>
                  <label className="text-sm font-medium text-red-600 dark:text-red-400">Error Message</label>
                  <p className="text-red-900 dark:text-red-300 mt-1">{selectedLog.error_message}</p>
                </div>
              )}

              {Object.keys(selectedLog.payload).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Additional Data</label>
                  <pre className="mt-1 p-3 bg-gray-50 dark:bg-dark-bg rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle,
  ChevronRight,
  Calendar,
  User,
  FileText
} from 'lucide-react';
import { Card, PageLoader, StatusBadge, Button } from '../../components/ui';
import api from '../../lib/api';
import type { Dispute } from '../../types';
import { format } from 'date-fns';
import { useAuthStore } from '../../store';

export function DisputesListPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        const data = await api.getDisputes();
        setDisputes(data.items);
      } catch (error) {
        console.error('Error fetching disputes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDisputes();
  }, []);

  const filteredDisputes = filter === 'all' 
    ? disputes 
    : disputes.filter(d => d.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-yellow-400';
      case 'under_review':
        return 'text-blue-400';
      case 'resolved':
        return 'text-green-400';
      case 'escalated':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Disputes</h1>
          <p className="text-gray-400 mt-1">
            Manage and track your dispute cases
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-900/50 to-dark-surface">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-600/20 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Open</p>
              <p className="text-2xl font-bold text-white">
                {disputes.filter(d => d.status === 'open').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-900/50 to-dark-surface">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Under Review</p>
              <p className="text-2xl font-bold text-white">
                {disputes.filter(d => d.status === 'under_review').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-900/50 to-dark-surface">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-600/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Resolved</p>
              <p className="text-2xl font-bold text-white">
                {disputes.filter(d => d.status === 'resolved').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-900/50 to-dark-surface">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-600/20 rounded-lg">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Escalated</p>
              <p className="text-2xl font-bold text-white">
                {disputes.filter(d => d.status === 'escalated').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'open', 'under_review', 'resolved', 'escalated'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-primary-600 text-white'
                : 'bg-dark-surface text-gray-400 hover:text-white hover:bg-dark-border'
            }`}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
          </button>
        ))}
      </div>

      {/* Disputes List */}
      {filteredDisputes.length === 0 ? (
        <Card className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400">No disputes found</h3>
          <p className="text-gray-500 mt-2">
            {filter === 'all' 
              ? "You don't have any disputes." 
              : `No ${filter.replace('_', ' ')} disputes found.`}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDisputes.map((dispute) => (
            <Card key={dispute.id} className="hover:border-primary-500/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className={`w-5 h-5 ${getStatusColor(dispute.status)}`} />
                    <Link 
                      to={`/disputes/${dispute.id}`}
                      className="text-lg font-semibold text-white hover:text-primary-400 transition-colors"
                    >
                      Dispute #{dispute.id.slice(0, 8)}
                    </Link>
                    <StatusBadge status={dispute.status} />
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {dispute.reason}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span>Contract ID: {dispute.contractId.slice(0, 8)}...</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Opened {format(new Date(dispute.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>
                        {dispute.initiatorId === user?.id ? 'Initiated by you' : 'Initiated by other party'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Link to={`/disputes/${dispute.id}`}>
                    <Button size="sm" variant="outline">
                      View Details
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Evidence count */}
              {dispute.evidence && dispute.evidence.length > 0 && (
                <div className="mt-4 pt-4 border-t border-dark-border">
                  <p className="text-sm text-gray-400">
                    {dispute.evidence.length} evidence file(s) submitted
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

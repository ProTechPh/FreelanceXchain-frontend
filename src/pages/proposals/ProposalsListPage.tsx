import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  DollarSign,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { Card, PageLoader, StatusBadge, Button } from '../../components/ui';
import api from '../../lib/api';
import type { Proposal } from '../../types';
import { format } from 'date-fns';

export function ProposalsListPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const data = await api.getMyProposals();
        setProposals(data);
      } catch (error) {
        console.error('Error fetching proposals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, []);

  const filteredProposals = filter === 'all' 
    ? proposals 
    : proposals.filter(p => p.status === filter);

  const handleWithdraw = async (id: string) => {
    try {
      await api.withdrawProposal(id);
      // Refresh proposals
      const data = await api.getMyProposals();
      setProposals(data);
    } catch (error) {
      console.error('Error withdrawing proposal:', error);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6" data-tour-id="proposals-main">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Proposals</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track and manage your submitted proposals
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'accepted', 'rejected', 'withdrawn'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-dark-surface text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-dark-border'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/50 dark:to-dark-surface">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-600/20 rounded-lg">
              <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Proposals</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{proposals.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/50 dark:to-dark-surface">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-600/20 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {proposals.filter(p => p.status === 'pending').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/50 dark:to-dark-surface">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-600/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Accepted</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {proposals.filter(p => p.status === 'accepted').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/50 dark:to-dark-surface">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-600/20 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Rejected</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {proposals.filter(p => p.status === 'rejected').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Proposals List */}
      {filteredProposals.length === 0 ? (
        <Card className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-400">No proposals found</h3>
          <p className="text-gray-600 dark:text-gray-500 mt-2">
            {filter === 'all'
              ? "You haven't submitted any proposals yet."
              : `No ${filter} proposals found.`}
          </p>
          <Link to="/projects">
            <Button className="mt-4">Browse Projects</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProposals.map((proposal) => (
            <Card key={proposal.id} className="hover:border-primary-500/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Link 
                      to={`/projects/${proposal.projectId}`}
                      className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary-400 transition-colors"
                    >
                      {proposal.project?.title || 'Project'}
                    </Link>
                    <StatusBadge status={proposal.status} />
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {proposal.coverLetter}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-primary-600 dark:text-primary-400 font-medium">
                        {proposal.proposedRate} ETH
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {proposal.estimatedDuration} days
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        Submitted {format(new Date(proposal.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {proposal.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleWithdraw(proposal.id)}
                    >
                      Withdraw
                    </Button>
                  )}
                  
                  {proposal.status === 'accepted' && (
                    <Link to={`/contracts`}>
                      <Button size="sm">
                        View Contract
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                  
                  <Link
                    to={`/projects/${proposal.projectId}`}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1"
                  >
                    View Project
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Milestones preview */}
              {proposal.milestones && proposal.milestones.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Proposed Milestones ({proposal.milestones.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {proposal.milestones.slice(0, 3).map((milestone, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 dark:bg-dark-bg rounded-full text-sm text-gray-700 dark:text-gray-300"
                      >
                        {milestone.title} - {milestone.amount} ETH
                      </span>
                    ))}
                    {proposal.milestones.length > 3 && (
                      <span className="px-3 py-1 bg-gray-100 dark:bg-dark-bg rounded-full text-sm text-gray-600 dark:text-gray-400">
                        +{proposal.milestones.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle,
  DollarSign,
  ChevronRight
} from 'lucide-react';
import { Card, PageLoader, StatusBadge } from '../../components/ui';
import api from '../../lib/api';
import type { Contract, ContractMilestone } from '../../types';
import { format } from 'date-fns';

export function ContractsListPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const data = await api.getMyContracts();
        setContracts(data);
      } catch (error) {
        console.error('Error fetching contracts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, []);

  const filteredContracts = filter === 'all' 
    ? contracts 
    : contracts.filter(c => c.status === filter);

  const getProgressPercentage = (contract: Contract) => {
    if (!contract.milestones.length) {
      return contract.status === 'completed' ? 100 : 0;
    }
    const completed = contract.milestones.filter(
      (m: ContractMilestone) => m.status === 'approved'
    ).length;
    return Math.round((completed / contract.milestones.length) * 100);
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6" data-tour-id="contracts-main">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Contracts</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your active and past contracts
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'active', 'completed', 'disputed', 'draft'].map((status) => (
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
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Contracts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{contracts.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/50 dark:to-dark-surface">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-600/20 rounded-lg">
              <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Active</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {contracts.filter(c => c.status === 'active').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-dark-surface">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {contracts.filter(c => c.status === 'completed').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/50 dark:to-dark-surface">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-600/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {contracts.reduce((sum, c) => sum + c.totalAmount, 0).toFixed(2)} ETH
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Contracts List */}
      {filteredContracts.length === 0 ? (
        <Card className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-400">No contracts found</h3>
          <p className="text-gray-600 dark:text-gray-500 mt-2">
            {filter === 'all'
              ? "You don't have any contracts yet."
              : `No ${filter} contracts found.`}
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {filteredContracts.map((contract) => (
            <Link key={contract.id} to={`/contracts/${contract.id}`} className="block mb-6">
              <Card className="hover:border-primary-500/50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {contract.title}
                      </h3>
                      <StatusBadge status={contract.status} />
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {contract.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span>{contract.totalAmount} ETH</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          Started {format(new Date(contract.startDate), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {contract.endDate && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          <span>
                            Due {format(new Date(contract.endDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {getProgressPercentage(contract)}%
                      </p>
                    </div>
                    
                    <div className="w-32 h-2 bg-gray-200 dark:bg-dark-bg rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all"
                        style={{ width: `${getProgressPercentage(contract)}%` }}
                      />
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>

                {/* Milestones preview */}
                {contract.milestones.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Milestones ({contract.milestones.filter((m: ContractMilestone) => m.status === 'approved').length}/{contract.milestones.length})
                    </p>
                    <div className="flex gap-1">
                      {contract.milestones.map((milestone: ContractMilestone, index: number) => (
                        <div
                          key={milestone.id || index}
                          className={`flex-1 h-2 rounded-full ${
                            milestone.status === 'approved'
                              ? 'bg-green-500'
                              : milestone.status === 'submitted'
                              ? 'bg-yellow-500'
                              : milestone.status === 'disputed'
                              ? 'bg-red-500'
                              : 'bg-gray-300 dark:bg-dark-border'
                          }`}
                          title={`${milestone.title} - ${milestone.status}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Card, Button, Badge, Input, Loader, Modal } from '../../components/ui';
import { FiSearch, FiShield, FiEdit, FiEye } from 'react-icons/fi';
import api from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';

// Extended User type for admin view
interface AdminUser {
  id: string;
  email: string;
  role: 'freelancer' | 'employer' | 'admin';
  walletAddress: string;
  createdAt: string;
  name?: string;
  avatarUrl?: string;
  kycVerified: boolean;
  isActive: boolean;
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    role: '' as 'freelancer' | 'employer' | 'admin',
    isActive: true,
  });
  const { showToast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch real users from API
      const usersData = await api.getAdminUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeVariant = (role: string): 'primary' | 'success' | 'warning' | 'info' => {
    switch (role) {
      case 'admin': return 'primary';
      case 'freelancer': return 'success';
      case 'employer': return 'info';
      default: return 'warning';
    }
  };

  const handleViewUser = (user: AdminUser) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name || '',
      role: user.role,
      isActive: user.isActive,
    });
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    setEditFormData({ name: '', role: 'freelancer', isActive: true });
  };

  const handleSubmitEdit = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      await api.updateAdminUser(selectedUser.id, {
        name: editFormData.name.trim() || undefined,
        role: editFormData.role,
        isActive: editFormData.isActive,
      });

      showToast({
        type: 'success',
        title: 'Success',
        message: 'User updated successfully',
      });

      handleCloseEditModal();
      fetchUsers(); // Refresh the list
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to update user',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManageRole = (user: AdminUser) => {
    showToast({
      type: 'info',
      title: 'Manage Role',
      message: `Managing role for: ${user.email}`,
    });
    // TODO: Implement role management
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all registered users on the platform</p>
        </div>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Roles</option>
            <option value="freelancer">Freelancers</option>
            <option value="employer">Employers</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </Card>

      {/* Users Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400">User</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Role</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400">KYC Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Joined</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-600 dark:text-gray-400">
                    {users.length === 0 ? 'No users found' : 'No users match your filters'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-dark-border flex items-center justify-center">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                              {(user.name || user.email).charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium">{user.name || user.email.split('@')[0]}</p>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'admin' ? (
                        <Badge variant="info">
                          Exempt
                        </Badge>
                      ) : (
                        <Badge variant={user.kycVerified ? 'success' : 'warning'}>
                          {user.kycVerified ? 'Verified' : 'Pending'}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={user.isActive ? 'success' : 'error'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-2 text-gray-600 dark:text-gray-600 hover:text-gray-900 dark:hover:text-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-100"
                          onClick={() => handleViewUser(user)}
                          title="View user details"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-gray-600 dark:text-gray-600 hover:text-gray-900 dark:hover:text-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-100"
                          onClick={() => handleEditUser(user)}
                          title="Edit user"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-gray-600 dark:text-gray-600 hover:text-gray-900 dark:hover:text-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-100"
                          onClick={() => handleManageRole(user)}
                          title="Manage role"
                        >
                          <FiShield className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Total Users</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {users.filter(u => u.role === 'freelancer').length}
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Freelancers</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {users.filter(u => u.role === 'employer').length}
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Employers</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-primary-400">
              {users.filter(u => u.kycVerified).length}
            </p>
            <p className="text-gray-400 text-sm">KYC Verified</p>
          </div>
        </Card>
      </div>

      {/* View User Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={handleCloseViewModal}
        title="User Details"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-dark-border">
              <div className="w-16 h-16 rounded-full bg-dark-card border border-dark-border flex items-center justify-center">
                {selectedUser.avatarUrl ? (
                  <img 
                    src={selectedUser.avatarUrl} 
                    alt={selectedUser.name} 
                    className="w-full h-full rounded-full object-cover" 
                  />
                ) : (
                  <span className="text-2xl font-medium text-primary-400">
                    {(selectedUser.name || selectedUser.email).charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedUser.name || selectedUser.email.split('@')[0]}
                </h3>
                <p className="text-gray-400">{selectedUser.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  User ID
                </label>
                <p className="text-gray-900 dark:text-white font-mono text-sm">{selectedUser.id}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Role
                </label>
                <Badge variant={getRoleBadgeVariant(selectedUser.role)}>
                  {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                </Badge>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  KYC Status
                </label>
                {selectedUser.role === 'admin' ? (
                  <Badge variant="info">Exempt</Badge>
                ) : (
                  <Badge variant={selectedUser.kycVerified ? 'success' : 'warning'}>
                    {selectedUser.kycVerified ? 'Verified' : 'Pending'}
                  </Badge>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Account Status
                </label>
                <Badge variant={selectedUser.isActive ? 'success' : 'error'}>
                  {selectedUser.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Wallet Address
                </label>
                <p className="text-gray-900 dark:text-white font-mono text-xs break-all">
                  {selectedUser.walletAddress || 'Not connected'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Joined Date
                </label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-dark-border">
              <Button
                variant="secondary"
                onClick={handleCloseViewModal}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  handleCloseViewModal();
                  handleEditUser(selectedUser);
                }}
                className="flex-1"
              >
                Edit User
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title="Edit User"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="pb-4 border-b border-dark-border">
              <p className="text-sm text-gray-400">Editing user</p>
              <p className="text-gray-900 dark:text-white font-medium">{selectedUser.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Name
              </label>
              <Input
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="Enter user name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Role
              </label>
              <select
                value={editFormData.role}
                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as any })}
                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={selectedUser.id === users.find(u => u.role === 'admin')?.id}
              >
                <option value="freelancer">Freelancer</option>
                <option value="employer">Employer</option>
                <option value="admin">Admin</option>
              </select>
              {selectedUser.id === users.find(u => u.role === 'admin')?.id && (
                <p className="text-xs text-gray-400 mt-1">
                  You cannot change your own role
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Account Status
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isActive"
                    checked={editFormData.isActive === true}
                    onChange={() => setEditFormData({ ...editFormData, isActive: true })}
                    className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-gray-900 dark:text-white">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isActive"
                    checked={editFormData.isActive === false}
                    onChange={() => setEditFormData({ ...editFormData, isActive: false })}
                    className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-gray-900 dark:text-white">Inactive</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-dark-border">
              <Button
                variant="secondary"
                onClick={handleCloseEditModal}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitEdit}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

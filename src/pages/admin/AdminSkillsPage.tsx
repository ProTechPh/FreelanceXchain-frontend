import { useState, useEffect } from 'react';
import { Card, Button, Badge, Input, Loader, Modal, Textarea } from '../../components/ui';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiTag, FiLayers } from 'react-icons/fi';
import api from '../../lib/api';
import type { SkillCategory, Skill } from '../../types';
import { useToast } from '../../contexts/ToastContext';

interface SkillWithUsage extends Skill {
  usageCount?: number;
}

interface CategoryWithCount extends SkillCategory {
  skillCount?: number;
}

export function AdminSkillsPage() {
  const [activeTab, setActiveTab] = useState<'skills' | 'categories'>('skills');
  const [skills, setSkills] = useState<SkillWithUsage[]>([]);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch real data from API
      const [categoriesData, skillsData] = await Promise.all([
        api.getSkillCategories().catch(() => []),
        api.getAllSkills().catch(() => []),
      ]);

      // Calculate skill count for each category
      const categoriesWithCount = categoriesData.map(cat => ({
        ...cat,
        skillCount: skillsData.filter(s => s.categoryId === cat.id).length,
      }));

      setCategories(categoriesWithCount);
      
      // Add usage count (placeholder for now, can be calculated from freelancer profiles)
      const skillsWithUsage = skillsData.map(skill => ({
        ...skill,
        usageCount: 0, // TODO: Calculate from freelancer profiles
      }));
      
      setSkills(skillsWithUsage);
    } catch (error) {
      console.error('Error fetching skills data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || skill.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setFormData({ name: '', description: '', categoryId: '' });
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setFormData({ name: '', description: '', categoryId: '' });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Name and description are required',
      });
      return;
    }

    if (activeTab === 'skills' && !formData.categoryId) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select a category',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (activeTab === 'categories') {
        await api.createSkillCategory({
          name: formData.name.trim(),
          description: formData.description.trim(),
        });
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Category created successfully',
        });
      } else {
        await api.createSkill({
          categoryId: formData.categoryId,
          name: formData.name.trim(),
          description: formData.description.trim(),
        });
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Skill created successfully',
        });
      }
      handleCloseAddModal();
      fetchData();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        message: error.message || `Failed to create ${activeTab === 'skills' ? 'skill' : 'category'}`,
      });
    } finally {
      setIsSubmitting(false);
    }
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
          <h1 className="text-2xl font-bold text-white">Skills Management</h1>
          <p className="text-gray-400 mt-1">Manage skill categories and individual skills</p>
        </div>
        <Button onClick={handleOpenAddModal}>
          <FiPlus className="mr-2" />
          Add {activeTab === 'skills' ? 'Skill' : 'Category'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-dark-border">
        <button
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'skills'
              ? 'border-primary-500 text-primary-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('skills')}
        >
          Skills
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'categories'
              ? 'border-primary-500 text-primary-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('categories')}
        >
          Categories
        </button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {activeTab === 'skills' && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          )}
        </div>
      </Card>

      {/* Content */}
      {activeTab === 'skills' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <div className="p-8 text-center">
                  <FiTag className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No skills found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {searchQuery || selectedCategory !== 'all' 
                      ? 'Try adjusting your filters' 
                      : 'Add skills to get started'}
                  </p>
                </div>
              </Card>
            </div>
          ) : (
            filteredSkills.map((skill) => (
            <Card key={skill.id} hover>
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <FiTag className="text-primary-400" />
                    <h3 className="font-medium text-white">{skill.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1 text-gray-400 hover:text-white transition-colors">
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-400 transition-colors">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{skill.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <Badge variant="secondary" className="text-xs">
                    {categories.find(c => c.id === skill.categoryId)?.name || 'Uncategorized'}
                  </Badge>
                  <span>Used in {skill.usageCount || 0} profiles</span>
                </div>
              </div>
            </Card>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <div className="p-8 text-center">
                  <FiLayers className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No categories found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {searchQuery ? 'Try adjusting your search' : 'Add categories to get started'}
                  </p>
                </div>
              </Card>
            </div>
          ) : (
            filteredCategories.map((category) => (
            <Card key={category.id} hover>
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <FiLayers className="text-blue-400" />
                    <h3 className="font-medium text-white">{category.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1 text-gray-400 hover:text-white transition-colors">
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-400 transition-colors">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{category.description || 'No description'}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{category.skillCount || 0} skills</span>
                  <Badge variant="info" className="text-xs">{category.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
              </div>
            </Card>
            ))
          )}
        </div>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        title={`Add ${activeTab === 'skills' ? 'Skill' : 'Category'}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={`Enter ${activeTab === 'skills' ? 'skill' : 'category'} name`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={`Enter ${activeTab === 'skills' ? 'skill' : 'category'} description`}
              rows={4}
            />
          </div>

          {activeTab === 'skills' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={handleCloseAddModal}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Wallet } from 'lucide-react';
import { Card, CardHeader, Button, Input } from '../../components/ui';
import { useWalletStore } from '../../store';
import { useToast } from '../../contexts/ToastContext';
import api from '../../lib/api';
import type { SkillCategory, Skill } from '../../types';

interface MilestoneInput {
  title: string;
  description: string;
  amount: string;
  dueDate: string;
}

export function CreateProjectPage() {
  const navigate = useNavigate();
  const { isConnected, connect } = useWalletStore();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    deadline: '',
  });
  const [selectedSkills, setSelectedSkills] = useState<Array<{ skillId: string; skillName: string }>>([]);
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { title: '', description: '', amount: '', dueDate: '' }
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await api.getSkillCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      const fetchSkills = async () => {
        try {
          const data = await api.getSkillsByCategory(selectedCategory);
          setSkills(data);
        } catch (error) {
          console.error('Error fetching skills:', error);
        }
      };
      fetchSkills();
    }
  }, [selectedCategory]);

  const handleAddSkill = (skillId: string) => {
    const skill = skills.find(s => s.id === skillId);
    if (skill && !selectedSkills.find(s => s.skillId === skillId)) {
      setSelectedSkills([...selectedSkills, { skillId: skill.id, skillName: skill.name }]);
    }
  };

  const handleRemoveSkill = (skillId: string) => {
    setSelectedSkills(selectedSkills.filter(s => s.skillId !== skillId));
  };

  const handleAddMilestone = () => {
    setMilestones([...milestones, { title: '', description: '', amount: '', dueDate: '' }]);
  };

  const handleRemoveMilestone = (index: number) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((_, i) => i !== index));
    }
  };

  const handleMilestoneChange = (index: number, field: keyof MilestoneInput, value: string) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.budget || parseFloat(formData.budget) <= 0) newErrors.budget = 'Valid budget is required';
    if (!formData.deadline) newErrors.deadline = 'Deadline is required';
    if (selectedSkills.length === 0) newErrors.skills = 'At least one skill is required';

    const validMilestones = milestones.filter(m => m.title.trim());
    if (validMilestones.length === 0) {
      newErrors.milestones = 'At least one milestone is required';
    } else {
      // Validate milestone amounts sum to total budget
      const totalBudget = parseFloat(formData.budget) || 0;
      const milestonesSum = validMilestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
      
      if (Math.abs(milestonesSum - totalBudget) > 0.000001) { // Use small epsilon for floating point comparison
        newErrors.milestones = `Milestone amounts must sum to total budget. Current sum: ${milestonesSum.toFixed(2)} ETH, Budget: ${totalBudget.toFixed(2)} ETH`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent, publish = false) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Create project
      const project = await api.createProject({
        title: formData.title,
        description: formData.description,
        budget: parseFloat(formData.budget),
        deadline: formData.deadline,
        requiredSkills: selectedSkills.map(s => ({ skillId: s.skillId })),
      });

      // Add milestones
      const validMilestones = milestones.filter(m => m.title.trim());
      if (validMilestones.length > 0) {
        await api.addMilestones(project.id, {
          milestones: validMilestones.map(m => ({
            title: m.title,
            description: m.description,
            amount: parseFloat(m.amount) || 0,
            dueDate: m.dueDate,
          })),
        });
      }

      // Publish if requested
      if (publish) {
        await api.publishProject(project.id);
        success('Project published successfully!', 'Success');
      } else {
        success('Project saved as draft successfully!', 'Success');
      }

      navigate(`/projects/${project.id}`);
    } catch (err) {
      console.error('Error creating project:', err);
      error(
        err instanceof Error ? err.message : 'Failed to create project. Please try again.',
        'Error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6" data-tour-id="create-project-main">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/projects/manage">
          <Button variant="ghost">
            <ArrowLeft className="w-5 h-5" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Project</h1>
      </div>

      {/* Wallet Connection Warning */}
      {!isConnected && (
        <Card className="border-yellow-200 dark:border-yellow-500/50 bg-yellow-50 dark:bg-yellow-500/10">
          <div className="flex items-start gap-4">
            <Wallet className="w-6 h-6 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-yellow-700 dark:text-yellow-500 font-semibold mb-2">Wallet Not Connected</h3>
              <p className="text-yellow-700 dark:text-gray-300 text-sm mb-4">
                You need to connect your wallet to create a project. Projects require blockchain transactions for escrow and milestone payments.
              </p>
              <Button onClick={connect} variant="outline" size="sm">
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </Button>
            </div>
          </div>
        </Card>
      )}

      <form onSubmit={(e) => handleSubmit(e, false)}>
        {/* Basic Info */}
        <Card className="mb-6">
          <CardHeader title="Project Details" description="Describe your project to attract the right freelancers" />
          
          <div className="space-y-4">
            <Input
              label="Project Title *"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Build a React dashboard"
              error={errors.title}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="w-full bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                placeholder="Describe your project requirements, goals, and any specific needs..."
              />
              {errors.description && (
                <p className="text-red-400 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                type="number"
                step="0.01"
                min="0"
                label="Budget (ETH) *"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="1.00"
                error={errors.budget}
              />
              <Input
                type="date"
                label="Deadline *"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                error={errors.deadline}
              />
            </div>
          </div>
        </Card>

        {/* Skills */}
        <Card className="mb-6">
          <CardHeader title="Required Skills" description="Select skills needed for this project" />
          
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skill
                </label>
                <select
                  value=""
                  onChange={(e) => handleAddSkill(e.target.value)}
                  className="w-full bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                  disabled={!selectedCategory}
                >
                  <option value="">Add a skill</option>
                  {skills.filter(s => !selectedSkills.find(sel => sel.skillId === s.id)).map(skill => (
                    <option key={skill.id} value={skill.id}>{skill.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map(skill => (
                  <span
                    key={skill.skillId}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-400 rounded-full text-sm"
                  >
                    {skill.skillName}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill.skillId)}
                      className="hover:text-primary-600 dark:hover:text-primary-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {errors.skills && (
              <p className="text-red-400 text-sm">{errors.skills}</p>
            )}
          </div>
        </Card>

        {/* Milestones */}
        <Card className="mb-6">
          <CardHeader
            title="Milestones"
            description="Break your project into milestones for structured payments"
            action={
              <Button type="button" variant="outline" size="sm" onClick={handleAddMilestone}>
                <Plus className="w-4 h-4" />
                Add Milestone
              </Button>
            }
          />
          
          <div className="space-y-4">
            {/* Budget Tracker */}
            {formData.budget && parseFloat(formData.budget) > 0 && (
              <div className="p-4 bg-gray-50 dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-dark-border">
                <h4 className="text-gray-900 dark:text-white font-medium mb-3 text-sm">Milestone Budget Allocation</h4>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Project Budget:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{parseFloat(formData.budget).toFixed(2)} ETH</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-gray-600 dark:text-gray-400">Allocated to Milestones:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0).toFixed(2)} ETH
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-gray-200 dark:border-dark-border">
                  <span className="text-gray-600 dark:text-gray-400">Unallocated Budget:</span>
                  <span className={`font-medium ${
                    Math.abs((parseFloat(formData.budget) || 0) - milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0)) < 0.000001
                      ? 'text-green-400'
                      : (parseFloat(formData.budget) || 0) - milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0) < 0
                      ? 'text-red-400'
                      : 'text-yellow-400'
                  }`}>
                    {((parseFloat(formData.budget) || 0) - milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0)).toFixed(2)} ETH
                  </span>
                </div>
                {Math.abs((parseFloat(formData.budget) || 0) - milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0)) < 0.000001 ? (
                  <p className="text-green-400 text-xs mt-2">✓ All budget allocated to milestones</p>
                ) : (parseFloat(formData.budget) || 0) - milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0) < 0 ? (
                  <p className="text-red-400 text-xs mt-2">⚠ Milestone amounts exceed project budget</p>
                ) : (
                  <p className="text-yellow-400 text-xs mt-2">⚠ Budget not fully allocated to milestones</p>
                )}
              </div>
            )}
            {milestones.map((milestone, index) => (
              <div key={index} className="p-4 bg-white dark:bg-dark-bg rounded-lg border border-gray-200 dark:border-dark-border space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-gray-900 dark:text-white font-medium">Milestone {index + 1}</h4>
                  {milestones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMilestone(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={milestone.title}
                    onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)}
                    placeholder="Milestone title"
                    className="w-full bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={milestone.amount}
                    onChange={(e) => handleMilestoneChange(index, 'amount', e.target.value)}
                    placeholder="Amount (ETH)"
                    className="w-full bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                  />
                </div>
                <textarea
                  value={milestone.description}
                  onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                  placeholder="Milestone description"
                  rows={2}
                  className="w-full bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
                <input
                  type="date"
                  value={milestone.dueDate}
                  onChange={(e) => handleMilestoneChange(index, 'dueDate', e.target.value)}
                  className="w-full bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                />
              </div>
            ))}
            {errors.milestones && (
              <p className="text-red-400 text-sm">{errors.milestones}</p>
            )}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" variant="outline" disabled={loading || !isConnected}>
            Save as Draft
          </Button>
          <Button
            type="button"
            onClick={() => {
              const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
              handleSubmit(syntheticEvent, true);
            }}
            disabled={loading || !isConnected}
          >
            {loading ? 'Publishing...' : 'Publish Project'}
          </Button>
        </div>
        {!isConnected && (
          <p className="text-yellow-600 dark:text-yellow-500 text-sm">
            Please connect your wallet to create a project
          </p>
        )}
      </form>
    </div>
  );
}

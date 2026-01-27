import { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Trash2,
  Save,
  Shield
} from 'lucide-react';
import { Card, CardHeader, Button, Input, PageLoader } from '../../components/ui';
import { KycBanner } from '../../components/KycBanner';
import { ReputationCard } from '../../components/ReputationCard';
import { useAuthStore, useProfileStore } from '../../store';
import { useKycGuard } from '../../hooks/useKycGuard';
import api from '../../lib/api';
import type { SkillCategory, Skill, WorkExperience } from '../../types';

export function ProfilePage() {
  const { user } = useAuthStore();
  const { isKycApproved } = useKycGuard();
  const {
    freelancerProfile,
    employerProfile,
    fetchFreelancerProfile,
    fetchEmployerProfile,
    updateFreelancerProfile,
    updateEmployerProfile,
    addSkill,
    removeSkill
  } = useProfileStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  // Freelancer form state
  const [freelancerForm, setFreelancerForm] = useState({
    name: '',
    nationality: '',
    bio: '',
    hourlyRate: '',
    availability: 'available' as 'available' | 'busy' | 'unavailable',
  });

  // Employer form state
  const [employerForm, setEmployerForm] = useState({
    name: '',
    nationality: '',
    companyName: '',
    description: '',
    industry: '',
  });

  // Experience form state
  const [newExperience, setNewExperience] = useState<Omit<WorkExperience, 'id'>>({
    title: '',
    company: '',
    startDate: '',
    endDate: '',
    description: '',
    current: false,
  });
  const [showExperienceForm, setShowExperienceForm] = useState(false);

  const isFreelancer = user?.role === 'freelancer';

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isFreelancer) {
          await fetchFreelancerProfile();
        } else {
          await fetchEmployerProfile();
        }

        const categoriesData = await api.getSkillCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isFreelancer, fetchFreelancerProfile, fetchEmployerProfile]);

  useEffect(() => {
    if (freelancerProfile && isFreelancer) {
      setFreelancerForm({
        name: freelancerProfile.name || '',
        nationality: freelancerProfile.nationality || '',
        bio: freelancerProfile.bio,
        hourlyRate: freelancerProfile.hourlyRate.toString(),
        availability: freelancerProfile.availability,
      });
    }
  }, [freelancerProfile, isFreelancer]);

  useEffect(() => {
    if (employerProfile && !isFreelancer) {
      setEmployerForm({
        name: employerProfile.name || '',
        nationality: employerProfile.nationality || '',
        companyName: employerProfile.companyName,
        description: employerProfile.description,
        industry: employerProfile.industry,
      });
    }
  }, [employerProfile, isFreelancer]);

  useEffect(() => {
    if (selectedCategory) {
      const fetchSkills = async () => {
        try {
          const skillsData = await api.getSkillsByCategory(selectedCategory);
          setSkills(skillsData);
        } catch (error) {
          console.error('Error fetching skills:', error);
        }
      };
      fetchSkills();
    }
  }, [selectedCategory]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      if (isFreelancer) {
        await updateFreelancerProfile({
          name: freelancerForm.name,
          nationality: freelancerForm.nationality,
          bio: freelancerForm.bio,
          hourlyRate: parseFloat(freelancerForm.hourlyRate),
          availability: freelancerForm.availability,
        });
      } else {
        await updateEmployerProfile({
          name: employerForm.name,
          nationality: employerForm.nationality,
          companyName: employerForm.companyName,
          description: employerForm.description,
          industry: employerForm.industry,
        });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async (skillId: string) => {
    try {
      const skill = skills.find(s => s.id === skillId);
      if (skill) {
        await addSkill({ name: skill.name, yearsOfExperience: 1 });
      }
    } catch (error) {
      console.error('Error adding skill:', error);
    }
  };

  const handleRemoveSkill = async (skillName: string) => {
    try {
      await removeSkill(skillName);
    } catch (error) {
      console.error('Error removing skill:', error);
    }
  };

  const handleAddExperience = async () => {
    try {
      await api.addExperience(newExperience);
      await fetchFreelancerProfile();
      setNewExperience({
        title: '',
        company: '',
        startDate: '',
        endDate: '',
        description: '',
        current: false,
      });
      setShowExperienceForm(false);
    } catch (error) {
      console.error('Error adding experience:', error);
    }
  };

  const handleDeleteExperience = async (id: string) => {
    try {
      await api.deleteExperience(id);
      await fetchFreelancerProfile();
    } catch (error) {
      console.error('Error deleting experience:', error);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
        <Button onClick={handleSaveProfile} disabled={saving || !isKycApproved}>
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* KYC Banner */}
      <KycBanner />

      {/* KYC Warning for non-verified users */}
      {!isKycApproved && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-amber-400 font-medium mb-1">KYC Verification Required</h4>
                <p className="text-amber-300/80 text-sm">
                  You can view your profile, but editing is disabled until you complete KYC verification.
                  This helps maintain trust and security on our platform.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader
          title="Basic Information"
          description="Your personal details"
        />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            value={isFreelancer ? freelancerForm.name : employerForm.name}
            onChange={(e) => isFreelancer
              ? setFreelancerForm({ ...freelancerForm, name: e.target.value })
              : setEmployerForm({ ...employerForm, name: e.target.value })
            }
            placeholder="Your name"
            disabled={!isKycApproved}
          />
          <Input
            label="Nationality"
            value={isFreelancer ? freelancerForm.nationality : employerForm.nationality}
            onChange={(e) => isFreelancer
              ? setFreelancerForm({ ...freelancerForm, nationality: e.target.value })
              : setEmployerForm({ ...employerForm, nationality: e.target.value })
            }
            placeholder="Your nationality"
            disabled={!isKycApproved}
          />
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>
      </Card>

      {/* Reputation */}
      {user && (
        <ReputationCard userId={user.id} showReviews={true} maxReviews={5} />
      )}

      {isFreelancer ? (
        <>
          {/* Freelancer Details */}
          <Card>
            <CardHeader
              title="Professional Details"
              description="Tell clients about yourself"
            />
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={freelancerForm.bio}
                  onChange={(e) => setFreelancerForm({ ...freelancerForm, bio: e.target.value })}
                  rows={4}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Tell clients about your experience and expertise..."
                  disabled={!isKycApproved}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  label="Hourly Rate (ETH)"
                  value={freelancerForm.hourlyRate}
                  onChange={(e) => setFreelancerForm({ ...freelancerForm, hourlyRate: e.target.value })}
                  placeholder="0.05"
                  disabled={!isKycApproved}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Availability
                  </label>
                  <select
                    value={freelancerForm.availability}
                    onChange={(e) => setFreelancerForm({
                      ...freelancerForm,
                      availability: e.target.value as 'available' | 'busy' | 'unavailable'
                    })}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isKycApproved}
                  >
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader
              title="Skills"
              description="Add skills to show your expertise"
            />
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Skill
                  </label>
                  <select
                    value=""
                    onChange={(e) => handleAddSkill(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!selectedCategory || !isKycApproved}
                  >
                    <option value="">Add a skill</option>
                    {skills
                      .filter(s => !freelancerProfile?.skills.find(sel => sel.skillId === s.id))
                      .map(skill => (
                        <option key={skill.id} value={skill.id}>{skill.name}</option>
                      ))
                    }
                  </select>
                </div>
              </div>

              {freelancerProfile?.skills && freelancerProfile.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {freelancerProfile.skills.map(skill => (
                    <span
                      key={skill.skillId}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary-900/50 text-primary-400 rounded-full text-sm"
                    >
                      {skill.skillName}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill.skillName)}
                        className="hover:text-primary-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Work Experience */}
          <Card>
            <CardHeader
              title="Work Experience"
              description="Your professional background"
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExperienceForm(!showExperienceForm)}
                  disabled={!isKycApproved}
                >
                  <Plus className="w-4 h-4" />
                  Add Experience
                </Button>
              }
            />

            {showExperienceForm && (
              <div className="mb-6 p-4 bg-dark-bg rounded-lg space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Job Title"
                    value={newExperience.title}
                    onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
                    placeholder="Software Developer"
                  />
                  <Input
                    label="Company"
                    value={newExperience.company}
                    onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                    placeholder="Company Name"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    type="date"
                    label="Start Date"
                    value={newExperience.startDate}
                    onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })}
                  />
                  <Input
                    type="date"
                    label="End Date"
                    value={newExperience.endDate || ''}
                    onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })}
                    disabled={newExperience.current}
                  />
                </div>
                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="checkbox"
                    checked={newExperience.current}
                    onChange={(e) => setNewExperience({ ...newExperience, current: e.target.checked })}
                    className="w-4 h-4 rounded border-dark-border bg-dark-bg text-primary-500 focus:ring-primary-500"
                  />
                  Currently working here
                </label>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newExperience.description}
                    onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                    rows={3}
                    className="w-full bg-dark-surface border border-dark-border rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                    placeholder="Describe your responsibilities..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddExperience}>Save Experience</Button>
                  <Button variant="ghost" onClick={() => setShowExperienceForm(false)}>Cancel</Button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {freelancerProfile?.experience.map((exp) => (
                <div key={exp.id} className="flex items-start gap-4 p-4 bg-dark-bg rounded-lg">
                  <div className="w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-white">{exp.title}</h4>
                        <p className="text-gray-400 text-sm">{exp.company}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteExperience(exp.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                      {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                    </p>
                    {exp.description && (
                      <p className="text-gray-400 text-sm mt-2">{exp.description}</p>
                    )}
                  </div>
                </div>
              ))}
              {(!freelancerProfile?.experience || freelancerProfile.experience.length === 0) && !showExperienceForm && (
                <p className="text-gray-400 text-center py-4">No experience added yet</p>
              )}
            </div>
          </Card>
        </>
      ) : (
        /* Employer Details */
        <Card>
          <CardHeader
            title="Company Details"
            description="Information about your company"
          />
          <div className="space-y-4">
            <Input
              label="Company Name"
              value={employerForm.companyName}
              onChange={(e) => setEmployerForm({ ...employerForm, companyName: e.target.value })}
              placeholder="Your company name"
              disabled={!isKycApproved}
            />
            <Input
              label="Industry"
              value={employerForm.industry}
              onChange={(e) => setEmployerForm({ ...employerForm, industry: e.target.value })}
              placeholder="e.g., Technology, Finance, Healthcare"
              disabled={!isKycApproved}
            />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Company Description
              </label>
              <textarea
                value={employerForm.description}
                onChange={(e) => setEmployerForm({ ...employerForm, description: e.target.value })}
                rows={4}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Tell freelancers about your company..."
                disabled={!isKycApproved}
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}


import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Mail,
  Award
} from 'lucide-react';
import { Card, CardHeader, Button, PageLoader, StatusBadge } from '../../components/ui';
import { ReputationCard } from '../../components/ReputationCard';
import { useAuthStore } from '../../store';
import api from '../../lib/api';
import type { FreelancerProfile } from '../../types';
import { format } from 'date-fns';

export function FreelancerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [freelancer, setFreelancer] = useState<FreelancerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isEmployer = user?.role === 'employer';
  const isOwnProfile = user?.id === id;

  useEffect(() => {
    if (id) {
      loadFreelancer();
    }
  }, [id]);

  const loadFreelancer = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await api.getFreelancer(id);
      setFreelancer(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load freelancer profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  if (error || !freelancer) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Card>
          <div className="text-center py-12">
            <p className="text-red-400">{error || 'Freelancer not found'}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Header */}
          <Card>
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {freelancer.name || 'Anonymous'}
                  </h1>
                  {freelancer.nationality && (
                    <div className="flex items-center gap-2 text-gray-400 mb-4">
                      <MapPin className="w-4 h-4" />
                      {freelancer.nationality}
                    </div>
                  )}
                  <StatusBadge status={freelancer.availability} />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary-400">
                    ${freelancer.hourlyRate}
                  </div>
                  <div className="text-sm text-gray-400">per hour</div>
                </div>
              </div>

              {freelancer.bio && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">About</h3>
                  <p className="text-gray-400 leading-relaxed">{freelancer.bio}</p>
                </div>
              )}

              {/* Action Buttons */}
              {!isOwnProfile && isEmployer && (
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <Button variant="primary" className="flex-1">
                    <Mail className="w-4 h-4" />
                    Contact Freelancer
                  </Button>
                  <Link to="/projects/new" className="flex-1">
                    <Button variant="outline" className="w-full">
                      Invite to Project
                    </Button>
                  </Link>
                </div>
              )}

              {isOwnProfile && (
                <div className="pt-4 border-t border-white/10">
                  <Link to="/profile">
                    <Button variant="primary" className="w-full">
                      Edit Profile
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>

          {/* Skills */}
          {freelancer.skills && freelancer.skills.length > 0 && (
            <Card>
              <CardHeader title="Skills" />
              <div className="flex flex-wrap gap-2">
                {freelancer.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-primary-500/10 text-primary-400 rounded-lg text-sm font-medium border border-primary-500/20"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Work Experience */}
          {freelancer.experience && freelancer.experience.length > 0 && (
            <Card>
              <CardHeader title="Work Experience" />
              <div className="space-y-6">
                {freelancer.experience.map((exp, index) => (
                  <div key={index} className="relative pl-6 border-l-2 border-primary-500/30">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 bg-primary-500 rounded-full" />
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-lg font-semibold text-white">{exp.title}</h4>
                          <p className="text-gray-400">{exp.company}</p>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(exp.startDate), 'MMM yyyy')} - 
                          {exp.endDate ? format(new Date(exp.endDate), 'MMM yyyy') : 'Present'}
                        </div>
                      </div>
                      {exp.description && (
                        <p className="text-gray-400 text-sm leading-relaxed">{exp.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Reputation */}
          {id && (
            <ReputationCard userId={id} showReviews={true} maxReviews={10} />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader title="Quick Stats" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Hourly Rate</span>
                <span className="text-white font-semibold">${freelancer.hourlyRate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Availability</span>
                <StatusBadge status={freelancer.availability} />
              </div>
              {freelancer.experience && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Experience</span>
                  <span className="text-white font-semibold">
                    {freelancer.experience.length} {freelancer.experience.length === 1 ? 'project' : 'projects'}
                  </span>
                </div>
              )}
              {freelancer.skills && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Skills</span>
                  <span className="text-white font-semibold">{freelancer.skills.length}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Member Since */}
          {freelancer.createdAt && (
            <Card>
              <CardHeader title="Member Since" />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <div className="text-white font-semibold">
                    {format(new Date(freelancer.createdAt), 'MMMM yyyy')}
                  </div>
                  <div className="text-sm text-gray-400">
                    Joined FreelanceXchain
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Similar Freelancers */}
          <Card>
            <CardHeader title="Similar Freelancers" />
            <div className="text-center py-6 text-gray-400 text-sm">
              Coming soon
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

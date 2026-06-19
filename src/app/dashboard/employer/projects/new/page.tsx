'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  Upload,
  FileText,
  DollarSign,
  Clock,
  Target,
} from 'lucide-react';

const steps = [
  { id: 1, title: 'Project Details', icon: FileText },
  { id: 2, title: 'Milestones', icon: Target },
  { id: 3, title: 'Budget & Timeline', icon: DollarSign },
  { id: 4, title: 'Review & Post', icon: FileText },
];

const skillSuggestions = [
  'React', 'Next.js', 'Vue.js', 'Angular',
  'Node.js', 'Python', 'TypeScript', 'Solidity',
  'Web3.js', 'GraphQL', 'PostgreSQL', 'MongoDB',
  'AWS', 'Docker', 'Kubernetes', 'CI/CD',
];

export default function CreateProjectPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [milestones, setMilestones] = useState([
    { title: '', description: '', amount: '' },
  ]);

  const addSkill = (skill: string) => {
    if (!skills.includes(skill)) {
      setSkills([...skills, skill]);
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const addMilestone = () => {
    setMilestones([...milestones, { title: '', description: '', amount: '' }]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: string, value: string) => {
    const updated = [...milestones];
    (updated[index] as Record<string, string>)[field] = value;
    setMilestones(updated);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Post a New Project</h1>
        <p className="text-muted-foreground">Create a project listing to find the best talent</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                currentStep === step.id
                  ? 'gradient-primary text-white'
                  : currentStep > step.id
                  ? 'bg-green-500/10 text-green-500'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              <step.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{step.title}</span>
            </div>
            {i < steps.length - 1 && (
              <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Project Details</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Project Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., E-commerce Platform Development"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your project in detail..."
                      rows={6}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Required Skills</Label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-sm py-1.5 px-3">
                          {skill}
                          <X
                            className="w-3 h-3 ml-2 cursor-pointer hover:text-destructive"
                            onClick={() => removeSkill(skill)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {skillSuggestions
                        .filter((s) => !skills.includes(s))
                        .slice(0, 8)
                        .map((skill) => (
                          <Badge
                            key={skill}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary/10"
                            onClick={() => addSkill(skill)}
                          >
                            + {skill}
                          </Badge>
                        ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Attachments</Label>
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
                      <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Drag & drop files or click to upload
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Milestones</h2>
                <Button variant="outline" size="sm" onClick={addMilestone}>
                  <Plus className="w-4 h-4 mr-2" /> Add Milestone
                </Button>
              </div>
              <div className="space-y-4">
                {milestones.map((milestone, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-secondary/50 border border-border"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">Milestone {index + 1}</span>
                      {milestones.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeMilestone(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          placeholder="e.g., UI Design"
                          value={milestone.title}
                          onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Amount ($)</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={milestone.amount}
                          onChange={(e) => updateMilestone(index, 'amount', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          placeholder="Describe the deliverables..."
                          rows={2}
                          value={milestone.description}
                          onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Budget & Timeline</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Total Budget ($)</Label>
                    <Input
                      id="budget"
                      type="number"
                      placeholder="0.00"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">Rush Project?</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Enable rush mode to attract freelancers faster. A rush fee will be added to your budget.
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                    <h3 className="font-medium mb-3">Budget Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Milestones Total</span>
                        <span>
                          ${milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Platform Fee (5%)</span>
                        <span>
                          ${(milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0) * 0.05).toFixed(2)}
                        </span>
                      </div>
                      <div className="border-t border-border pt-2 flex justify-between font-medium">
                        <span>Total</span>
                        <span className="text-primary">
                          ${(milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0) * 1.05).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Review & Post</h2>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <h3 className="font-medium mb-2">Project Title</h3>
                  <p className="text-muted-foreground">{title || 'Not set'}</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-muted-foreground">{description || 'Not set'}</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <h3 className="font-medium mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <h3 className="font-medium mb-2">Milestones</h3>
                  <div className="space-y-2">
                    {milestones.map((m, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span>{m.title || `Milestone ${i + 1}`}</span>
                        <span className="font-medium">${m.amount || '0'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-2" /> Previous
        </Button>
        {currentStep < 4 ? (
          <Button
            className="gradient-primary text-white"
            onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
          >
            Next <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button className="gradient-primary text-white">
            Post Project
          </Button>
        )}
      </div>
    </div>
  );
}

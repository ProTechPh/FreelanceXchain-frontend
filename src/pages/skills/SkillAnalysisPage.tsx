import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { SkillGapAnalysis, ExtractedSkill } from '../../types';
import { Card, Button, Badge, Loader } from '../../components/ui';
import { FiSearch, FiCheck, FiTrendingUp, FiAlertCircle, FiBook, FiExternalLink, FiZap } from 'react-icons/fi';

export function SkillAnalysisPage() {
  const [analysis, setAnalysis] = useState<SkillGapAnalysis | null>(null);
  const [extractedSkills, setExtractedSkills] = useState<ExtractedSkill[]>([]);
  const [loading, setLoading] = useState(false);
  const [extractLoading, setExtractLoading] = useState(false);
  const [textToAnalyze, setTextToAnalyze] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'gap' | 'extract'>('gap');

  useEffect(() => {
    if (activeTab === 'gap' && !analysis && !loading) {
      console.log('[SkillAnalysis] Auto-fetching initial analysis');
      fetchSkillGapAnalysis();
    }
  }, [activeTab]);

  const fetchSkillGapAnalysis = async () => {
    console.log('[SkillAnalysis] === FETCH START ===');
    setLoading(true);
    setError(null);
    setAnalysis(null); // Clear previous analysis to show loading state
    
    try {
      console.log('[SkillAnalysis] Calling API...');
      const data = await api.getSkillGaps();
      console.log('[SkillAnalysis] API responded with data:', JSON.stringify(data).substring(0, 200));
      
      if (data) {
        console.log('[SkillAnalysis] Setting analysis state...');
        setAnalysis(data);
        // Force a small delay to ensure state updates propagate
        await new Promise(resolve => setTimeout(resolve, 50));
        console.log('[SkillAnalysis] Analysis state set');
      } else {
        console.warn('[SkillAnalysis] Received null/undefined data');
        setError('No data received from server');
      }
    } catch (err: any) {
      console.error('[SkillAnalysis] ERROR caught:', err);
      const errorMessage = err?.message || 'Failed to load skill gap analysis';
      setError(errorMessage);
      // Set empty analysis to show the UI
      setAnalysis({
        currentSkills: [],
        recommendedSkills: [],
        marketDemand: [],
        reasoning: 'Unable to generate analysis. Please ensure you have skills added to your profile and try again.'
      });
    }
    
    // ALWAYS set loading to false, no matter what
    console.log('[SkillAnalysis] Setting loading to FALSE');
    setLoading(false);
    console.log('[SkillAnalysis] === FETCH END ===');
  };

  const handleExtractSkills = async () => {
    if (!textToAnalyze.trim()) return;

    console.log('[SkillExtract] === EXTRACT START ===');
    setExtractLoading(true);
    setError(null);
    setExtractedSkills([]); // Clear previous results
    
    try {
      console.log('[SkillExtract] Calling API...');
      const data = await api.extractSkills(textToAnalyze);
      console.log('[SkillExtract] API responded with:', data?.length || 0, 'skills');
      
      if (data) {
        setExtractedSkills(data);
        console.log('[SkillExtract] State updated with', data.length, 'skills');
      } else {
        console.warn('[SkillExtract] Received null/undefined data');
        setError('No skills extracted from text');
      }
    } catch (err: any) {
      console.error('[SkillExtract] ERROR:', err);
      const errorMessage = err?.message || 'Failed to extract skills from text';
      setError(errorMessage);
    }
    
    // ALWAYS set loading to false
    console.log('[SkillExtract] Setting extractLoading to FALSE');
    setExtractLoading(false);
    console.log('[SkillExtract] === EXTRACT END ===');
  };

  // Debug logging for render state
  console.log('[SkillAnalysis] Render - loading:', loading, 'analysis:', analysis ? 'present' : 'null', 'error:', error);

  return (
    <div className="space-y-6" data-tour-id="skill-analysis-main">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Skill Analysis</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Analyze your skills, identify gaps, and get personalized learning recommendations
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-dark-border pb-4">
        <button
          onClick={() => setActiveTab('gap')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'gap'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-dark-card text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
        >
          <FiTrendingUp className="inline mr-2" />
          Skill Gap Analysis
        </button>
        <button
          onClick={() => setActiveTab('extract')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'extract'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-dark-card text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
        >
          <FiSearch className="inline mr-2" />
          Extract Skills
        </button>
      </div>

      {error && (
        <Card className="bg-red-500/10 border-red-500/30">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-red-400 font-medium mb-1">Error</h4>
                <p className="text-red-300 text-sm">{error}</p>
                {error.includes('timed out') && (
                  <div className="mt-3">
                    <p className="text-red-300/80 text-sm mb-2">
                      The AI service is taking longer than usual. This can happen during high load.
                    </p>
                    <Button
                      onClick={fetchSkillGapAnalysis}
                      disabled={loading}
                      size="sm"
                      variant="outline"
                      className="border-red-400 text-red-400 hover:bg-red-500/20"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
                {error.includes('Failed to load') && !error.includes('timed out') && (
                  <p className="text-red-300/80 text-sm mt-2">
                    This feature requires:
                    <ul className="list-disc list-inside mt-1 ml-2">
                      <li>A freelancer account</li>
                      <li>Skills added to your profile</li>
                      <li>Backend AI service to be running</li>
                    </ul>
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Skill Gap Analysis Tab */}
      {activeTab === 'gap' && (
        <div className="space-y-6">
          {/* Refresh Button */}
          <div className="flex justify-end">
            <Button onClick={fetchSkillGapAnalysis} disabled={loading} variant="outline">
              {loading ? <Loader size="sm" /> : 'Refresh Analysis'}
            </Button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
              <Loader size="lg" />
              <div className="text-center">
                <p className="text-gray-700 dark:text-gray-300 font-medium">Analyzing your skills...</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  This may take up to 5 minutes as AI analyzes your profile
                </p>
              </div>
            </div>
          ) : analysis ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current Skills */}
              <Card>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FiCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Your Current Skills</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.currentSkills.map((skill: string, idx: number) => (
                      <Badge key={idx} variant="success">
                        {skill}
                      </Badge>
                    ))}
                    {analysis.currentSkills.length === 0 && (
                      <p className="text-gray-600 dark:text-gray-400">No skills found. Update your profile to add skills.</p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Recommended Skills to Develop */}
              <Card>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FiTrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recommended Skills</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.recommendedSkills.map((skill: string, idx: number) => (
                      <Badge key={idx} variant="warning">
                        {skill}
                      </Badge>
                    ))}
                    {analysis.recommendedSkills.length === 0 && (
                      <p className="text-gray-600 dark:text-gray-400">Great! Your skill set is comprehensive.</p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Market Demand */}
              <Card className="lg:col-span-2">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FiZap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Market Demand Skills</h3>
                  </div>
                  <div className="space-y-3">
                    {analysis.marketDemand.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
                        <span className="text-gray-900 dark:text-white">{item.skillName}</span>
                        <Badge
                          variant={
                            item.demandLevel === 'high' ? 'success' :
                              item.demandLevel === 'medium' ? 'warning' : 'default'
                          }
                        >
                          {item.demandLevel.charAt(0).toUpperCase() + item.demandLevel.slice(1)} Demand
                        </Badge>
                      </div>
                    ))}
                    {analysis.marketDemand.length === 0 && (
                      <p className="text-gray-600 dark:text-gray-400">No market demand data available.</p>
                    )}
                  </div>
                </div>
              </Card>

              {/* AI Reasoning */}
              <Card className="lg:col-span-2">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FiBook className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">AI Analysis</h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{analysis.reasoning}</p>
                </div>
              </Card>
            </div>
          ) : (
            <Card>
              <div className="p-8 text-center">
                <FiTrendingUp className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Skill Gap Analysis</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Click refresh to analyze your skills and get personalized recommendations
                </p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Extract Skills Tab */}
      {activeTab === 'extract' && (
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Extract Skills from Text</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Paste a job description, resume, or any text to automatically extract relevant skills.
              </p>
              <textarea
                placeholder="Paste text here... (e.g., job description, resume, project description)"
                value={textToAnalyze}
                onChange={(e) => setTextToAnalyze(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleExtractSkills}
                  disabled={extractLoading || !textToAnalyze.trim()}
                >
                  {extractLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader size="sm" />
                      <span>Extracting...</span>
                    </span>
                  ) : (
                    <>
                      <FiSearch className="mr-2" />
                      Extract Skills
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {extractedSkills.length > 0 && (
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Extracted Skills</h3>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">{extractedSkills.length} skills found</span>
                </div>
                <div className="space-y-3">
                  {extractedSkills.map((skill) => (
                    <div key={skill.skillId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={skill.confidence > 0.8 ? 'success' : skill.confidence > 0.5 ? 'warning' : 'default'}>
                          {skill.skillName}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 dark:text-gray-400 text-sm">Confidence:</span>
                          <div className="w-24 h-2 bg-gray-300 dark:bg-dark-border rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${skill.confidence > 0.8 ? 'bg-green-500' :
                                  skill.confidence > 0.5 ? 'bg-amber-500' : 'bg-gray-500'
                                }`}
                              style={{ width: `${skill.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300 text-sm">{Math.round(skill.confidence * 100)}%</span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <FiExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline">
                    Add to Profile
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

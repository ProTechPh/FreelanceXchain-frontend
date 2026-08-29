'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, BrainCircuit, CheckCircle2, Search, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { matchingApi, type ExtractedSkill, type SkillGapAnalysis } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { DetailSkeleton } from '@/components/dashboard/skeletons';
import { Field } from '@/components/ui/field';
import { Markdown } from '@/components/ui/markdown';

export default function SkillAnalysisPage() {
  const [analysis, setAnalysis] = useState<SkillGapAnalysis | null>(null);
  const [text, setText] = useState('');
  const [extracted, setExtracted] = useState<ExtractedSkill[]>([]);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);
  const [extracting, setExtracting] = useState(false);

  const loadAnalysis = useCallback(async () => {
    setLoadingAnalysis(true);
    try {
      const { data } = await matchingApi.getSkillGaps();
      setAnalysis(data);
    } catch (error) {
      const msg = getApiErrorMessage(error, '');
      if (!msg.toLowerCase().includes('profile not found') && !msg.toLowerCase().includes('not found')) {
        toast.error(msg || 'Unable to analyze your skill gaps.');
      }
    } finally {
      setLoadingAnalysis(false);
    }
  }, []);

  useEffect(() => {
    // The initial analysis is generated from the authenticated freelancer profile.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAnalysis();
  }, [loadAnalysis]);

  const extractSkills = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!text.trim()) return;
    setExtracting(true);
    try {
      const { data } = await matchingApi.extractSkills(text.trim());
      setExtracted(data);
      if (data.length === 0) toast.info('No taxonomy skills were detected in that text.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to extract skills from this text.'));
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div><h1 className="flex items-center gap-2 text-2xl font-bold"><BrainCircuit className="size-6 text-primary" />Skill analysis</h1><p className="text-muted-foreground">Use the backend matching service to identify skill gaps and extract taxonomy skills from text.</p></div>

      <div className="flex justify-end"><Button type="button" variant="outline" loading={loadingAnalysis} loadingText="Analysing…" onClick={() => void loadAnalysis()}><TrendingUp className="size-4" aria-hidden="true" />Refresh analysis</Button></div>

      {loadingAnalysis ? (
        <DetailSkeleton label="Analysing skills" />
      ) : analysis ? (
        <div className="grid gap-5 md:grid-cols-2">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="size-5 text-success" />Current skills</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{analysis.currentSkills.map((skill) => <Badge key={skill} variant="secondary">{skill}</Badge>)}{analysis.currentSkills.length === 0 && <p className="text-sm text-muted-foreground">No profile skills found.</p>}</CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="size-5 text-warning" />Recommended skills</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{analysis.recommendedSkills.map((skill) => <Badge key={skill}>{skill}</Badge>)}{analysis.recommendedSkills.length === 0 && <p className="text-sm text-muted-foreground">No immediate gaps identified.</p>}</CardContent></Card>
          <Card className="md:col-span-2"><CardHeader><CardTitle>Market demand</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{analysis.marketDemand.map((item) => <div key={item.skillName} className="flex items-center justify-between rounded-lg border border-border p-3"><span>{item.skillName}</span><Badge variant="secondary">{item.demandLevel} demand</Badge></div>)}</CardContent></Card>
          <Card className="md:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="size-5" />Analysis</CardTitle></CardHeader><CardContent><Markdown content={analysis.reasoning} /></CardContent></Card>
        </div>
      ) : (
        <Card className="rounded-2xl border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center max-w-md mx-auto">
            <p className="font-semibold text-foreground">No skill analysis available yet</p>
            <p className="text-sm text-muted-foreground">
              Add skills to your profile so our AI can evaluate your skill gaps and market demand.
            </p>
            <Button asChild size="sm" variant="gradient" className="mt-2">
              <Link href="/dashboard/freelancer/profile">Set up Profile Skills →</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Search className="size-5" />Resume</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-3" onSubmit={extractSkills}><Field label="Job description, résumé, or project brief" htmlFor="skill-source-text">
<Textarea id="skill-source-text" rows={6} value={text} onChange={(event) => setText(event.target.value)} />
</Field><Button type="submit" disabled={extracting || !text.trim()}>{extracting ? 'Extracting…' : 'Extract skills'}</Button></form>
          {extracted.length > 0 && <div className="flex flex-wrap gap-2 border-t border-border pt-4">{extracted.map((skill) => <Badge key={skill.skillId} variant="secondary">{skill.skillName} · {Math.round(skill.confidence * 100)}%</Badge>)}</div>}
        </CardContent>
      </Card>
    </div>
  );
}

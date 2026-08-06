'use client';

import { useCallback, useEffect, useState } from 'react';
import { BookOpen, BrainCircuit, CheckCircle2, Loader2, Search, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { matchingApi, type ExtractedSkill, type SkillGapAnalysis } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
      toast.error(getApiErrorMessage(error, 'Unable to analyze your skill gaps. Add skills to your profile and try again.'));
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

      <div className="flex justify-end"><Button type="button" variant="outline" disabled={loadingAnalysis} onClick={() => void loadAnalysis()}>{loadingAnalysis ? <Loader2 className="mr-2 size-4 animate-spin" /> : <TrendingUp className="mr-2 size-4" />}Refresh analysis</Button></div>

      {loadingAnalysis ? (
        <Card><CardContent className="flex min-h-48 items-center justify-center" role="status"><Loader2 className="size-8 animate-spin text-primary" /><span className="sr-only">Analyzing skills</span></CardContent></Card>
      ) : analysis ? (
        <div className="grid gap-5 md:grid-cols-2">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="size-5 text-green-500" />Current skills</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{analysis.currentSkills.map((skill) => <Badge key={skill} variant="secondary">{skill}</Badge>)}{analysis.currentSkills.length === 0 && <p className="text-sm text-muted-foreground">No profile skills found.</p>}</CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="size-5 text-amber-500" />Recommended skills</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{analysis.recommendedSkills.map((skill) => <Badge key={skill}>{skill}</Badge>)}{analysis.recommendedSkills.length === 0 && <p className="text-sm text-muted-foreground">No immediate gaps identified.</p>}</CardContent></Card>
          <Card className="md:col-span-2"><CardHeader><CardTitle>Market demand</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{analysis.marketDemand.map((item) => <div key={item.skillName} className="flex items-center justify-between rounded-lg border border-border p-3"><span>{item.skillName}</span><Badge variant="secondary">{item.demandLevel} demand</Badge></div>)}</CardContent></Card>
          <Card className="md:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="size-5" />Analysis</CardTitle></CardHeader><CardContent><p className="leading-relaxed text-muted-foreground">{analysis.reasoning}</p></CardContent></Card>
        </div>
      ) : <Card><CardContent className="py-10 text-center text-muted-foreground">No skill analysis is available yet.</CardContent></Card>}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Search className="size-5" />Extract skills from text</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-3" onSubmit={extractSkills}><div className="space-y-2"><Label htmlFor="skill-source-text">Job description, résumé, or project brief</Label><Textarea id="skill-source-text" rows={6} value={text} onChange={(event) => setText(event.target.value)} /></div><Button type="submit" disabled={extracting || !text.trim()}>{extracting ? 'Extracting…' : 'Extract skills'}</Button></form>
          {extracted.length > 0 && <div className="flex flex-wrap gap-2 border-t border-border pt-4">{extracted.map((skill) => <Badge key={skill.skillId} variant="secondary">{skill.skillName} · {Math.round(skill.confidence * 100)}%</Badge>)}</div>}
        </CardContent>
      </Card>
    </div>
  );
}

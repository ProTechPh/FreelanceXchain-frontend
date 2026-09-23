'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  MAX_FILE_COUNT,
  ProposalFormValidationError,
  findProposalFormError,
  submitProposal,
  type ProposalField,
  type ProposalSubmissionForm,
} from '@/lib/proposal-submission';
import { proposalsApi } from '@/lib/api';
import { reportFailure } from '@/lib/report-failure';
import {
  ALLOWED_FORMATS_DESCRIPTION,
  isAllowedDocumentFile,
  MAX_FILE_SIZE,
} from '@/lib/file-validation';

export const EMPTY_FORM: ProposalSubmissionForm = {
  proposedRate: '',
  estimatedDuration: '',
  files: [],
};

interface UseProposalFormOptions {
  projectId: string;
  projectTitle: string;
  projectBudget: number;
  onSubmitted?: () => void;
}

interface UseProposalFormResult {
  form: ProposalSubmissionForm;
  setForm: React.Dispatch<React.SetStateAction<ProposalSubmissionForm>>;
  fieldError: { field: ProposalField; message: string } | null;
  setFieldError: React.Dispatch<React.SetStateAction<{ field: ProposalField; message: string } | null>>;
  submitting: boolean;
  handleSubmit: (coverLetter?: string) => Promise<boolean>;
  handleRateChange: (value: string) => void;
  handleDurationChange: (value: string) => void;
  handleFilesChange: (files: FileList | null) => void;
  handleRemoveFile: (index: number) => void;
  updateFormWithAI: (aiData: {
    proposedRate: number;
    estimatedDuration: number;
    files: File[];
  }) => void;
  resetForm: () => void;
}

export function useProposalForm({
  projectId,
  projectTitle,
  projectBudget,
  onSubmitted,
}: UseProposalFormOptions): UseProposalFormResult {
  const [form, setForm] = useState<ProposalSubmissionForm>(EMPTY_FORM);
  const [fieldError, setFieldError] = useState<{ field: ProposalField; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async (coverLetter?: string): Promise<boolean> => {
    const submissionForm: ProposalSubmissionForm = {
      ...form,
      coverLetter: coverLetter || undefined,
    };

    const invalid = findProposalFormError(submissionForm);
    setFieldError(invalid);
    if (invalid) return false;

    setSubmitting(true);
    try {
      await submitProposal(proposalsApi, projectId, submissionForm);
      toast.success('Proposal submitted.');
      onSubmitted?.();
      setForm(EMPTY_FORM);
      setFieldError(null);
      return true;
    } catch (error) {
      if (error instanceof ProposalFormValidationError) {
        setFieldError({ field: 'proposedRate', message: error.message });
        return false;
      }
      reportFailure(error, 'submit your proposal', { fundsUnchanged: true });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [form, projectId, onSubmitted]);

  const handleRateChange = useCallback((value: string) => {
    setFieldError(null);
    setForm((current) => ({ ...current, proposedRate: value }));
  }, []);

  const handleDurationChange = useCallback((value: string) => {
    setFieldError(null);
    setForm((current) => ({ ...current, estimatedDuration: value }));
  }, []);

  const handleFilesChange = useCallback((fileList: FileList | null) => {
    const incomingFiles = Array.from(fileList ?? []);
    setFieldError(null);

    const validFiles: File[] = [];
    for (const file of incomingFiles) {
      if (!isAllowedDocumentFile(file)) {
        toast.error(`File type not allowed for "${file.name}". ${ALLOWED_FORMATS_DESCRIPTION}`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File "${file.name}" exceeds the 10 MB limit.`);
        continue;
      }
      validFiles.push(file);
    }

    setForm((current) => {
      const autoBrief = current.files.filter((f) => f.name.startsWith('Proposal_'));
      const combined = [...autoBrief, ...validFiles];
      const dropped = combined.length - MAX_FILE_COUNT;
      if (dropped > 0) {
        toast.warning(
          `Only ${MAX_FILE_COUNT} attachments allowed`,
          {
            description: dropped === 1
              ? 'The last file you picked was not added.'
              : `The last ${dropped} files you picked were not added.`,
          },
        );
      }
      return { ...current, files: combined.slice(0, MAX_FILE_COUNT) };
    });
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setForm((current) => ({
      ...current,
      files: current.files.filter((_, i) => i !== index),
    }));
  }, []);

  const updateFormWithAI = useCallback((aiData: {
    proposedRate: number;
    estimatedDuration: number;
    files: File[];
  }) => {
    setForm((current) => {
      const otherFiles = current.files.filter((f) => !f.name.startsWith('Proposal_'));
      const updatedFiles = [...aiData.files, ...otherFiles].slice(0, MAX_FILE_COUNT);
      return {
        ...current,
        proposedRate: String(aiData.proposedRate || projectBudget || ''),
        estimatedDuration: String(aiData.estimatedDuration || 14),
        files: updatedFiles,
      };
    });
  }, [projectBudget]);

  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setFieldError(null);
  }, []);

  return {
    form,
    setForm,
    fieldError,
    setFieldError,
    submitting,
    handleSubmit,
    handleRateChange,
    handleDurationChange,
    handleFilesChange,
    handleRemoveFile,
    updateFormWithAI,
    resetForm,
  };
}

export type ProposalDecision = 'accept' | 'reject';

interface ManagedProposal {
  id: string;
  status: string;
}

interface ProposalManagementApi<TProposal extends ManagedProposal> {
  accept(id: string): Promise<{ data: { proposal: TProposal } }>;
  reject(id: string): Promise<{ data: TProposal }>;
}

export async function updateProposalDecision<TProposal extends ManagedProposal>(
  api: ProposalManagementApi<TProposal>,
  proposalId: string,
  decision: ProposalDecision,
): Promise<TProposal> {
  if (decision === 'accept') {
    const response = await api.accept(proposalId);
    return response.data.proposal;
  }

  const response = await api.reject(proposalId);
  return response.data;
}

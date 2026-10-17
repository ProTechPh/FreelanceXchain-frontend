import type { jsPDF as JsPDF } from 'jspdf';

export interface ProposalBriefMilestone {
  title: string;
  description: string;
  amount: number;
  durationDays: number;
}

export interface ProposalBriefInput {
  projectTitle: string;
  coverLetter: string;
  highlights: string[];
  milestones: ProposalBriefMilestone[];
  formatAmount: (amount: number) => string;
}

// jsPDF is ~350 KB, so it is loaded only once a freelancer actually drafts with
// AI. buildProposalBriefPdf() is synchronous so the brief can be rebuilt on every
// cover-letter edit; callers must await loadProposalBriefPdf() first.
let JsPDFCtor: typeof JsPDF | null = null;

export async function loadProposalBriefPdf(): Promise<void> {
  if (!JsPDFCtor) {
    JsPDFCtor = (await import('jspdf')).jsPDF;
  }
}

const PAGE_MARGIN = 56;
const BODY_SIZE = 10.5;
const LINE_HEIGHT = 1.45;
const TEXT_COLOR: [number, number, number] = [33, 37, 41];
const MUTED_COLOR: [number, number, number] = [108, 117, 125];

interface Run {
  text: string;
  bold: boolean;
  italic: boolean;
}

// The standard PDF fonts only cover Latin-1, so anything outside it (emoji,
// CJK) would print as garbage. sanitizeMarkdownText() already maps smart
// quotes, dashes and bullets to ASCII; the peso sign and approx sign used by
// the PHP conversion are spelled out here so amounts keep their meaning.
function toPdfText(text: string): string {
  return text
    .replace(/₱\s?/g, 'PHP ')
    .replace(/≈/g, '~')
    .replace(/[^\t\n\r\x20-\x7E\xA0-\xFF]/g, '');
}

/** Split one line of markdown into bold/italic runs and drop inline syntax. */
function parseInline(text: string): Run[] {
  const cleaned = text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/`([^`]+)`/g, '$1');

  const runs: Run[] = [];
  const pattern = /\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|__(.+?)__|\*([^*\s][^*]*?)\*|\b_([^_]+?)_\b/g;
  let last = 0;
  for (const match of cleaned.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) runs.push({ text: cleaned.slice(last, index), bold: false, italic: false });
    const [, boldItalic, boldStar, boldUnderscore, italicStar, italicUnderscore] = match;
    const bold = boldStar ?? boldUnderscore;
    if (boldItalic !== undefined) runs.push({ text: boldItalic, bold: true, italic: true });
    else if (bold !== undefined) runs.push({ text: bold, bold: true, italic: false });
    else runs.push({ text: italicStar ?? italicUnderscore ?? '', bold: false, italic: true });
    last = index + match[0].length;
  }
  if (last < cleaned.length) runs.push({ text: cleaned.slice(last), bold: false, italic: false });
  return runs.filter((run) => run.text.length > 0);
}

class BriefWriter {
  private y = PAGE_MARGIN;
  private readonly pageWidth: number;
  private readonly pageHeight: number;
  private readonly contentWidth: number;

  constructor(private readonly doc: JsPDF) {
    this.pageWidth = doc.internal.pageSize.getWidth();
    this.pageHeight = doc.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - PAGE_MARGIN * 2;
  }

  private ensureSpace(height: number) {
    if (this.y + height > this.pageHeight - PAGE_MARGIN) {
      this.doc.addPage();
      this.y = PAGE_MARGIN;
    }
  }

  private setFont(run: Pick<Run, 'bold' | 'italic'>, size: number, font = 'helvetica') {
    const style = run.bold && run.italic ? 'bolditalic' : run.bold ? 'bold' : run.italic ? 'italic' : 'normal';
    this.doc.setFont(font, style);
    this.doc.setFontSize(size);
  }

  space(points: number) {
    this.y += points;
  }

  /** Word-wrap a sequence of styled runs, keeping bold/italic per word. */
  runs(runs: Run[], options: { size?: number; indent?: number; color?: [number, number, number]; font?: string } = {}) {
    const size = options.size ?? BODY_SIZE;
    const indent = options.indent ?? 0;
    const lineHeight = size * LINE_HEIGHT;
    const maxWidth = this.contentWidth - indent;
    const font = options.font ?? 'helvetica';

    const words: Array<Run & { width: number; space: number }> = [];
    for (const run of runs) {
      for (const piece of toPdfText(run.text).split(/(\s+)/)) {
        if (!piece) continue;
        this.setFont(run, size, font);
        if (/^\s+$/.test(piece)) {
          if (words.length) words[words.length - 1].space = this.doc.getTextWidth(' ');
          continue;
        }
        words.push({ ...run, text: piece, width: this.doc.getTextWidth(piece), space: 0 });
      }
    }
    if (!words.length) return;

    this.doc.setTextColor(...(options.color ?? TEXT_COLOR));
    let line: typeof words = [];
    let lineWidth = 0;
    const flush = () => {
      this.ensureSpace(lineHeight);
      let x = PAGE_MARGIN + indent;
      for (const word of line) {
        this.setFont(word, size, font);
        this.doc.text(word.text, x, this.y + size);
        x += word.width + word.space;
      }
      this.y += lineHeight;
      line = [];
      lineWidth = 0;
    };

    for (const word of words) {
      if (line.length && lineWidth + word.width > maxWidth) flush();
      // A single word wider than the column (a long URL) is hard-split.
      if (word.width > maxWidth) {
        this.setFont(word, size, font);
        for (const chunk of this.doc.splitTextToSize(word.text, maxWidth) as string[]) {
          line.push({ ...word, text: chunk, width: this.doc.getTextWidth(chunk), space: 0 });
          flush();
        }
        continue;
      }
      line.push(word);
      lineWidth += word.width + word.space;
    }
    if (line.length) flush();
  }

  text(text: string, options: Parameters<BriefWriter['runs']>[1] & { bold?: boolean; italic?: boolean } = {}) {
    this.runs([{ text, bold: options.bold ?? false, italic: options.italic ?? false }], options);
  }

  /** Bulleted or numbered list item with a hanging indent; returns the text indent. */
  listItem(marker: string, runs: Run[], depth = 0): number {
    const size = BODY_SIZE;
    const markerX = depth * 14 + 4;
    this.setFont({ bold: false, italic: false }, size);
    const indent = markerX + Math.max(10, this.doc.getTextWidth(marker) + 6);
    this.ensureSpace(size * LINE_HEIGHT);
    this.doc.setTextColor(...TEXT_COLOR);
    this.doc.text(marker, PAGE_MARGIN + markerX, this.y + size);
    this.runs(runs, { indent });
    return indent;
  }

  heading(text: string, level: number) {
    const size = level <= 1 ? 15 : level === 2 ? 13 : 11.5;
    this.space(level <= 2 ? 10 : 6);
    this.ensureSpace(size * LINE_HEIGHT * 2);
    this.runs(parseInline(text).map((run) => ({ ...run, bold: true })), { size });
    this.space(2);
  }

  rule() {
    this.space(6);
    this.ensureSpace(8);
    this.doc.setDrawColor(222, 226, 230);
    this.doc.setLineWidth(0.75);
    this.doc.line(PAGE_MARGIN, this.y, this.pageWidth - PAGE_MARGIN, this.y);
    this.space(10);
  }

  /** Render the block-level markdown the AI cover letter uses. */
  markdown(source: string) {
    let inCode = false;
    for (const rawLine of source.split(/\r?\n/)) {
      const line = rawLine.replace(/\s+$/, '');

      if (/^\s*(```|~~~)/.test(line)) {
        inCode = !inCode;
        this.space(4);
        continue;
      }
      if (inCode) {
        this.text(line || ' ', { font: 'courier', size: 9, indent: 8 });
        continue;
      }
      if (!line.trim()) {
        this.space(BODY_SIZE * 0.6);
        continue;
      }

      const heading = line.match(/^\s*(#{1,6})\s+(.*)$/);
      if (heading) {
        this.heading(heading[2].replace(/\s*#+\s*$/, ''), heading[1].length + 1);
        continue;
      }
      if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
        this.rule();
        continue;
      }
      const depth = Math.floor((line.match(/^\s*/)?.[0].length ?? 0) / 2);
      const bullet = line.match(/^\s*[-*+]\s+(?:\[[ xX]\]\s+)?(.*)$/);
      if (bullet) {
        this.listItem('-', parseInline(bullet[1]), depth);
        continue;
      }
      const numbered = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
      if (numbered) {
        this.listItem(`${numbered[1]}.`, parseInline(numbered[2]), depth);
        continue;
      }
      const quote = line.match(/^\s*>\s?(.*)$/);
      if (quote) {
        this.runs(parseInline(quote[1]).map((run) => ({ ...run, italic: true })), { indent: 14, color: MUTED_COLOR });
        continue;
      }
      this.runs(parseInline(line));
    }
  }
}

export function buildProposalBriefPdf({
  projectTitle,
  coverLetter,
  highlights,
  milestones,
  formatAmount,
}: ProposalBriefInput): File {
  if (!JsPDFCtor) {
    throw new Error('Proposal PDF engine not loaded. Call loadProposalBriefPdf() first.');
  }

  const doc = new JsPDFCtor({ unit: 'pt', format: 'a4' });
  const title = `Proposal: ${projectTitle}`;
  doc.setProperties({ title: toPdfText(title), creator: 'FreelanceXchain' });

  const writer = new BriefWriter(doc);
  writer.text(title, { size: 18, bold: true });
  writer.space(2);
  writer.text(
    `Generated on: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
    { size: 9.5, color: MUTED_COLOR },
  );
  writer.rule();

  if (highlights.length) {
    writer.heading('Key Qualifications & Highlights', 2);
    for (const highlight of highlights) writer.listItem('-', parseInline(highlight));
  }

  writer.heading('Proposal & Technical Strategy', 2);
  writer.markdown(coverLetter);

  if (milestones.length) {
    writer.heading('Proposed Milestones & Delivery Schedule', 2);
    milestones.forEach((milestone, i) => {
      const indent = writer.listItem(`${i + 1}.`, [
        { text: milestone.title, bold: true, italic: false },
        { text: ` (${formatAmount(milestone.amount)} - ${milestone.durationDays} days)`, bold: false, italic: false },
      ]);
      if (milestone.description) writer.runs(parseInline(milestone.description), { indent, color: MUTED_COLOR });
      writer.space(4);
    });
  }

  writer.rule();
  writer.text('Submitted via FreelanceXchain Decentralized Platform with Smart Contract Escrow Protection.', {
    size: 9,
    italic: true,
    color: MUTED_COLOR,
  });

  const safeTitle = projectTitle.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  return new File([doc.output('blob')], `Proposal_${safeTitle || 'Brief'}.pdf`, { type: 'application/pdf' });
}

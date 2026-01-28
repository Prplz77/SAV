
export interface CallLog {
  id: string;
  phoneNumber: string;
  customerName: string;
  technicianName: string;
  timestamp: number;
  rawNotes: string;
  summary: CallSummary;
  ticketCreated: boolean;
  ticketNumber?: string;
}

export interface CallSummary {
  subject: string;
  issue: string;
  solution: string;
  nextSteps: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export type View = 'new-call' | 'history' | 'stats';

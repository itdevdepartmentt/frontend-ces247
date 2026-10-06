export interface ProcessStepValue {
  name: string;
  status?: string;
  notes?: string;
  orderId?: string;
}

export interface ConfirmationValue {
  status?: string;
  notes?: string;
}

export interface MassTicket {
  id: string;
  ticketNumber: string;
  ticketSubject: string | null;
  lastStatus: string | null;
  ticketCreated: string | null;
  jumlahMsisdn: number | null;
  detailCategory: string | null;
  subCategory: string | null;
  category: string | null;
  namaPerusahaan: string | null;
  projectId: string | null;

  agent: string | null;
  teamLeader: string | null;
  agentAssignedAt: string | null;
  agentChangeCount: number;
  waktuPengerjaanKhusus: string | null;

  validationPicStatus: string | null;
  validationPicNotes: string | null;
  validationPksStatus: string | null;
  validationPksNotes: string | null;
  validationNodinStatus: string | null;
  validationNodinNotes: string | null;
  validationStatus: string | null;

  profilingStatus: string | null;
  profilingOrderId: string | null;
  profilingNotes: string | null;

  processSteps: ProcessStepValue[] | null;
  confirmations: Record<string, ConfirmationValue> | null;
  customValues: Record<string, unknown> | null;

  currentProcess: string | null;
  overallStatus: string | null;
  processProgress: number;
  daysOpen: number;
  ageingBucket: string | null;
  bottleneck: string | null;
  bottleneckSince: string | null;
  idKoordinasiSummary: string | null;
  todoSummary: string | null;
  lastAction: string | null;
  lastActionBy: string | null;
  completionDate: string | null;

  uploadedAt: string;
  updatedAt: string;
}

export interface MassTicketHistory {
  id: string;
  ticketNumber: string;
  agent: string | null;
  teamLeader: string | null;
  process: string | null;
  previousStatus: string | null;
  newStatus: string | null;
  notes: string | null;
  orderId: string | null;
  bottleneck: string | null;
  actionBy: string | null;
  createdAt: string;
}

export interface MassAssignmentHistory {
  id: string;
  ticketNumber: string;
  previousAgent: string | null;
  newAgent: string | null;
  previousTeamLeader: string | null;
  newTeamLeader: string | null;
  changedBy: string | null;
  reason: string | null;
  notes: string | null;
  createdAt: string;
}

export interface MassTicketDetail extends MassTicket {
  histories: MassTicketHistory[];
  assignmentLogs: MassAssignmentHistory[];
}

export interface MassProcessStep {
  id: string;
  name: string;
  order: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface MassDailyActivity {
  id: string;
  activityDate: string;
  ticketNumber: string;
  agent: string;
  assignedAt: string | null;
  workedAt: string | null;
  notes: string | null;
}

export interface MassStaff {
  id: string;
  name: string;
  role: "AGENT" | "TEAM_LEADER";
  isActive: boolean;
}

export interface LastStatusSummary {
  total: number;
  open: number;
  closed: number;
  statuses: { label: string; count: number }[];
}

export interface CountBucket {
  label: string;
  count: number;
}

export interface MassDashboard {
  total: number;
  completedToday: number;
  inProgress: number;
  completed: number;
  byStatus: CountBucket[];
  byAgeing: CountBucket[];
  byBottleneck: CountBucket[];
  byProcess: CountBucket[];
  lastStatusSummary: LastStatusSummary;
}

export interface SaveRecapPayload {
  agent?: string;
  teamLeader?: string;
  waktuPengerjaanKhusus?: string;
  validationPicStatus?: string;
  validationPicNotes?: string;
  validationPksStatus?: string;
  validationPksNotes?: string;
  validationNodinStatus?: string;
  validationNodinNotes?: string;
  profilingStatus?: string;
  profilingOrderId?: string;
  profilingNotes?: string;
  processSteps?: ProcessStepValue[];
  confirmations?: Record<string, ConfirmationValue>;
  customValues?: Record<string, unknown>;
  notes?: string;
}

/**
 * Konfirmasi yang jadi sumber deteksi bottleneck. Urutannya sama dengan
 * CONFIRMATION_DEFS di backend — yang pertama berstatus "In Progress" itulah
 * yang muncul sebagai bottleneck.
 */
export const CONFIRMATIONS: { key: string; label: string; stage: string }[] = [
  { key: "validationCustomerConfirmation", label: "Customer Confirmation", stage: "Validation" },
  { key: "validationAmCoordination", label: "AM Coordination", stage: "Validation" },
  { key: "validationPrimeApproval", label: "Prime Approval", stage: "Validation" },
  { key: "profilingCustomerConfirmation", label: "Customer Confirmation", stage: "Profiling" },
  { key: "profilingAmCoordination", label: "AM Coordination", stage: "Profiling" },
  { key: "profilingBillcoApproval", label: "Billco Approval", stage: "Profiling" },
  { key: "deviceBundlingConfirmation", label: "Device Bundling Confirmation", stage: "Profiling" },
  { key: "parentNumberConfirmation", label: "Parent Number Confirmation", stage: "Profiling" },
];

export const VALIDATION_STATUSES = ["", "OK", "NOK"] as const;
export const PROFILING_STATUSES = ["", "In Progress", "Done"] as const;
export const CONFIRMATION_STATUSES = ["", "In Progress", "Done"] as const;
export const STEP_STATUSES = ["", "In Progress", "Done"] as const;

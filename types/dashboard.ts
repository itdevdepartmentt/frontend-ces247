export interface DashboardSummary {
  totalCreated: number;
  totalTickets: number;
  totalOpen: number;
  totalClosed: number;
  slaPercentage: string;
  dailyTrend: DailyTrend[];
  hourlyTrend: HourlyTrend[];
  csatScore: CsatScore;
  priority: Priority;
}

export interface Priority {
  vip: number;
  urgent: number;
  pareto: number;
  roaming: number;
  extra: number;
  cc: number;
}

export type PriorityType = 'roaming' | 'extra' | 'vip' | 'pareto' | 'urgent' | 'cc';

export interface PriorityTicket {
  ticketNumber: string;
  customerName: string | null;
  subject: string | null;
  channel: string | null;
  status: string | null;
  priority: string | null;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PriorityTicketResponse {
  data: PriorityTicket[];
  meta: PaginationMeta;
}

export interface CsatScore {
  totalsurvey: number;
  totaldijawab: number;
  totaljawaban45: number;
  scorecsat: number;
  persencsat: number;
}

export interface DailyTrend {
  date: string;
  value: number;
  sla: string;
}

export interface HourlyTrend {
  hour: string;
  total: number;
  closed: number;
}

export interface TopItem {
  name: string;
  total: number;
  ticket?: number;
  pctFcr?: string;
}

export interface ChannelData {
  channel: string; // e.g., "Whatsapp", "Email"
  source_origin: string;
  total: number;
  pctSla: string;
  open: number;
  closed: number;
  connOpen: number;
  solOpen: number;
  connOver3h: number;
  solOver6h: number;
  connOpenOver3h: number;
  solOpenOver6h: number;
  connOpenNear3h: number;
  solOpenNear6h: number;
  nonFcrCount: number;
  pctFcr: string;
  pctNonFcr: string;
  pctPareto: string;
  pctNotPareto: string;
  topCorporate: TopItem[];
  topKip: TopItem[];
}

export interface DashboardResponse {
  summary: DashboardSummary;
  channels: ChannelData[];
}

export interface Stats {
  openTickets: number;
  over3h: number;
}

export interface TopCorp {
  nama_perusahaan: string;
  total: number;
}

export interface TopKipsCorporate {
  detail_category: string;
  inSla: number;
  outSla: number;
  total: number;
}

export interface CategoryData {
  stats: Stats;
  topCorps: TopCorp[];
  topKips: TopKipsCorporate[];
}

export interface CorporateDetailResponse {
  vip: CategoryData;
  pareto: CategoryData;
}

export interface TopKips {
  detail_category: string;
  total: number;
  kipSla: string;
}

export interface TopCategories {
  general_category: string;
  total: number;
  catSla: string;
}

export interface Trend {
  product: string;
  date: string;
  total: number;
  dailySla: string;
}

export interface ProductDetail {
  product: string;
  total: number;
  open: number;
  over3h: number;
  pctSla: string;
  topKips: TopKips[];
  topCategories: TopCategories[];
  trend: Trend[];
}

export interface ProductDetailResponse {
  products: ProductDetail[];
}

export interface TopKipsCompany {
  detail_category: string;
  kip_count: number;
  kip_sla: string;
  rn: number;
}

export interface CompanyKips {
  company: string;
  totalTickets: number;
  companySla: string;
  topKips: TopKipsCompany[];
}

export interface CompanyKipsResponse {
  data: CompanyKips[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

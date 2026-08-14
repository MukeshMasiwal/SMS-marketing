export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "completed"
  | "failed"
  | "cancelled"
  | "DRAFT"
  | "SCHEDULED"
  | "SENDING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type SmsEncoding = "GSM-7" | "Unicode";

export interface SmsStats {
  characterCount: number;
  segmentCount: number;
  encoding: SmsEncoding;
  remainingInSegment: number;
}

export interface Campaign {
  _id?: string;
  userId: string;
  name: string;
  message: string;
  status: CampaignStatus;
  targetType?: string;
  targetGroupIds?: string[];
  targetContactIds?: string[];
  recipientCount?: number;
  characterCount?: number;
  segmentCount?: number;
  encoding?: SmsEncoding;
  scheduledAt?: string | Date;
  startedAt?: string | Date;
  completedAt?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

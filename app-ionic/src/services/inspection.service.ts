import api from "../lib/api";

export interface InspectionEvidencePayload {
  type: string;
  label: string;
  dataUrl?: string;
  metadata?: Record<string, any>;
}

export interface LocationPayload {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: string;
}

export interface CreateInspectionPayload {
  userId?: number;
  vehicleId?: number;
  quoteId?: number;
  status?: string;
  notes?: string;
  scheduledAt?: string;
  location?: LocationPayload;
  evidences?: InspectionEvidencePayload[];
}

export interface InspectionRecord {
  id: number;
  userId?: number;
  vehicleId?: number;
  quoteId?: number;
  status: string;
  notes?: string;
  scheduledAt?: string;
  createdAt?: string;
  location?: LocationPayload;
  customer?: {
    id?: number;
    name?: string;
    email?: string;
    mobile?: string;
  };
  vehicle?: {
    id?: number;
    brand?: string;
    model?: string;
    year?: number;
    plate?: string;
  };
  evidences?: InspectionEvidencePayload[];
}

export async function listInspections(): Promise<InspectionRecord[]> {
  const response = await api.get<{ success: boolean; data: InspectionRecord[] }>("/api/inspections");
  return response.data || [];
}

export async function createInspection(payload: CreateInspectionPayload): Promise<InspectionRecord> {
  const response = await api.post<{ success: boolean; data: InspectionRecord }>("/api/inspections", payload);
  return response.data;
}

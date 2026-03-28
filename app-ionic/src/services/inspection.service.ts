import api from "../lib/api";

export interface InspectionEvidencePayload {
  type: string;
  label?: string;
  dataUrl?: string;
  fileUrl?: string;
  metadata?: Record<string, any>;
}

export interface InspectionLocationPayload {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  capturedAt?: string;
}

export interface CreateInspectionPayload {
  userId?: number;
  vehicleId?: number;
  quoteId?: number;
  status?: string;
  notes?: string;
  scheduledAt?: string;
  location?: InspectionLocationPayload | null;
  evidences?: InspectionEvidencePayload[];
}

export async function createInspection(payload: CreateInspectionPayload) {
  const response = await api.post<{ success: boolean; data: any }>(
    "/api/inspections",
    payload,
    true,
  );

  return response.data;
}

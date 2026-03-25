import api from "../lib/api";
import { authService } from "./auth.service";
import { AppUser, normalizeAppUser } from "./user.utils";

export interface QuoteFlowInput {
  brand: string;
  model: string;
  year?: number;
  insuredValue: number;
  extrasValue?: number;
  plate?: string;
  city?: string;
  country?: string;
  status?: string;
  coveragePlan?: string;
  premiumNet?: number;
  taxes?: number;
  totalPremium?: number;
  payload?: Record<string, any>;
}

export interface QuoteFlowResult {
  user: AppUser;
  vehicle: any;
  quote: any;
}

async function getAuthenticatedUser(): Promise<AppUser> {
  const current = authService.getCurrentUser();
  const normalizedCurrent = normalizeAppUser(current);
  if (normalizedCurrent?.id) return normalizedCurrent;

  const fromApi = await authService.user();
  const normalizedApi = normalizeAppUser(fromApi);
  if (!normalizedApi?.id) {
    throw new Error("No se pudo identificar al usuario autenticado.");
  }

  return normalizedApi;
}

export async function createVehicleAndQuote(
  input: QuoteFlowInput,
): Promise<QuoteFlowResult> {
  const user = await getAuthenticatedUser();

  const vehicleResponse = await api.post<{ success: boolean; data: any }>(
    "/api/vehicles",
    {
      brand: input.brand,
      model: input.model,
      year: input.year,
      plate: input.plate,
      insuredValue: input.insuredValue,
      extrasValue: input.extrasValue || 0,
      metadata: input.payload?.vehicleMetadata || {},
    },
    true,
  );

  const vehicle = vehicleResponse.data;

  const quoteResponse = await api.post<{ success: boolean; data: any }>(
    "/api/quotes",
    {
      vehicleId: vehicle?.id,
      city: input.city || "Quito",
      country: input.country || "EC",
      status: input.status || "draft",
      coveragePlan: input.coveragePlan || "todo-riesgo",
      insuredValue: input.insuredValue,
      premiumNet: input.premiumNet,
      taxes: input.taxes,
      totalPremium: input.totalPremium,
      payload: input.payload || {},
    },
    true,
  );

  return {
    user,
    vehicle,
    quote: quoteResponse.data,
  };
}

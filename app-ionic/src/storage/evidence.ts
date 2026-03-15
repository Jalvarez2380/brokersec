import store from "./store";
import { EvidencePhoto, EvidencePhotoType } from "../services/camera.service";

const KEY = "quote_evidence";

export interface QuoteEvidence {
  vehicle?: EvidencePhoto;
  document?: EvidencePhoto;
}

const get = async (): Promise<QuoteEvidence> => {
  return (await store.get(KEY)) || {};
};

const savePhoto = async (photo: EvidencePhoto): Promise<QuoteEvidence> => {
  const current = await get();
  const updated: QuoteEvidence = {
    ...current,
    [photo.type]: photo,
  };

  await store.set(KEY, updated);
  return updated;
};

const removePhoto = async (type: EvidencePhotoType): Promise<QuoteEvidence> => {
  const current = await get();
  const updated: QuoteEvidence = { ...current };
  delete updated[type];
  await store.set(KEY, updated);
  return updated;
};

const clear = async (): Promise<void> => {
  await store.remove(KEY);
};

export const evidenceData = {
  get,
  savePhoto,
  removePhoto,
  clear,
};

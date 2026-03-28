export interface CapturedLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  capturedAt: string;
}

export type LocationWatcher = number;

function ensureGeolocation(): Geolocation {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error("La geolocalizacion no esta disponible en este dispositivo.");
  }

  return navigator.geolocation;
}

function mapPosition(position: GeolocationPosition): CapturedLocation {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
    capturedAt: new Date(position.timestamp).toISOString(),
  };
}

async function getCurrentLocation(): Promise<CapturedLocation> {
  const geolocation = ensureGeolocation();

  return new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(
      (position) => resolve(mapPosition(position)),
      (error) => reject(new Error(error.message || "No se pudo obtener la ubicacion actual.")),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  });
}

function watchLocation(
  onUpdate: (location: CapturedLocation) => void,
  onError?: (message: string) => void,
): LocationWatcher {
  const geolocation = ensureGeolocation();

  return geolocation.watchPosition(
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    },
    (position, error) => {
      if (error) {
        onError?.(error.message || "No se pudo actualizar la ubicacion.");
        return;
      }

      if (position) {
        onUpdate(mapPosition(position));
      }
    },
  );
}

function clearWatch(watcherId: LocationWatcher | null) {
  if (watcherId === null || watcherId === undefined) return;

  ensureGeolocation().clearWatch(watcherId);
}

export const locationService = {
  getCurrentLocation,
  watchLocation,
  clearWatch,
};

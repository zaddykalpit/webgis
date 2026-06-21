import { useState, useEffect } from "react";

export interface GeoLocation {
  lat: number;
  lng: number;
}

// Default to Kathmandu if location fails or is denied
export const DEFAULT_LOCATION: GeoLocation = {
  lat: 27.7172,
  lng: 85.3240
};

export function useGeolocation() {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );
  }, []);

  return { location, error, loading };
}

export async function requestGeolocation(): Promise<GeoLocation> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(DEFAULT_LOCATION);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        resolve(DEFAULT_LOCATION);
      },
      { timeout: 5000 }
    );
  });
}

//Path: apps/user-ui/src/hooks/useLocationTracking.tsx
"use client";
import { useEffect, useState } from "react";

const LOCATION_STORAGE_KEY = "user_location";
const LOCATION_EXPIRY_DAYS = 20;

const getLocationFromStorage = () => {
  if (typeof window === "undefined") return null;

  const storedData = localStorage.getItem(LOCATION_STORAGE_KEY);
  if (!storedData) return null;

  try {
    const parsedData = JSON.parse(storedData);
    const expiryTime = LOCATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    const isExpired = Date.now() - parsedData.timestamp > expiryTime;

    return isExpired ? null : parsedData.location;
  } catch {
    return null;
  }
};

const useLocationTracking = () => {
  const [location, setLocation] = useState<{
    country: string;
    city: string;
  } | null>(null);

  useEffect(() => {
    const cached = getLocationFromStorage();
    if (cached) {
      setLocation(cached);
      return;
    }

    fetch("http://ip-api.com/json/")
      .then((response) => {
        if (!response.ok)
          throw new Error(`Location API returned ${response.status}`);
        return response.json();
      })
      .then((data) => {
        const newLocation = {
          country: data?.country,
          city: data.city,
          timestamp: Date.now(),
        };

        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(newLocation));
        setLocation(newLocation);
      })
      .catch((error) => {
        console.warn("Location tracking unavailable (non-critical):", error);
        // Don't leave location as null forever — set a harmless fallback
        // so downstream code (Kafka events) doesn't wait indefinitely.
        setLocation({ country: "Unknown", city: "Unknown" });
      });
  }, []);

  return location;
};

export default useLocationTracking;

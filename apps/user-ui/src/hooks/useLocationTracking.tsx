"use client";
import { useEffect, useState } from "react";

const LOCATION_STORAGE_KEY = "user_location";
const LOCATION_EXPIRY_DAYS = 20;

const getLocationFromStorage = () => {
  if (typeof window === "undefined") return null; // extra safety guard

  const storedData = localStorage.getItem(LOCATION_STORAGE_KEY);
  if (!storedData) return null;

  const parsedData = JSON.parse(storedData);
  const expiryTime = LOCATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const isExpired = Date.now() - parsedData.timestamp > expiryTime;

  return isExpired ? null : parsedData.location;
};

const useLocationTracking = () => {
  const [location, setLocation] = useState<{
    country: string;
    city: string;
  } | null>(null); // start null, not localStorage-derived

  useEffect(() => {
    const cached = getLocationFromStorage();
    if (cached) {
      setLocation(cached);
      return;
    }

    fetch("https://ipapi.co/json/")
      .then((response) => response.json())
      .then((data) => {
        const newLocation = {
          country: data?.country_name,
          city: data.city,
          timestamp: Date.now(),
        };

        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(newLocation));
        setLocation(newLocation);
      })
      .catch((error) => {
        console.error("Error fetching location:", error);
      });
  }, []);

  return location;
};

export default useLocationTracking;

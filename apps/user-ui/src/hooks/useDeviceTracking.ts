//Path: apps/user-ui/src/hooks/useDeviceTracking.ts
"use client";
import { useEffect, useState } from "react";
import { UAParser } from "ua-parser-js";

//reports e.g. "Chrome on Windows (desktop)". The analytics dashboards read the word in brackets (mobile/tablet/desktop).
const useDeviceTracking = () => {
  const [deviceInfo, setDeviceInfo] = useState("");

  useEffect(() => {
    const result = new UAParser().getResult();
    const type = result.device.type;
    const kind = type === "mobile" || type === "tablet" ? type : "desktop";
    setDeviceInfo(`${result.browser.name ?? "Unknown"} on ${result.os.name ?? "Unknown"} (${kind})`);
  }, []);

  return deviceInfo;
};

export default useDeviceTracking;

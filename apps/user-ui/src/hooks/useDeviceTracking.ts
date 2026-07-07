//Path: apps/user-ui/src/hooks/useDeviceTracking.ts
"use client";
import { useEffect, useState } from "react";
import {UAParser} from "ua-parser-js";

const useDeviceTracking = () => {
   const [deviceInfo, setDeviceInfo] = useState("");

   useEffect(() => {
       const parser = new UAParser();
      const result = parser.getResult();

      setDeviceInfo(
         `${result.browser.name} ${result.browser.version} on ${result.os.name} ${result.os.version} (${result.device.type || 'desktop'}`);
   }, []);

   return deviceInfo;
};

export default useDeviceTracking;
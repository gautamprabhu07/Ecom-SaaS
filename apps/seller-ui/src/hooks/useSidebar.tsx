//Path: apps/seller-ui/src/hooks/useSidebar.tsx
"use client";

import { useAtom } from "jotai";
import { activeSidebarItem } from "../configs/constants";

const useSidebar = () => {
  const [activeSidebar, setActiveSidebar] = useAtom(activeSidebarItem);
  return { activeSidebar, setActiveSidebar };
};

export default useSidebar;

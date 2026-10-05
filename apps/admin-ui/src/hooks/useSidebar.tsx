import { activeSidebarAtom } from "../configs/constants";
import { useAtom } from "jotai";

const useSidebar = () => {
  const [activeSidebar, setActiveSidebar] = useAtom(activeSidebarAtom);
  return { activeSidebar, setActiveSidebar };
};

export default useSidebar;

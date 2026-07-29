//Path: apps/admin-ui/src/shared/components/sidebar/sidebarmenu.tsx

interface Props {
  title: string;
  children: React.ReactNode;
}

const SidebarMenu = ({ title, children }: Props) => {
  return (
    <div className="mt-6">
      <h3 className="px-5 mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {title}
      </h3>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
};

export default SidebarMenu;

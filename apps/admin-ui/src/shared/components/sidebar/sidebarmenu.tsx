interface Props {
  title: string;
  children: React.ReactNode;
}

const SidebarMenu = ({ title, children }: Props) => {
  return (
    <div>
      <h3>{title}</h3>
      {children}
    </div>
  );
};

export default SidebarMenu;

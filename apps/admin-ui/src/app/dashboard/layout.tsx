const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      {/* sidebar */}
      <aside>
        <div>
          <SidebarWrapper />
        </div>
      </aside>

      {/* main content */}
      <main>
        <div>{children}</div>
      </main>
    </div>
  );
};

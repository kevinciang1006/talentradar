const AdminPlaceholder = ({ title }: { title: string }) => {
  return (
    <div className="px-6 lg:px-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      <div className="bg-card rounded-xl border border-border p-10 mt-6 text-center">
        <p className="text-muted-foreground">This section is coming soon.</p>
      </div>
    </div>
  );
};

export default AdminPlaceholder;

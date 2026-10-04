interface PanelSurfaceProps {
  className?: string;
}

export function PanelSurface({ className }: PanelSurfaceProps) {
  return (
    <div className="page-panel-shadow h-full">
      <div className={["page-panel-surface h-full", className].filter(Boolean).join(" ")} />
    </div>
  );
}

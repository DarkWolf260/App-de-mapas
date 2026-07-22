import { Shield, Flame, Layers } from "lucide-react";
import type { DepartmentView } from "../types";

interface DepartmentTabsProps {
  activeDepartment: DepartmentView;
  onDepartmentChange: (dept: DepartmentView) => void;
}

const tabs: { key: DepartmentView; label: string; icon: React.ReactNode }[] = [
  { key: "pc", label: "Proteccion Civil", icon: <Shield size={12} /> },
  { key: "bomberos", label: "Bomberos", icon: <Flame size={12} /> },
  { key: "mixto", label: "Mixto", icon: <Layers size={12} /> },
];

export function DepartmentTabs({ activeDepartment, onDepartmentChange }: DepartmentTabsProps) {
  return (
    <div className="dept-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`dept-tab ${activeDepartment === tab.key ? "active" : ""}`}
          onClick={() => onDepartmentChange(tab.key)}
          title={tab.label}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

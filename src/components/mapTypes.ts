import type { DrawnFeature, DailyLog, DepartmentView } from "../types";
import type { UserPermissions } from "../services/adminUsersService";

export interface MapFeatureActions {
  onFeatureAdded: (feat: DrawnFeature) => void;
  onFeatureDeleted: (id: number) => void;
  onSaveDailyLog?: (featureId: number, log: DailyLog) => Promise<void>;
  onToggleFeatureLock?: (id: number, locked: boolean) => void;
  onRenameFeature?: (id: number, title: string) => Promise<void>;
  onUpdateFeatureDescription?: (id: number, desc: string) => Promise<void>;
  onUpdateFeatureColor?: (id: number, color: string) => Promise<void>;
  onUpdateFeatureCollapsed?: (id: number, isCollapsed: boolean, count: string | number) => Promise<void>;
  onRefreshFeatures?: () => Promise<void>;
  onOpenRangeReport?: (feat: DrawnFeature | "all") => void;
}

export interface MapUIContext {
  selectedDate: string;
  activeDepartment?: DepartmentView;
  showSidebar?: boolean;
  isAdmin?: boolean;
  isOperador?: boolean;
  isAuthenticated?: boolean;
  isSuspended?: boolean;
  permissions?: UserPermissions;
  showAccumulated?: boolean;
  showPoints?: boolean;
  showAreas?: boolean;
  sidebarOpen?: boolean;
  bitacoraOpen?: boolean;
  onSelectedDateChange?: (date: string) => void;
  onFeatureClick?: () => void;
}

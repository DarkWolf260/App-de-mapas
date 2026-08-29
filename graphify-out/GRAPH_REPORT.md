# Graph Report - App de mapas  (2026-08-29)

## Corpus Check
- 180 files · ~150,000 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 783 nodes · 2149 edges · 30 communities (26 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 25
- Community 26

## God Nodes (most connected - your core abstractions)
1. `DrawnFeature` - 85 edges
2. `DepartmentView` - 49 edges
3. `DailyLog` - 44 edges
4. `getNormalizedGroupList()` - 39 edges
5. `LayerVisibility` - 19 edges
6. `GroupLogEntry` - 17 edges
7. `logHasAnyData()` - 16 edges
8. `mergeLogs()` - 16 edges
9. `getGeometryHandler()` - 16 edges
10. `buildParentsMap()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `UseGroupingOptions` --references--> `GroupLogEntry`  [EXTRACTED]
  src/components/popup/useGrouping.ts → src/types.ts
- `MetricDisplayGridProps` --references--> `DailyLog`  [EXTRACTED]
  src/components/popup/MetricGrid.tsx → src/types.ts
- `FloatingSearchBarProps` --references--> `DrawnFeature`  [EXTRACTED]
  src/components/FloatingSearchBar.tsx → src/types.ts
- `LocationPickerProps` --references--> `DrawnFeature`  [EXTRACTED]
  src/components/pizarra/LocationPicker.tsx → src/types.ts
- `App()` --calls--> `useAuth()`  [EXTRACTED]
  src/App.tsx → src/hooks/useAuth.ts

## Import Cycles
- None detected.

## Communities (30 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (53): rootEl, AdminApp(), AdminHeader(), AdminHeaderProps, AdminSection, TAB_BUTTON_STYLE(), DeleteUserModal(), DeleteUserModalProps (+45 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (60): ConfirmModal(), ConfirmModalProps, DateRow(), ActivePoint, computeActivePoints(), computeTeams(), DeploymentSummaryCard(), getRiskBadgeInfo() (+52 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (34): RealtimeStatusBadge(), RealtimeStatusBadgeProps, MapArea, MapPoint, SidebarProps, SidebarHeaderProps, initDatabase(), useFeatureDB() (+26 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (43): CreateWorkTeamModal(), CreateWorkTeamModalProps, inputStyle, labelStyle, DepartmentSelect(), DepartmentSelectProps, labelStyle, EditWorkTeamModal() (+35 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (49): ColorPicker(), ColorPickerProps, DRAW_TOOLS, DrawingToolbar(), DrawingToolbarProps, ToolId, MapComponentProps, MapSettingsPanel() (+41 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (39): App(), ConfirmDeleteModal(), ConfirmDeleteModalProps, DeploymentSummaryCardProps, FloatingSearchBar(), FloatingSearchBarProps, parseCoords(), GlobalStatsWidget() (+31 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (32): DrawnFeaturesList(), DrawnFeaturesListProps, GroupSectionProps, parseCoords(), FEATURE_ICONS, FeatureCard(), FeatureCardProps, ReportImageTab() (+24 more)

### Community 7 - "Community 7"
Cohesion: 0.10
Nodes (37): DEFAULT_COLOR, distToSegment(), featIdOf(), FeatureSvgOverlay, FeatureSvgOverlayInner(), FeatureSvgOverlayProps, hitPolygon(), hitPolyline() (+29 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (20): getTypeIcon(), getTypeText(), ImportPreviewModal(), ImportPreviewModalProps, FeatureSchema, RxDrawnDatabase, RxDrawnDatabaseCollections, RxDrawnFeatureCollection (+12 more)

### Community 9 - "Community 9"
Cohesion: 0.19
Nodes (20): InfoTab(), COMMISSION_INDEPENDENT, COMMISSION_PREFIX, formatCoordFromFeature(), formatCoordinates(), getCoordLabel(), getMetricNumeric(), getMetricValue() (+12 more)

### Community 10 - "Community 10"
Cohesion: 0.17
Nodes (18): GroupLogForm(), CustomActivitiesSection(), CustomActivitiesSectionProps, GeneralTab(), getGroupColor(), OperationTab(), inputStyle, labelStyle (+10 more)

### Community 11 - "Community 11"
Cohesion: 0.13
Nodes (18): AddBaseBanner(), AddBaseBannerProps, DeleteConfirmModal(), DeleteConfirmModalProps, EditModeBanner(), EditModeBannerProps, OverwriteWarningModal(), OverwriteWarningModalProps (+10 more)

### Community 12 - "Community 12"
Cohesion: 0.13
Nodes (18): BitacoraCalendar(), BitacoraCalendarProps, formatDateStr(), MONTH_NAMES, pad2(), WEEKDAY_NAMES, buildDateRange(), DateTimeline() (+10 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (20): DateRowProps, DepartmentTabs(), DepartmentTabsProps, tabs, GroupLogFormProps, MobilePersonalSheetProps, ContainedTab(), ContainedTabProps (+12 more)

### Community 14 - "Community 14"
Cohesion: 0.11
Nodes (19): DEFAULT_CAMPAMENTOS, DEFAULT_OPERATIONAL_BASES, DEFAULT_REDAN_REGIONS, DEFAULT_STATE_COUNTS, EMPTY_CAMPAMENTOS, fetchOperationalBases(), getBaseTotal(), getGrandTotal() (+11 more)

### Community 15 - "Community 15"
Cohesion: 0.20
Nodes (10): InlineRowEditor(), InlineRowEditorProps, HistoryTab(), HistoryTabProps, useLogEditor(), baseLog, BasemapKey, ContainedItem (+2 more)

### Community 16 - "Community 16"
Cohesion: 0.25
Nodes (11): AddCampEntryModal(), AddCampEntryModalProps, getInitialValues(), BaseCard(), BaseCardProps, TotalGeneralCard(), TotalGeneralCardProps, BOMBEROS_ENTITIES (+3 more)

### Community 17 - "Community 17"
Cohesion: 0.26
Nodes (11): C(), colName(), crc32(), createZip(), escapeXML(), exportConsolidadoToExcel(), addMerge(), fullMerge() (+3 more)

### Community 18 - "Community 18"
Cohesion: 0.24
Nodes (7): GroupFields(), GroupFieldsProps, MetricBadgesProps, MetricInputsProps, JointGroupCardProps, defaultGroup, GroupLogEntry

### Community 20 - "Community 20"
Cohesion: 0.31
Nodes (8): CONTAINER_STYLE, CustomMapPopup(), FeatureEditActions, TAB_BAR_STYLE, tabBtnStyle(), TabId, useFeaturePopupSession(), computeContainedItems()

### Community 21 - "Community 21"
Cohesion: 0.33
Nodes (5): RedanCard(), RedanCardProps, Campamento, REDAN_REGIONS, RedanRegion

### Community 22 - "Community 22"
Cohesion: 0.67
Nodes (3): CampsSection(), CampsSectionProps, CampamentoEntry

## Knowledge Gaps
- **115 isolated node(s):** `rootEl`, `rootEl`, `rootEl`, `rootEl`, `BasemapKey` (+110 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DrawnFeature` connect `Community 6` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 15`, `Community 20`?**
  _High betweenness centrality (0.179) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 0` to `Community 11`, `Community 5`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `DepartmentView` connect `Community 13` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 9`, `Community 10`, `Community 15`, `Community 18`, `Community 19`, `Community 20`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `rootEl`, `rootEl`, `rootEl` to the rest of the system?**
  _115 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05189873417721519 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08373904576436222 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05438184663536776 - nodes in this community are weakly interconnected._
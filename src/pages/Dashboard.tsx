import React, { useState, useMemo } from 'react';
import {
  Waves,
  Wind,
  Compass,
  Thermometer,
  ShieldCheck,
  Activity,
  Radio,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Info,
  ChevronDown,
  ChevronUp,
  MapPin,
  Sparkles,
} from 'lucide-react';
import {
  MARINE_ZONES,
  MarineZone,
  ORCA_AI_INSIGHTS,
  OrcaAiInsight,
  DATA_SOURCES,
} from '../data/marineAnalyticsData';
import { AnalyticsFilterBar, FilterState } from '../components/analytics/AnalyticsFilterBar';
import { AnalyticsKpiSection } from '../components/analytics/AnalyticsKpiSection';
import { MarineIntelligenceMap } from '../components/analytics/MarineIntelligenceMap';
import { GoogleMarineMap } from '../components/analytics/GoogleMarineMap';
import { MarineChartsSection } from '../components/analytics/MarineChartsSection';
import { ResearchInsightsSection } from '../components/analytics/ResearchInsightsSection';
import { OrcaAiInsightsSection } from '../components/analytics/OrcaAiInsightsSection';
import { DataSourceHealthSection } from '../components/analytics/DataSourceHealthSection';
import { ResearchReportModal } from '../components/analytics/ResearchReportModal';
import {
  analyzeMarineLocation,
  LocationAnalysisResponse,
} from '../services/orcaLocationService';
import {
  AppMode,
  ModeAgentOrchestrator,
  ModeOrchestratorResult,
} from '../services/modeController';
import { LocationAnalysisPanel } from '../components/analytics/LocationAnalysisPanel';
import { LocationComparisonModal } from '../components/analytics/LocationComparisonModal';

export const Dashboard: React.FC = () => {
  // -------------------------------------------------------------
  // Filter State
  // -------------------------------------------------------------
  const [filters, setFilters] = useState<FilterState>({
    region: 'all',
    dateRange: '30d',
    riskLevel: 'all',
    hazardType: 'all',
    dataSource: 'all',
  });

  // Selected marine zone for detailed telemetry examination
  const [selectedZoneId, setSelectedZoneId] = useState<string>('zone-konkan-north');

  // Modal for Research Summary / Executive Report
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Toggle for raw sector telemetry grid expansion
  const [isTelemetryTableExpanded, setIsTelemetryTableExpanded] = useState(true);

  // -------------------------------------------------------------
  // Click-to-Analyze Marine Location State (Context-Aware Multi-Agent)
  // -------------------------------------------------------------
  const [activeMapMode, setActiveMapMode] = useState<AppMode>('fisherman');
  const [simulatePfzUnavailable, setSimulatePfzUnavailable] = useState(false);
  const [simulateOutdatedWeather, setSimulateOutdatedWeather] = useState(false);
  const [lastClickedCoords, setLastClickedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [orchestratedResult, setOrchestratedResult] =
    useState<ModeOrchestratorResult | null>(null);

  const [selectedLocationData, setSelectedLocationData] =
    useState<LocationAnalysisResponse | null>(null);
  const [isLocationPanelOpen, setIsLocationPanelOpen] = useState(false);
  const [isAnalyzingLocation, setIsAnalyzingLocation] = useState(false);
  const [analyzingStep, setAnalyzingStep] = useState<number>(7);
  const [pinnedLocations, setPinnedLocations] = useState<LocationAnalysisResponse[]>([]);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  // Google Maps API Key handling & Engine Selection
  const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [customKey, setCustomKey] = useState<string>(() => {
    return localStorage.getItem('orca_gmaps_key') || envKey;
  });
  const effectiveKey = customKey || envKey;

  const [mapEngine, setMapEngine] = useState<'google-maps' | 'tactical'>(() => {
    const saved = localStorage.getItem('orca_dashboard_map_engine');
    if (saved === 'google-maps' || saved === 'tactical') return saved;
    // Default to Google Maps as requested
    return 'google-maps';
  });

  const handleSwitchEngine = (engine: 'google-maps' | 'tactical') => {
    setMapEngine(engine);
    localStorage.setItem('orca_dashboard_map_engine', engine);
  };

  // Progressive analysis runner using Mode Agent Orchestrator
  const runLocationAnalysis = (
    lat?: number,
    lng?: number,
    targetMode: AppMode = activeMapMode,
    optionsOverride?: { simulatePfzUnavailable?: boolean; simulateOutdatedWeather?: boolean }
  ) => {
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      return;
    }
    setLastClickedCoords({ lat, lng });
    setIsAnalyzingLocation(true);
    setAnalyzingStep(1);
    setIsLocationPanelOpen(true);

    const simOptions = {
      simulatePfzUnavailable: optionsOverride?.simulatePfzUnavailable ?? simulatePfzUnavailable,
      simulateOutdatedWeather: optionsOverride?.simulateOutdatedWeather ?? simulateOutdatedWeather,
    };

    // 1. Run Legacy/General synthesis for background charts & comparisons
    const initialResult = analyzeMarineLocation(lat, lng);
    setSelectedLocationData(initialResult);

    // 2. Run Context-Aware Multi-Agent Orchestration for Active Mode
    const orchResult = ModeAgentOrchestrator.orchestrate(lat, lng, targetMode, simOptions);
    setOrchestratedResult(orchResult);

    // Simulate progressive real-time agent evaluation sequence
    const timer1 = setTimeout(() => setAnalyzingStep(3), 350);
    const timer2 = setTimeout(() => setAnalyzingStep(5), 700);
    const timer3 = setTimeout(() => {
      setAnalyzingStep(7);
      setIsAnalyzingLocation(false);
    }, 1050);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  };

  const handleModeChange = (newMode: AppMode) => {
    setActiveMapMode(newMode);
    if (lastClickedCoords) {
      const orchResult = ModeAgentOrchestrator.orchestrate(
        lastClickedCoords.lat,
        lastClickedCoords.lng,
        newMode,
        { simulatePfzUnavailable, simulateOutdatedWeather }
      );
      setOrchestratedResult(orchResult);
    }
  };

  const handleTogglePfzSimulation = () => {
    const nextVal = !simulatePfzUnavailable;
    setSimulatePfzUnavailable(nextVal);
    if (lastClickedCoords) {
      const orchResult = ModeAgentOrchestrator.orchestrate(
        lastClickedCoords.lat,
        lastClickedCoords.lng,
        activeMapMode,
        { simulatePfzUnavailable: nextVal, simulateOutdatedWeather }
      );
      setOrchestratedResult(orchResult);
    }
  };

  const handleToggleOutdatedSimulation = () => {
    const nextVal = !simulateOutdatedWeather;
    setSimulateOutdatedWeather(nextVal);
    if (lastClickedCoords) {
      const orchResult = ModeAgentOrchestrator.orchestrate(
        lastClickedCoords.lat,
        lastClickedCoords.lng,
        activeMapMode,
        { simulatePfzUnavailable, simulateOutdatedWeather: nextVal }
      );
      setOrchestratedResult(orchResult);
    }
  };

  const handleMapLocationClick = (coords?: { lat: number; lng: number }) => {
    if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') return;
    runLocationAnalysis(coords.lat, coords.lng, activeMapMode);
  };

  const handlePinLocation = (loc: LocationAnalysisResponse) => {
    if (!loc?.location || typeof loc.location.lat !== 'number' || typeof loc.location.lng !== 'number') return;
    setPinnedLocations((prev) => {
      const exists = prev.some(
        (p) =>
          p.location?.lat === loc.location.lat && p.location?.lng === loc.location.lng
      );
      if (exists) {
        return prev.filter(
          (p) =>
            !(
              p.location?.lat === loc.location.lat &&
              p.location?.lng === loc.location.lng
            )
        );
      } else {
        return [...prev, loc];
      }
    });
  };

  // -------------------------------------------------------------
  // Filter Handler
  // -------------------------------------------------------------
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      region: 'all',
      dateRange: '30d',
      riskLevel: 'all',
      hazardType: 'all',
      dataSource: 'all',
    });
  };

  // -------------------------------------------------------------
  // Filtered Dataset
  // -------------------------------------------------------------
  const filteredZones = useMemo(() => {
    return MARINE_ZONES.filter((zone) => {
      // Region filter
      if (filters.region !== 'all' && zone.region !== filters.region) {
        return false;
      }
      // Risk Level filter
      if (filters.riskLevel !== 'all' && zone.riskLevel !== filters.riskLevel) {
        return false;
      }
      // Hazard Type filter
      if (
        filters.hazardType !== 'all' &&
        !zone.currentHazards.includes(filters.hazardType)
      ) {
        return false;
      }
      // Data source filter
      if (
        filters.dataSource !== 'all' &&
        !zone.dataSource.toLowerCase().includes(filters.dataSource.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [filters]);

  // Active Zone data
  const activeZone =
    filteredZones.find((z) => z.id === selectedZoneId) ||
    filteredZones[0] ||
    MARINE_ZONES[0];

  // -------------------------------------------------------------
  // Dynamic KPIs calculated from filtered dataset
  // -------------------------------------------------------------
  const kpiData = useMemo(() => {
    const totalZones = filteredZones.length;
    const activeRiskAlerts = filteredZones.filter(
      (z) => z.riskLevel === 'HIGH' || z.riskLevel === 'CRITICAL' || z.alertNotice
    ).length;
    const activePfzZones = filteredZones.filter((z) => z.pfzStatus === 'ACTIVE').length;
    const highRiskZones = filteredZones.filter(
      (z) => z.riskLevel === 'HIGH' || z.riskLevel === 'CRITICAL'
    ).length;

    const avgSst =
      totalZones > 0
        ? filteredZones.reduce((acc, z) => acc + z.seaSurfaceTemp, 0) / totalZones
        : 29.4;

    const onlineSources = DATA_SOURCES.filter((s) => s.status === 'ONLINE').length;

    return {
      activeRiskAlerts: filters.riskLevel === 'all' && filters.region === 'all' ? 12 : activeRiskAlerts,
      activePfzZones: filters.riskLevel === 'all' && filters.region === 'all' ? 28 : activePfzZones,
      avgSst,
      monitoredZones: filters.region === 'all' ? 156 : totalZones * 16,
      highRiskZones: filters.riskLevel === 'all' && filters.region === 'all' ? 7 : highRiskZones,
      dataSourcesOnline: { online: onlineSources, total: DATA_SOURCES.length },
    };
  }, [filteredZones, filters]);

  // -------------------------------------------------------------
  // Data Export Handlers
  // -------------------------------------------------------------
  const handleDownloadData = () => {
    // Generate CSV from current filtered telemetry
    const headers = [
      'Sector ID',
      'Sector Name',
      'Region',
      'Latitude',
      'Longitude',
      'Risk Level',
      'Risk Score',
      'Sea Surface Temp (C)',
      'Wave Height (m)',
      'Wind Speed (kts)',
      'Wind Direction',
      'Chlorophyll (mg/m3)',
      'Salinity (PSU)',
      'Current Hazards',
      'PFZ Status',
      'Vessels in Zone',
      'Data Source',
    ];

    const rows = filteredZones.map((z) => [
      z.id,
      `"${z.name}"`,
      z.region,
      z.lat,
      z.lng,
      z.riskLevel,
      z.riskScore,
      z.seaSurfaceTemp,
      z.waveHeight,
      z.windSpeed,
      z.windDirection,
      z.chlorophyll,
      z.salinity,
      `"${z.currentHazards.join('; ')}"`,
      z.pfzStatus,
      z.pfzVesselsCount,
      `"${z.dataSource}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ORCA_Marine_Telemetry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportReport = () => {
    setIsReportModalOpen(true);
  };

  const handleGenerateResearchSummary = () => {
    setIsReportModalOpen(true);
  };

  return (
    <div
      id="orca-analytics-dashboard"
      className="w-full flex-1 max-w-7xl mx-auto px-3 sm:px-6 md:px-8 py-6 text-white select-text pb-24 space-y-7"
    >
      {/* Top Main Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest text-cyan-400 uppercase">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            GOVERNMENT & RESEARCH COMMAND CONSOLE • SIH ORCA PLATFORM
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white font-sans mt-1">
            Marine Intelligence & Research Analytics
          </h1>
          <p className="text-xs sm:text-sm text-white/60 font-sans mt-1">
            Integrated multi-sensor telemetry for Disaster Management, Fisheries Departments, and Oceanographic Research
          </p>
        </div>

        {/* Status Pill & Live Buoy Sync Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 liquid-glass px-4 py-2 rounded-2xl border border-white/15 shadow-lg">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div className="flex flex-col text-left text-xs">
              <span className="text-white/40 font-mono text-[10px] uppercase">
                INCOIS / NIOT BUOY MESH
              </span>
              <span className="font-bold text-white font-mono">48 BUOYS STREAMING</span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------- */}
      {/* 1. FILTER BAR                                           */}
      {/* ------------------------------------------------------- */}
      <AnalyticsFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onExportReport={handleExportReport}
        onDownloadData={handleDownloadData}
        onGenerateResearchSummary={handleGenerateResearchSummary}
        totalFilteredZones={filteredZones.length}
      />

      {/* ------------------------------------------------------- */}
      {/* 2. TOP KPI SECTION (6 Cards)                            */}
      {/* ------------------------------------------------------- */}
      <AnalyticsKpiSection
        kpis={kpiData}
        onKpiClick={(metricId) => {
          if (metricId === 'kpi-high-risk') {
            handleFilterChange('riskLevel', 'HIGH');
          } else if (metricId === 'kpi-pfz-zones') {
            handleFilterChange('hazardType', 'all');
          }
        }}
      />

      {/* ------------------------------------------------------- */}
      {/* 3. MAIN MARINE INTELLIGENCE MAP (Largest Section)        */}
      {/* ------------------------------------------------------- */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-white/80 font-mono">
              GEOSPATIAL INTELLIGENCE GRID • CLICK ANYWHERE TO ANALYZE
            </span>
          </div>
          <div className="flex items-center gap-3">
            {pinnedLocations.length > 0 && (
              <button
                onClick={() => setIsComparisonModalOpen(true)}
                className="text-[11px] font-mono text-cyan-300 hover:text-cyan-200 underline cursor-pointer"
              >
                Compare Pinned ({pinnedLocations.length})
              </button>
            )}
            <span className="text-[11px] font-mono text-white/50 hidden sm:inline">
              7-Agent ensemble ready on click
            </span>
          </div>
        </div>

        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20">
          {mapEngine === 'google-maps' ? (
            <GoogleMarineMap
              apiKey={effectiveKey}
              zones={filteredZones}
              selectedZoneId={selectedZoneId}
              onSelectZone={(z) => {
                if (!z || typeof z.lat !== 'number' || typeof z.lng !== 'number') return;
                setSelectedZoneId(z.id);
                runLocationAnalysis(z.lat, z.lng);
              }}
              selectedLocation={
                selectedLocationData?.location &&
                typeof selectedLocationData.location.lat === 'number' &&
                typeof selectedLocationData.location.lng === 'number'
                  ? {
                      lat: selectedLocationData.location.lat,
                      lng: selectedLocationData.location.lng,
                      riskLevel: selectedLocationData.consensus?.overallRisk,
                      pfzSuitability: selectedLocationData.parameters?.pfzSuitability,
                    }
                  : null
              }
              onMapLocationClick={handleMapLocationClick}
              activeMode={activeMapMode}
              onChangeMode={handleModeChange}
              onSwitchEngine={handleSwitchEngine}
              onSaveApiKey={(key) => setCustomKey(key)}
            />
          ) : (
            <MarineIntelligenceMap
              zones={filteredZones}
              selectedZoneId={selectedZoneId}
              onSelectZone={(z) => {
                if (!z || typeof z.lat !== 'number' || typeof z.lng !== 'number') return;
                setSelectedZoneId(z.id);
                runLocationAnalysis(z.lat, z.lng);
              }}
              selectedLocation={
                selectedLocationData?.location &&
                typeof selectedLocationData.location.lat === 'number' &&
                typeof selectedLocationData.location.lng === 'number'
                  ? {
                      lat: selectedLocationData.location.lat,
                      lng: selectedLocationData.location.lng,
                      riskLevel: selectedLocationData.consensus?.overallRisk,
                      pfzSuitability: selectedLocationData.parameters?.pfzSuitability,
                    }
                  : null
              }
              onMapLocationClick={handleMapLocationClick}
              activeMode={activeMapMode}
              onChangeMode={handleModeChange}
              onSwitchEngine={handleSwitchEngine}
            />
          )}

          {/* Slide-out Location Analysis Panel */}
          {orchestratedResult && (
            <LocationAnalysisPanel
              data={selectedLocationData}
              orchestratedResult={orchestratedResult}
              isOpen={isLocationPanelOpen}
              onClose={() => setIsLocationPanelOpen(false)}
              isAnalyzing={isAnalyzingLocation}
              analyzingStep={analyzingStep}
              onReAnalyze={() => {
                if (
                  lastClickedCoords &&
                  typeof lastClickedCoords.lat === 'number' &&
                  typeof lastClickedCoords.lng === 'number'
                ) {
                  runLocationAnalysis(
                    lastClickedCoords.lat,
                    lastClickedCoords.lng,
                    activeMapMode
                  );
                } else if (
                  selectedLocationData?.location &&
                  typeof selectedLocationData.location.lat === 'number' &&
                  typeof selectedLocationData.location.lng === 'number'
                ) {
                  runLocationAnalysis(
                    selectedLocationData.location.lat,
                    selectedLocationData.location.lng,
                    activeMapMode
                  );
                }
              }}
              onPinForComparison={handlePinLocation}
              isPinned={Boolean(
                selectedLocationData?.location &&
                  pinnedLocations.some(
                    (p) =>
                      p?.location &&
                      p.location.lat === selectedLocationData.location.lat &&
                      p.location.lng === selectedLocationData.location.lng
                  )
              )}
              totalPinnedCount={pinnedLocations.length}
              onOpenComparison={() => setIsComparisonModalOpen(true)}
              activeMode={activeMapMode}
              onChangeMode={handleModeChange}
              simulatePfzUnavailable={simulatePfzUnavailable}
              onToggleSimulatePfzUnavailable={handleTogglePfzSimulation}
              simulateOutdatedWeather={simulateOutdatedWeather}
              onToggleSimulateOutdatedWeather={handleToggleOutdatedSimulation}
            />
          )}
        </div>
      </div>

      {/* Active Selected Zone Detailed Telemetry Drawer Banner */}
      {activeZone && (
        <div className="liquid-glass rounded-2xl p-4 sm:p-5 border border-cyan-500/30 shadow-xl bg-gradient-to-r from-cyan-950/40 via-black/50 to-blue-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                ACTIVE SECTOR TELEMETRY
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  activeZone.riskLevel === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : activeZone.riskLevel === 'HIGH'
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                    : activeZone.riskLevel === 'MODERATE'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {activeZone.riskLevel} RISK (Score: {activeZone.riskScore}/100)
              </span>
            </div>
            <h3 className="text-lg font-bold text-white font-sans">
              {activeZone.name}
            </h3>
            <p className="text-xs text-white/60">
              Lat: {activeZone.lat}°N • Lng: {activeZone.lng}°E • Region: {activeZone.region} • Feed: {activeZone.dataSource}
            </p>
          </div>

          {/* Key Metrics Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[10px] text-white/40 block">SEA SURFACE TEMP</span>
              <span className="text-amber-400 font-bold text-sm">{activeZone.seaSurfaceTemp}°C</span>
            </div>
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[10px] text-white/40 block">SIGNIFICANT WAVE</span>
              <span className="text-blue-400 font-bold text-sm">{activeZone.waveHeight}m</span>
            </div>
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[10px] text-white/40 block">SURFACE WIND</span>
              <span className="text-teal-400 font-bold text-sm">{activeZone.windSpeed} kts ({activeZone.windDirection})</span>
            </div>
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[10px] text-white/40 block">CHLOROPHYLL-A</span>
              <span className="text-emerald-400 font-bold text-sm">{activeZone.chlorophyll} mg/m³</span>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------- */}
      {/* 4. SIX MAIN CHARTS SECTION                              */}
      {/* ------------------------------------------------------- */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1 pb-1">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-white/80 font-mono">
              OCEAN STATE & RISK TIME-SERIES ANALYSIS
            </span>
          </div>
          <span className="text-[11px] font-mono text-white/50">
            6 Multi-dimensional Diagnostic Charts
          </span>
        </div>

        <MarineChartsSection
          selectedLocation={
            selectedLocationData?.location &&
            typeof selectedLocationData.location.lat === 'number' &&
            typeof selectedLocationData.location.lng === 'number'
              ? {
                  lat: selectedLocationData.location.lat,
                  lng: selectedLocationData.location.lng,
                  nearestCoast: selectedLocationData.location.nearestCoast,
                  riskScore: selectedLocationData.parameters?.riskScore ?? 45,
                  sst: selectedLocationData.parameters?.sst ?? 28,
                  waveHeight: selectedLocationData.parameters?.waveHeight ?? 1.5,
                }
              : null
          }
          onResetLocation={() => setSelectedLocationData(null)}
        />
      </div>

      {/* ------------------------------------------------------- */}
      {/* 5. RESEARCH INSIGHTS SECTION                            */}
      {/* ------------------------------------------------------- */}
      <ResearchInsightsSection />

      {/* ------------------------------------------------------- */}
      {/* 6. ORCA AI INSIGHTS SECTION                             */}
      {/* ------------------------------------------------------- */}
      <OrcaAiInsightsSection
        onAskAi={(insight) => {
          setIsReportModalOpen(true);
        }}
      />

      {/* ------------------------------------------------------- */}
      {/* 7. DATA SOURCE HEALTH SECTION                           */}
      {/* ------------------------------------------------------- */}
      <DataSourceHealthSection />

      {/* ------------------------------------------------------- */}
      {/* 8. MARITIME SECTOR TELEMETRY TABLE (Foldable Grid)      */}
      {/* ------------------------------------------------------- */}
      <div className="liquid-glass rounded-3xl border border-white/15 p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white/80">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-sans">
                Real-Time Maritime Grid Telemetry Table
              </h2>
              <p className="text-xs text-white/50 font-sans">
                Sector-by-sector live telemetry records ({filteredZones.length} sectors active in view)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadData}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setIsTelemetryTableExpanded((prev) => !prev)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white border border-white/20 transition-colors cursor-pointer"
              title={isTelemetryTableExpanded ? 'Collapse Table' : 'Expand Table'}
            >
              {isTelemetryTableExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isTelemetryTableExpanded && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/50 text-[11px] font-mono uppercase">
                  <th className="py-3 px-3">Ocean Sector</th>
                  <th className="py-3 px-3">Region</th>
                  <th className="py-3 px-3">Wave Height</th>
                  <th className="py-3 px-3">Wind Speed</th>
                  <th className="py-3 px-3">SST</th>
                  <th className="py-3 px-3">Chlorophyll</th>
                  <th className="py-3 px-3">PFZ Status</th>
                  <th className="py-3 px-3">Risk Level</th>
                  <th className="py-3 px-3 text-right">Data Stream</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredZones.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedZoneId(row.id)}
                    className={`hover:bg-white/[0.04] transition-colors cursor-pointer ${
                      row.id === selectedZoneId ? 'bg-cyan-500/10' : ''
                    }`}
                  >
                    <td className="py-3.5 px-3 font-medium text-white flex items-center gap-2">
                      <Compass className="w-3.5 h-3.5 text-cyan-400/70" />
                      <div>
                        <span>{row.name}</span>
                        {row.alertNotice && (
                          <span className="block text-[10px] text-rose-300 font-mono truncate max-w-[240px]">
                            ⚠️ {row.alertNotice}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-white/70 font-mono text-xs">{row.region}</td>
                    <td className="py-3.5 px-3 text-cyan-200 font-mono font-semibold">{row.waveHeight}m</td>
                    <td className="py-3.5 px-3 text-teal-200 font-mono">{row.windSpeed} kts ({row.windDirection})</td>
                    <td className="py-3.5 px-3 text-amber-200 font-mono">{row.seaSurfaceTemp}°C</td>
                    <td className="py-3.5 px-3 text-emerald-200 font-mono">{row.chlorophyll} mg/m³</td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono ${
                          row.pfzStatus === 'ACTIVE'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                            : 'bg-white/5 text-white/40 border border-white/10'
                        }`}
                      >
                        {row.pfzStatus === 'ACTIVE' ? `PFZ (${row.pfzVesselsCount} boats)` : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium font-mono ${
                          row.riskLevel === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : row.riskLevel === 'HIGH'
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                            : row.riskLevel === 'MODERATE'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {row.riskLevel}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-[11px] text-white/40">
                      {row.dataSource}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------- */}
      {/* 9. RESEARCH REPORT MODAL                                */}
      {/* ------------------------------------------------------- */}
      <ResearchReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        zones={filteredZones}
        kpis={kpiData}
        insights={ORCA_AI_INSIGHTS}
      />

      {/* ------------------------------------------------------- */}
      {/* 10. MULTI-LOCATION COMPARISON MODAL                     */}
      {/* ------------------------------------------------------- */}
      {isComparisonModalOpen && (
        <LocationComparisonModal
          locations={pinnedLocations}
          activeLocationId={
            selectedLocationData?.location &&
            typeof selectedLocationData.location.lat === 'number' &&
            typeof selectedLocationData.location.lng === 'number'
              ? `${selectedLocationData.location.lat}_${selectedLocationData.location.lng}`
              : undefined
          }
          onSelectActive={(loc) => {
            setSelectedLocationData(loc);
            setIsLocationPanelOpen(true);
          }}
          onRemoveLocation={handlePinLocation}
          onClose={() => setIsComparisonModalOpen(false)}
        />
      )}
    </div>
  );
};

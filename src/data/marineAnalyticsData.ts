/**
 * ORCA Marine Intelligence & Analytics Platform Dataset
 * Configured for Government Authorities, Fisheries Departments,
 * Disaster Management, and Marine/Environmental Researchers.
 * 
 * Cleanly structured with explicit interfaces so real APIs (INCOIS, IMD, ISRO)
 * can easily replace demo telemetry streams.
 */

export interface MarineZone {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  riskScore: number; // 0 to 100
  seaSurfaceTemp: number; // °C
  waveHeight: number; // meters
  windSpeed: number; // knots
  windDirection: string;
  chlorophyll: number; // mg/m3
  salinity: number; // PSU
  currentHazards: string[];
  pfzStatus: 'ACTIVE' | 'INACTIVE';
  pfzVesselsCount: number;
  primarySpecies: string[];
  alertNotice?: string;
  dataSource: string;
  lastUpdated: string;
}

export interface RiskTrendPoint {
  timeframe: string;
  date: string;
  riskScore: number;
  criticalZonesCount: number;
  waveIndex: number;
}

export interface HazardCategoryCount {
  category: string;
  count: number;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  trend: string;
}

export interface SSTTrendPoint {
  month: string;
  temperature: number;
  historicalBaseline: number;
  anomaly: number;
}

export interface PFZRegionData {
  region: string;
  activeZones: number;
  estimatedCatchIndex: number;
  recommendedFleetSize: number;
  favorableWaterMass: string;
}

export interface RiskDistributionItem {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface MonthlyAlertItem {
  month: string;
  cycloneAlerts: number;
  highWaveAlerts: number;
  heavyRainAlerts: number;
  totalAlerts: number;
}

export interface SSTVsFishingScatterPoint {
  sst: number; // Sea Surface Temp °C
  fishingActivityIndex: number; // 0 to 100
  zone: string;
  species: string;
  chlorophyll: number;
}

export interface WaveVsWindPoint {
  windSpeed: number; // knots
  waveHeight: number; // meters
  beaufortScale: number;
  zone: string;
}

export interface TempAnomalyPoint {
  sector: string;
  anomaly: number; // +/- °C
  standardDeviation: number;
  status: 'Cooling' | 'Normal' | 'Mild Anomaly' | 'Severe Marine Heatwave';
}

export interface ChlorophyllZonePoint {
  zone: string;
  chlorophyll: number; // mg/m3
  primaryProductivity: 'Oligotrophic' | 'Mesotrophic' | 'Eutrophic';
  planktonAbundance: string;
}

export interface EnvironmentalIndicator {
  parameter: string;
  currentValue: string;
  baseline: string;
  changeRate: string;
  status: 'Stable' | 'Caution' | 'Advisory';
  impactAssessment: string;
}

export interface OrcaAiInsight {
  id: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH RISK' | 'ADVISORY' | 'PFZ OPPORTUNITY';
  confidence: number; // 0 - 100
  source: string;
  timestamp: string;
  affectedRegion: string;
  suggestedAction: string;
  tags: string[];
}

export interface DataSourceStatus {
  id: string;
  name: string;
  provider: string;
  status: 'ONLINE' | 'DELAYED' | 'OFFLINE';
  lastUpdated: string;
  freshness: string;
  availability: string;
  latencyMs: number;
  streamType: string;
  coverage: string;
}

// -------------------------------------------------------------------------
// 1. MONITORED MARINE SECTORS & ZONES
// -------------------------------------------------------------------------
export const MARINE_ZONES: MarineZone[] = [
  {
    id: 'zone-konkan-north',
    name: 'North Konkan Shelf (Mumbai Offshore)',
    region: 'Konkan',
    lat: 18.92,
    lng: 72.15,
    riskLevel: 'MODERATE',
    riskScore: 54,
    seaSurfaceTemp: 29.2,
    waveHeight: 1.8,
    windSpeed: 17,
    windDirection: 'WSW',
    chlorophyll: 1.42,
    salinity: 34.6,
    currentHazards: ['Rough Sea', 'Strong Winds'],
    pfzStatus: 'ACTIVE',
    pfzVesselsCount: 38,
    primarySpecies: ['Indian Mackerel', 'Pomfret', 'Ribbonfish'],
    alertNotice: 'Swell surge expected during lunar tidal transit.',
    dataSource: 'INCOIS + IMD',
    lastUpdated: '3 min ago',
  },
  {
    id: 'zone-konkan-south',
    name: 'South Konkan Deep Basin (Ratnagiri)',
    region: 'Konkan',
    lat: 16.98,
    lng: 72.48,
    riskLevel: 'LOW',
    riskScore: 28,
    seaSurfaceTemp: 28.8,
    waveHeight: 1.2,
    windSpeed: 12,
    windDirection: 'SW',
    chlorophyll: 2.15,
    salinity: 34.8,
    currentHazards: [],
    pfzStatus: 'ACTIVE',
    pfzVesselsCount: 45,
    primarySpecies: ['Oil Sardine', 'Squid', 'Seerfish'],
    dataSource: 'INCOIS PFZ Feed',
    lastUpdated: '5 min ago',
  },
  {
    id: 'zone-goa-coastal',
    name: 'Goa Coastal & Shelf Trench',
    region: 'Goa',
    lat: 15.35,
    lng: 73.42,
    riskLevel: 'LOW',
    riskScore: 32,
    seaSurfaceTemp: 29.5,
    waveHeight: 1.1,
    windSpeed: 11,
    windDirection: 'SW',
    chlorophyll: 1.88,
    salinity: 34.4,
    currentHazards: [],
    pfzStatus: 'ACTIVE',
    pfzVesselsCount: 29,
    primarySpecies: ['Mackerel', 'Anchovy', 'Prawns'],
    dataSource: 'NIOT Buoy BD08',
    lastUpdated: '2 min ago',
  },
  {
    id: 'zone-karnataka-mangalore',
    name: 'Karnataka Coastal Corridor (Mangaluru)',
    region: 'Karnataka',
    lat: 12.85,
    lng: 74.32,
    riskLevel: 'HIGH',
    riskScore: 78,
    seaSurfaceTemp: 30.1,
    waveHeight: 3.1,
    windSpeed: 26,
    windDirection: 'W',
    chlorophyll: 1.1,
    salinity: 34.2,
    currentHazards: ['High Waves', 'Strong Winds', 'Heavy Rain'],
    pfzStatus: 'INACTIVE',
    pfzVesselsCount: 8,
    primarySpecies: ['Tuna', 'Carangids'],
    alertNotice: 'Squally weather warning issued; small craft suspension advisory.',
    dataSource: 'IMD Doppler + INCOIS',
    lastUpdated: 'Just now',
  },
  {
    id: 'zone-karnataka-karwar',
    name: 'Karwar Marine Sanctuary Outer Belt',
    region: 'Karnataka',
    lat: 14.81,
    lng: 73.88,
    riskLevel: 'MODERATE',
    riskScore: 48,
    seaSurfaceTemp: 29.7,
    waveHeight: 1.9,
    windSpeed: 18,
    windDirection: 'WSW',
    chlorophyll: 1.95,
    salinity: 34.5,
    currentHazards: ['Rough Sea'],
    pfzStatus: 'ACTIVE',
    pfzVesselsCount: 22,
    primarySpecies: ['Sardines', 'Mullets'],
    dataSource: 'INCOIS Buoy AD02',
    lastUpdated: '8 min ago',
  },
  {
    id: 'zone-kerala-kochi',
    name: 'Malabar Trench (Kochi Bight)',
    region: 'Kerala',
    lat: 9.92,
    lng: 75.78,
    riskLevel: 'CRITICAL',
    riskScore: 92,
    seaSurfaceTemp: 30.6,
    waveHeight: 3.8,
    windSpeed: 34,
    windDirection: 'WNW',
    chlorophyll: 2.85,
    salinity: 33.9,
    currentHazards: ['Cyclone', 'High Waves', 'Storm Surge', 'Rough Sea'],
    pfzStatus: 'INACTIVE',
    pfzVesselsCount: 3,
    primarySpecies: ['Tuna', 'Sardine'],
    alertNotice: 'CYCLONIC GALE WARNING: Evacuation protocol recommended for offshore fishing fleets.',
    dataSource: 'IMD Cyclone Warning Centre',
    lastUpdated: '1 min ago',
  },
  {
    id: 'zone-kerala-vizhinjam',
    name: 'Wadge Bank Outer Grounds (Vizhinjam)',
    region: 'Kerala',
    lat: 8.28,
    lng: 76.82,
    riskLevel: 'HIGH',
    riskScore: 74,
    seaSurfaceTemp: 29.8,
    waveHeight: 2.9,
    windSpeed: 24,
    windDirection: 'W',
    chlorophyll: 2.3,
    salinity: 34.1,
    currentHazards: ['High Waves', 'Storm Surge'],
    pfzStatus: 'INACTIVE',
    pfzVesselsCount: 11,
    primarySpecies: ['Perches', 'Snappers', 'Tuna'],
    alertNotice: 'High swell warning (2.8m - 3.2m).',
    dataSource: 'INCOIS Coastal Radar',
    lastUpdated: '4 min ago',
  },
  {
    id: 'zone-tamilnadu-chennai',
    name: 'Coromandel Basin (Chennai Offshore)',
    region: 'Tamil Nadu',
    lat: 13.12,
    lng: 80.45,
    riskLevel: 'LOW',
    riskScore: 24,
    seaSurfaceTemp: 28.6,
    waveHeight: 0.9,
    windSpeed: 10,
    windDirection: 'ESE',
    chlorophyll: 1.35,
    salinity: 33.6,
    currentHazards: [],
    pfzStatus: 'ACTIVE',
    pfzVesselsCount: 42,
    primarySpecies: ['Seerfish', 'Snapper', 'Crabs'],
    dataSource: 'ISRO Oceansat-3 OCM',
    lastUpdated: '6 min ago',
  },
  {
    id: 'zone-tamilnadu-gulf-mannar',
    name: 'Gulf of Mannar Biosphere Sector',
    region: 'Tamil Nadu',
    lat: 9.15,
    lng: 79.18,
    riskLevel: 'MODERATE',
    riskScore: 51,
    seaSurfaceTemp: 29.4,
    waveHeight: 1.6,
    windSpeed: 19,
    windDirection: 'SE',
    chlorophyll: 3.1,
    salinity: 34.7,
    currentHazards: ['Strong Winds', 'Temperature Anomaly'],
    pfzStatus: 'ACTIVE',
    pfzVesselsCount: 35,
    primarySpecies: ['Barramundi', 'Lethrinids', 'Squid'],
    alertNotice: 'Thermal anomaly +1.2°C detected; monitoring coral reef stress.',
    dataSource: 'INCOIS Reef Thermal Stress',
    lastUpdated: '9 min ago',
  },
  {
    id: 'zone-lakshadweep',
    name: 'Lakshadweep Archipelago Channel',
    region: 'Lakshadweep',
    lat: 10.57,
    lng: 72.63,
    riskLevel: 'HIGH',
    riskScore: 82,
    seaSurfaceTemp: 30.4,
    waveHeight: 3.4,
    windSpeed: 29,
    windDirection: 'WNW',
    chlorophyll: 0.85,
    salinity: 35.4,
    currentHazards: ['Rough Sea', 'High Waves', 'Strong Winds'],
    pfzStatus: 'INACTIVE',
    pfzVesselsCount: 5,
    primarySpecies: ['Yellowfin Tuna', 'Skipjack'],
    alertNotice: 'Inter-island ferry operations suspended.',
    dataSource: 'NIOT Deep Sea Mooring',
    lastUpdated: '5 min ago',
  },
];

// -------------------------------------------------------------------------
// 2. TIME SERIES DATA FOR CHART 1 (MARINE RISK TREND)
// -------------------------------------------------------------------------
export const RISK_TREND_7D: RiskTrendPoint[] = [
  { timeframe: '7d', date: 'Day -6', riskScore: 38, criticalZonesCount: 2, waveIndex: 1.4 },
  { timeframe: '7d', date: 'Day -5', riskScore: 42, criticalZonesCount: 3, waveIndex: 1.6 },
  { timeframe: '7d', date: 'Day -4', riskScore: 49, criticalZonesCount: 3, waveIndex: 1.9 },
  { timeframe: '7d', date: 'Day -3', riskScore: 61, criticalZonesCount: 5, waveIndex: 2.3 },
  { timeframe: '7d', date: 'Day -2', riskScore: 76, criticalZonesCount: 6, waveIndex: 2.9 },
  { timeframe: '7d', date: 'Day -1', riskScore: 84, criticalZonesCount: 8, waveIndex: 3.4 },
  { timeframe: '7d', date: 'Today', riskScore: 71, criticalZonesCount: 7, waveIndex: 2.8 },
];

export const RISK_TREND_30D: RiskTrendPoint[] = [
  { timeframe: '30d', date: 'Wk 1', riskScore: 32, criticalZonesCount: 1, waveIndex: 1.2 },
  { timeframe: '30d', date: 'Wk 2', riskScore: 45, criticalZonesCount: 3, waveIndex: 1.7 },
  { timeframe: '30d', date: 'Wk 3', riskScore: 68, criticalZonesCount: 6, waveIndex: 2.6 },
  { timeframe: '30d', date: 'Wk 4', riskScore: 73, criticalZonesCount: 7, waveIndex: 2.9 },
];

export const RISK_TREND_3M: RiskTrendPoint[] = [
  { timeframe: '3m', date: 'Month -2', riskScore: 39, criticalZonesCount: 2, waveIndex: 1.3 },
  { timeframe: '3m', date: 'Month -1', riskScore: 58, criticalZonesCount: 4, waveIndex: 2.1 },
  { timeframe: '3m', date: 'Current', riskScore: 72, criticalZonesCount: 7, waveIndex: 2.9 },
];

export const RISK_TREND_1Y: RiskTrendPoint[] = [
  { timeframe: '1y', date: 'Jan', riskScore: 22, criticalZonesCount: 1, waveIndex: 0.9 },
  { timeframe: '1y', date: 'Feb', riskScore: 25, criticalZonesCount: 1, waveIndex: 1.0 },
  { timeframe: '1y', date: 'Mar', riskScore: 29, criticalZonesCount: 1, waveIndex: 1.1 },
  { timeframe: '1y', date: 'Apr', riskScore: 36, criticalZonesCount: 2, waveIndex: 1.3 },
  { timeframe: '1y', date: 'May', riskScore: 64, criticalZonesCount: 5, waveIndex: 2.4 },
  { timeframe: '1y', date: 'Jun', riskScore: 88, criticalZonesCount: 9, waveIndex: 3.6 },
  { timeframe: '1y', date: 'Jul', riskScore: 82, criticalZonesCount: 8, waveIndex: 3.3 },
  { timeframe: '1y', date: 'Aug', riskScore: 77, criticalZonesCount: 7, waveIndex: 3.1 },
  { timeframe: '1y', date: 'Sep', riskScore: 68, criticalZonesCount: 6, waveIndex: 2.6 },
  { timeframe: '1y', date: 'Oct', riskScore: 55, criticalZonesCount: 4, waveIndex: 2.0 },
  { timeframe: '1y', date: 'Nov', riskScore: 48, criticalZonesCount: 3, waveIndex: 1.8 },
  { timeframe: '1y', date: 'Dec', riskScore: 28, criticalZonesCount: 1, waveIndex: 1.1 },
];

// -------------------------------------------------------------------------
// 3. CHART 2: HAZARDS BY CATEGORY
// -------------------------------------------------------------------------
export const HAZARDS_BY_CATEGORY: HazardCategoryCount[] = [
  { category: 'Cyclone', count: 3, severity: 'critical', trend: '+1 vs last week' },
  { category: 'High Waves', count: 18, severity: 'high', trend: '+4 vs last week' },
  { category: 'Strong Winds', count: 24, severity: 'high', trend: '+6 vs last week' },
  { category: 'Heavy Rain', count: 16, severity: 'moderate', trend: '+2 vs last week' },
  { category: 'Storm Surge', count: 7, severity: 'high', trend: '+2 vs last week' },
  { category: 'Rough Sea', count: 29, severity: 'moderate', trend: '+5 vs last week' },
  { category: 'Temp Anomaly', count: 9, severity: 'moderate', trend: '+1 vs last week' },
];

// -------------------------------------------------------------------------
// 4. CHART 3: SEA SURFACE TEMPERATURE TREND
// -------------------------------------------------------------------------
export const SST_TREND_DATA: SSTTrendPoint[] = [
  { month: 'Jan', temperature: 27.8, historicalBaseline: 27.5, anomaly: 0.3 },
  { month: 'Feb', temperature: 28.2, historicalBaseline: 27.9, anomaly: 0.3 },
  { month: 'Mar', temperature: 28.7, historicalBaseline: 28.3, anomaly: 0.4 },
  { month: 'Apr', temperature: 29.1, historicalBaseline: 28.6, anomaly: 0.5 },
  { month: 'May', temperature: 29.6, historicalBaseline: 28.9, anomaly: 0.7 },
  { month: 'Jun', temperature: 29.4, historicalBaseline: 28.7, anomaly: 0.7 },
  { month: 'Jul', temperature: 28.9, historicalBaseline: 28.2, anomaly: 0.7 },
  { month: 'Aug', temperature: 28.5, historicalBaseline: 28.0, anomaly: 0.5 },
  { month: 'Sep', temperature: 28.7, historicalBaseline: 28.2, anomaly: 0.5 },
  { month: 'Oct', temperature: 29.0, historicalBaseline: 28.4, anomaly: 0.6 },
  { month: 'Nov', temperature: 28.6, historicalBaseline: 28.1, anomaly: 0.5 },
  { month: 'Dec', temperature: 28.0, historicalBaseline: 27.6, anomaly: 0.4 },
];

// -------------------------------------------------------------------------
// 5. CHART 4: POTENTIAL FISHING ZONES (PFZ) BY REGION
// -------------------------------------------------------------------------
export const PFZ_BY_REGION: PFZRegionData[] = [
  { region: 'Konkan', activeZones: 9, estimatedCatchIndex: 82, recommendedFleetSize: 140, favorableWaterMass: 'Upwelling Front' },
  { region: 'Goa', activeZones: 5, estimatedCatchIndex: 68, recommendedFleetSize: 85, favorableWaterMass: 'Thermal Boundary' },
  { region: 'Karnataka', activeZones: 4, estimatedCatchIndex: 58, recommendedFleetSize: 70, favorableWaterMass: 'Chlorophyll Plume' },
  { region: 'Kerala', activeZones: 2, estimatedCatchIndex: 34, recommendedFleetSize: 30, favorableWaterMass: 'Rough Sea Dispersal' },
  { region: 'Tamil Nadu', activeZones: 8, estimatedCatchIndex: 79, recommendedFleetSize: 120, favorableWaterMass: 'Shelf Front' },
];

// -------------------------------------------------------------------------
// 6. CHART 5: RISK DISTRIBUTION
// -------------------------------------------------------------------------
export const RISK_DISTRIBUTION: RiskDistributionItem[] = [
  { name: 'Low', value: 72, percentage: 46.2, color: '#10b981' },
  { name: 'Moderate', value: 49, percentage: 31.4, color: '#f59e0b' },
  { name: 'High', value: 28, percentage: 17.9, color: '#f97316' },
  { name: 'Critical', value: 7, percentage: 4.5, color: '#ef4444' },
];

// -------------------------------------------------------------------------
// 7. CHART 6: MONTHLY ALERT TREND
// -------------------------------------------------------------------------
export const MONTHLY_ALERTS: MonthlyAlertItem[] = [
  { month: 'Jan', cycloneAlerts: 0, highWaveAlerts: 3, heavyRainAlerts: 1, totalAlerts: 4 },
  { month: 'Feb', cycloneAlerts: 0, highWaveAlerts: 4, heavyRainAlerts: 1, totalAlerts: 5 },
  { month: 'Mar', cycloneAlerts: 0, highWaveAlerts: 5, heavyRainAlerts: 2, totalAlerts: 7 },
  { month: 'Apr', cycloneAlerts: 1, highWaveAlerts: 8, heavyRainAlerts: 5, totalAlerts: 14 },
  { month: 'May', cycloneAlerts: 3, highWaveAlerts: 19, heavyRainAlerts: 14, totalAlerts: 36 },
  { month: 'Jun', cycloneAlerts: 4, highWaveAlerts: 28, heavyRainAlerts: 26, totalAlerts: 58 },
  { month: 'Jul', cycloneAlerts: 2, highWaveAlerts: 26, heavyRainAlerts: 24, totalAlerts: 52 },
  { month: 'Aug', cycloneAlerts: 1, highWaveAlerts: 22, heavyRainAlerts: 20, totalAlerts: 43 },
  { month: 'Sep', cycloneAlerts: 2, highWaveAlerts: 17, heavyRainAlerts: 15, totalAlerts: 34 },
  { month: 'Oct', cycloneAlerts: 4, highWaveAlerts: 14, heavyRainAlerts: 12, totalAlerts: 30 },
  { month: 'Nov', cycloneAlerts: 3, highWaveAlerts: 11, heavyRainAlerts: 8, totalAlerts: 22 },
  { month: 'Dec', cycloneAlerts: 1, highWaveAlerts: 5, heavyRainAlerts: 3, totalAlerts: 9 },
];

// -------------------------------------------------------------------------
// 8. RESEARCH INSIGHTS DATASETS
// -------------------------------------------------------------------------
// SST vs Fishing Activity (Scatter plot: shows thermal optimum 28.5°C - 29.5°C)
export const SST_VS_FISHING: SSTVsFishingScatterPoint[] = [
  { sst: 26.5, fishingActivityIndex: 28, zone: 'Offshore Trench A', species: 'Tuna', chlorophyll: 0.6 },
  { sst: 27.2, fishingActivityIndex: 44, zone: 'Shelf Edge B', species: 'Seerfish', chlorophyll: 0.9 },
  { sst: 27.8, fishingActivityIndex: 61, zone: 'Ratnagiri Deep', species: 'Mackerel', chlorophyll: 1.4 },
  { sst: 28.2, fishingActivityIndex: 78, zone: 'Konkan Front', species: 'Oil Sardine', chlorophyll: 2.1 },
  { sst: 28.6, fishingActivityIndex: 94, zone: 'Goa Coastal Trench', species: 'Oil Sardine', chlorophyll: 2.4 },
  { sst: 28.9, fishingActivityIndex: 91, zone: 'Coromandel South', species: 'Pomfret', chlorophyll: 2.2 },
  { sst: 29.2, fishingActivityIndex: 86, zone: 'Malabar Upwelling Zone', species: 'Mackerel', chlorophyll: 2.5 },
  { sst: 29.5, fishingActivityIndex: 73, zone: 'Karwar Inshore', species: 'Anchovy', chlorophyll: 1.8 },
  { sst: 29.9, fishingActivityIndex: 49, zone: 'Mangalore Corridor', species: 'Carangids', chlorophyll: 1.1 },
  { sst: 30.3, fishingActivityIndex: 32, zone: 'Kochi Deep Basin', species: 'Squid', chlorophyll: 0.7 },
  { sst: 30.8, fishingActivityIndex: 18, zone: 'Lakshadweep Thermal Pool', species: 'Yellowfin', chlorophyll: 0.5 },
  { sst: 31.2, fishingActivityIndex: 12, zone: 'Kavarrati Outer Ring', species: 'Skipjack', chlorophyll: 0.4 },
];

// Wave Height vs Wind Speed (Correlation)
export const WAVE_VS_WIND: WaveVsWindPoint[] = [
  { windSpeed: 8, waveHeight: 0.7, beaufortScale: 2, zone: 'Chennai Coastal' },
  { windSpeed: 11, waveHeight: 1.0, beaufortScale: 3, zone: 'Goa Bay' },
  { windSpeed: 14, waveHeight: 1.3, beaufortScale: 4, zone: 'Ratnagiri' },
  { windSpeed: 18, waveHeight: 1.9, beaufortScale: 5, zone: 'Mumbai Offshore' },
  { windSpeed: 22, waveHeight: 2.4, beaufortScale: 6, zone: 'Karwar' },
  { windSpeed: 26, waveHeight: 3.0, beaufortScale: 6, zone: 'Mangalore' },
  { windSpeed: 31, waveHeight: 3.5, beaufortScale: 7, zone: 'Lakshadweep' },
  { windSpeed: 36, waveHeight: 4.1, beaufortScale: 8, zone: 'Kochi Bight' },
];

// Temperature Anomalies across sectors
export const TEMP_ANOMALIES: TempAnomalyPoint[] = [
  { sector: 'Konkan North', anomaly: +0.6, standardDeviation: 0.22, status: 'Mild Anomaly' },
  { sector: 'Konkan South', anomaly: +0.3, standardDeviation: 0.18, status: 'Normal' },
  { sector: 'Goa Shelf', anomaly: +0.8, standardDeviation: 0.25, status: 'Mild Anomaly' },
  { sector: 'Karnataka Coastal', anomaly: +1.4, standardDeviation: 0.31, status: 'Severe Marine Heatwave' },
  { sector: 'Malabar / Kochi', anomaly: +1.9, standardDeviation: 0.35, status: 'Severe Marine Heatwave' },
  { sector: 'Coromandel Basin', anomaly: +0.2, standardDeviation: 0.15, status: 'Normal' },
  { sector: 'Gulf of Mannar', anomaly: +1.2, standardDeviation: 0.28, status: 'Severe Marine Heatwave' },
  { sector: 'Lakshadweep', anomaly: +1.7, standardDeviation: 0.32, status: 'Severe Marine Heatwave' },
];

// Chlorophyll / Ocean Productivity
export const CHLOROPHYLL_ZONES: ChlorophyllZonePoint[] = [
  { zone: 'Gulf of Mannar', chlorophyll: 3.10, primaryProductivity: 'Eutrophic', planktonAbundance: 'High' },
  { zone: 'Malabar / Kochi', chlorophyll: 2.85, primaryProductivity: 'Eutrophic', planktonAbundance: 'Very High' },
  { zone: 'Wadge Bank', chlorophyll: 2.30, primaryProductivity: 'Mesotrophic', planktonAbundance: 'High' },
  { zone: 'South Konkan', chlorophyll: 2.15, primaryProductivity: 'Mesotrophic', planktonAbundance: 'High' },
  { zone: 'Karwar Sanctuary', chlorophyll: 1.95, primaryProductivity: 'Mesotrophic', planktonAbundance: 'Moderate' },
  { zone: 'Goa Shelf', chlorophyll: 1.88, primaryProductivity: 'Mesotrophic', planktonAbundance: 'Moderate' },
  { zone: 'North Konkan', chlorophyll: 1.42, primaryProductivity: 'Mesotrophic', planktonAbundance: 'Moderate' },
  { zone: 'Coromandel Basin', chlorophyll: 1.35, primaryProductivity: 'Mesotrophic', planktonAbundance: 'Moderate' },
  { zone: 'Lakshadweep Basin', chlorophyll: 0.85, primaryProductivity: 'Oligotrophic', planktonAbundance: 'Low' },
];

// Environmental Indicators
export const ENVIRONMENTAL_INDICATORS: EnvironmentalIndicator[] = [
  {
    parameter: 'Sea Surface Acidity (pH)',
    currentValue: '8.06 pH',
    baseline: '8.14 pH (1990-2020)',
    changeRate: '-0.012 pH / decade',
    status: 'Advisory',
    impactAssessment: 'Calcification stress observed in Gulf of Mannar coral colonies.'
  },
  {
    parameter: 'Dissolved Oxygen (DO)',
    currentValue: '4.8 mg/L',
    baseline: '5.6 mg/L',
    changeRate: '-0.15 mg/L / year',
    status: 'Caution',
    impactAssessment: 'Subsurface hypoxic layer expanding along Southwestern continental margin.'
  },
  {
    parameter: 'Salinity Profile',
    currentValue: '34.4 PSU',
    baseline: '34.6 PSU',
    changeRate: '-0.4% seasonality variance',
    status: 'Stable',
    impactAssessment: 'Normal freshwater runoff balance following pre-monsoon precipitation.'
  },
  {
    parameter: 'Ocean Thermal Heat Content',
    currentValue: '118.4 kJ/cm²',
    baseline: '104.2 kJ/cm²',
    changeRate: '+13.6% above climatology',
    status: 'Advisory',
    impactAssessment: 'Elevated tropical cyclone heat potential fueling rapid cyclogenesis.'
  },
];

// -------------------------------------------------------------------------
// 9. ORCA AI DECISION SUPPORT & ANALYTIC INSIGHTS
// -------------------------------------------------------------------------
export const ORCA_AI_INSIGHTS: OrcaAiInsight[] = [
  {
    id: 'ai-ins-1',
    title: 'Critical Squall & Wave Amplification in Malabar Trench',
    description: 'High marine risk detected in the western coastal region. Deep low pressure system is concentrating gale-force winds exceeding 34 knots with significant wave height reaching 3.8m.',
    severity: 'CRITICAL',
    confidence: 94,
    source: 'INCOIS Wave Model + IMD Cyclone Center',
    timestamp: '12 min ago',
    affectedRegion: 'Kerala & South Karnataka',
    suggestedAction: 'Immediate recall advisory for mechanized trawlers within 40 nautical miles of Kochi bight.',
    tags: ['Wave Hazard', 'Fleet Recall', 'Safety Protocol'],
  },
  {
    id: 'ai-ins-2',
    title: 'Severe Marine Heatwave Detected in Lakshadweep Sea',
    description: 'Sea surface temperature increased by 1.8°C compared with the 30-year climatological baseline, surpassing the 90th percentile threshold for 14 consecutive days.',
    severity: 'HIGH RISK',
    confidence: 91,
    source: 'ISRO Oceansat-3 SST + NOAA Coral Reef Watch',
    timestamp: '28 min ago',
    affectedRegion: 'Lakshadweep & Kavarrati',
    suggestedAction: 'Deploy CTD autonomous gliders to evaluate subsurface thermal thermocline depression.',
    tags: ['Marine Heatwave', 'Coral Bleaching', 'Thermal Anomaly'],
  },
  {
    id: 'ai-ins-3',
    title: 'Prime Potential Fishing Zone Identified in Konkan Shelf',
    description: 'Potential fishing activity is concentrated in 3 major zones. Synergistic thermal front (28.8°C) combined with high chlorophyll-a (2.15 mg/m³) indicates dense pelagic aggregation.',
    severity: 'PFZ OPPORTUNITY',
    confidence: 89,
    source: 'INCOIS PFZ Multichannel Advisory',
    timestamp: '45 min ago',
    affectedRegion: 'Konkan (Ratnagiri Offshore)',
    suggestedAction: 'Broadcast coordinate grid (16.98°N, 72.48°E) via NAVTEX & mKRISHI to registered cooperative vessels.',
    tags: ['PFZ', 'Economic Yield', 'Sardine & Mackerel'],
  },
  {
    id: 'ai-ins-4',
    title: 'Wind-Wave Non-Linear Coupling Anomaly',
    description: 'Strong wind conditions correlate with increased wave height. Observed wave steepness index is 18% higher than standard JONSWAP spectrum due to opposing coastal boundary current.',
    severity: 'ADVISORY',
    confidence: 86,
    source: 'NIOT Moored Buoy Network + HF Radar',
    timestamp: '1 hour ago',
    affectedRegion: 'North Konkan (Mumbai High Sector)',
    suggestedAction: 'Adjust offshore supply vessel transit corridors to avoid breaking beam seas.',
    tags: ['Ocean Dynamics', 'Spectral Analysis', 'Navigation Safety'],
  },
];

// -------------------------------------------------------------------------
// 10. DATA SOURCE HEALTH & TELEMETRY STREAM STATUS
// -------------------------------------------------------------------------
export const DATA_SOURCES: DataSourceStatus[] = [
  {
    id: 'ds-incois',
    name: 'INCOIS Ocean Information Gateway',
    provider: 'Indian National Centre for Ocean Information Services (MoES)',
    status: 'ONLINE',
    lastUpdated: '2 min ago',
    freshness: '99.4% Nominal',
    availability: '99.98%',
    latencyMs: 38,
    streamType: 'PFZ Advisories, Wave Forecast, OSF',
    coverage: 'Pan-Indian EEZ',
  },
  {
    id: 'ds-imd',
    name: 'IMD Coastal & Doppler Radar Network',
    provider: 'India Meteorological Department (MoES)',
    status: 'ONLINE',
    lastUpdated: '4 min ago',
    freshness: '98.8% Nominal',
    availability: '99.95%',
    latencyMs: 54,
    streamType: 'Cyclone Bulletins, Coastal Squall Alerts',
    coverage: 'Coastal India & Island Territories',
  },
  {
    id: 'ds-isro',
    name: 'ISRO Earth Observation / Oceansat-3',
    provider: 'Indian Space Research Organisation / NRSC',
    status: 'ONLINE',
    lastUpdated: '12 min ago',
    freshness: '97.6% Nominal',
    availability: '99.80%',
    latencyMs: 110,
    streamType: 'Ocean Colour Monitor (OCM-3), Sea Surface Temp',
    coverage: 'Indian Ocean Basin (L2/L3 Products)',
  },
  {
    id: 'ds-niot',
    name: 'NIOT Deep Sea Moored Buoy Network',
    provider: 'National Institute of Ocean Technology (MoES)',
    status: 'ONLINE',
    lastUpdated: '6 min ago',
    freshness: '99.1% Nominal',
    availability: '99.70%',
    latencyMs: 44,
    streamType: 'Met-Ocean Surface Buoys (AD/BD Series)',
    coverage: 'Arabian Sea & Bay of Bengal',
  },
  {
    id: 'ds-copernicus',
    name: 'Copernicus / Sentinel Marine Satellite',
    provider: 'ESA / EUMETSAT Marine Service',
    status: 'ONLINE',
    lastUpdated: '18 min ago',
    freshness: '96.5% Nominal',
    availability: '99.65%',
    latencyMs: 185,
    streamType: 'Altimetry Wave Height, SAR Surface Wind',
    coverage: 'Global Oceans & Arabian Sea',
  },
  {
    id: 'ds-hf-radar',
    name: 'Coastal High-Frequency (HF) Radar Array',
    provider: 'NIOT / MoES Coastal Observation Array',
    status: 'DELAYED',
    lastUpdated: '42 min ago',
    freshness: '84.2% Telemetry Lag',
    availability: '94.20%',
    latencyMs: 420,
    streamType: 'Surface Currents & Vector Velocity',
    coverage: 'Southwest Coast Stations',
  },
];

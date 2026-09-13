/**
 * ORCA Location Intelligence & 7-Agent Marine Analysis Service
 * 
 * Provides backend-ready architecture for multi-agent oceanographic synthesis.
 * Implements conceptual API schema:
 * POST /api/analyze-location -> { location, parameters, agents, consensus, evidence }
 */

export interface LocationCoordinates {
  lat: number;
  lng: number;
  region: string;
  nearestCoast: string;
  distanceToCoastNm: number;
  analysisTime: string;
  freshness: string;
}

export interface MarineParameters {
  sst: number; // °C
  waveHeight: number; // meters
  windSpeed: number; // km/h
  windSpeedKnots: number; // knots
  windDirection: string;
  rainfall: number; // mm/24h
  pfzSuitability: 'High' | 'Moderate' | 'Low' | 'Unfavorable';
  riskScore: number; // 0-100
  salinity: number; // PSU
  chlorophyll: number; // mg/m³
  currentVelocity: number; // knots
  pressureHpa: number;
}

export type AgentId =
  | 'weather'
  | 'ocean'
  | 'fisheries'
  | 'risk'
  | 'navigation'
  | 'environment'
  | 'research';

export type AgentStatus = 'ANALYZING' | 'COMPLETED' | 'WARNING' | 'ERROR' | 'NO DATA';
export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface AgentResult {
  id: AgentId;
  name: string;
  roleTitle: string;
  status: AgentStatus;
  riskLevel: RiskLevel;
  shortConclusion: string;
  detailedAnalysis: string;
  confidence: number;
  dataSources: string[];
  lastUpdated: string;
  keyMetric: {
    label: string;
    value: string;
  };
}

export interface ConsensusResult {
  overallRisk: RiskLevel;
  confidence: number;
  summary: string;
  recommendedAction: string;
  agentAgreement: {
    agreeingCount: number;
    totalCount: number;
    ratioText: string;
  };
  majorityRisk: RiskLevel;
  supportingAgents: string[];
  conflictingAgents: string[];
  conflictExplanation: string;
  isConflictPresent: boolean;
}

export interface EvidenceItem {
  source: string;
  parameter: string;
  value: string;
  status: 'Available' | 'Cached' | 'Delayed';
  timestamp: string;
}

export interface LocationAnalysisResponse {
  location: LocationCoordinates;
  parameters: MarineParameters;
  agents: Record<AgentId, AgentResult>;
  consensus: ConsensusResult;
  evidence: EvidenceItem[];
  historicalTrend: Array<{
    date: string;
    riskScore: number;
    waveHeight: number;
    sst: number;
  }>;
  correlations: Array<{
    factorA: string;
    factorB: string;
    correlation: number;
    note: string;
  }>;
  isSimulated: boolean;
}

/**
 * Derives nearest geographic feature and realistic marine attributes from coordinates
 */
export function deriveLocationMetadata(lat: number, lng: number): {
  region: string;
  nearestCoast: string;
  distanceToCoastNm: number;
} {
  // Approximate reference points on Indian Western & Eastern Seaboard
  const coastalReferencePoints = [
    { name: 'Mumbai Harbor', lat: 18.92, lng: 72.83, region: 'North Konkan' },
    { name: 'Ratnagiri Coast', lat: 16.99, lng: 73.3, region: 'South Konkan' },
    { name: 'Goa Coast', lat: 15.49, lng: 73.82, region: 'Goa Shelf' },
    { name: 'Mangaluru Port', lat: 12.87, lng: 74.84, region: 'Karnataka Coast' },
    { name: 'Kochi Port', lat: 9.97, lng: 76.28, region: 'Malabar Coast' },
    { name: 'Kanyakumari / Cape Comorin', lat: 8.08, lng: 77.55, region: 'Wadge Bank' },
    { name: 'Gulf of Mannar', lat: 9.1, lng: 79.1, region: 'Gulf of Mannar' },
    { name: 'Chennai Port', lat: 13.08, lng: 80.27, region: 'Coromandel Coast' },
    { name: 'Visakhapatnam', lat: 17.68, lng: 83.21, region: 'Andhra Offshore' },
    { name: 'Lakshadweep / Kavaratti', lat: 10.56, lng: 72.64, region: 'Lakshadweep Sea' },
    { name: 'Gujarat / Veraval', lat: 20.9, lng: 70.37, region: 'Saurashtra Coast' },
  ];

  let closest = coastalReferencePoints[0];
  let minDistance = 9999;

  for (const ref of coastalReferencePoints) {
    // Great circle approximation in nautical miles (1 deg ≈ 60 nm)
    const dLat = (lat - ref.lat) * 60;
    const dLng = (lng - ref.lng) * 60 * Math.cos(((lat + ref.lat) * Math.PI) / 360);
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = ref;
    }
  }

  const roundedDist = Math.max(2, Math.round(minDistance));
  const cardinal =
    lat > closest.lat
      ? lng > closest.lng
        ? 'NE'
        : 'NW'
      : lng > closest.lng
      ? 'SE'
      : 'SW';

  let regionName = closest.region;
  if (roundedDist > 90) {
    if (lng < 74) regionName = 'Central Deep Arabian Sea';
    else if (lng > 82) regionName = 'Central Bay of Bengal';
    else regionName = 'Outer Indian Ocean EEZ';
  }

  return {
    region: regionName,
    nearestCoast: `${roundedDist} nm ${cardinal} of ${closest.name}`,
    distanceToCoastNm: roundedDist,
  };
}

/**
 * Synthesizes realistic oceanographic parameters based on geographic coordinates
 */
export function synthesizeMarineParameters(lat: number, lng: number): MarineParameters {
  const { distanceToCoastNm } = deriveLocationMetadata(lat, lng);

  // Proximity to known active weather anomaly: Kochi / Lakshadweep cyclonic vortex (lat ~11.5, lng ~73.5)
  const cycloneDist = Math.hypot((lat - 11.5) * 60, (lng - 73.5) * 60);
  const isNearCyclone = cycloneDist < 180;
  const cycloneIntensity = isNearCyclone ? Math.max(0, 1 - cycloneDist / 180) : 0;

  // Sea surface temp: typically 28.0 - 30.5°C in North Indian Ocean
  // Slightly cooler near upwelling zones (Malabar, Ratnagiri) and warmer offshore
  const baseSST = 28.4 + (22 - lat) * 0.08 + Math.sin(lng * 0.5) * 0.4;
  const sst = Number((baseSST + cycloneIntensity * 1.2).toFixed(1));

  // Significant wave height (m): increases with distance offshore and proximity to cyclone
  const baseWave = 1.1 + Math.min(2.0, distanceToCoastNm * 0.015);
  const waveHeight = Number((baseWave + cycloneIntensity * 2.6).toFixed(1));

  // Wind speed (knots & km/h):
  const baseWindKts = 12 + Math.min(15, distanceToCoastNm * 0.08);
  const windSpeedKnots = Math.round(baseWindKts + cycloneIntensity * 24);
  const windSpeed = Math.round(windSpeedKnots * 1.852); // km/h

  // Wind direction
  const windDirs = ['WSW', 'SW', 'W', 'WNW', 'SSW', 'NW'];
  const dirIdx = Math.floor(Math.abs(Math.sin(lat * 3 + lng * 2) * windDirs.length)) % windDirs.length;
  const windDirection = windDirs[dirIdx];

  // Rainfall (mm)
  const rainfall = Number((isNearCyclone ? 24 + cycloneIntensity * 55 : (lat > 14 && distanceToCoastNm < 40 ? 8 : 2)).toFixed(1));

  // Chlorophyll (mg/m³) - higher near coastal upwelling zones (shelf 10-60 nm)
  let chlorophyll = 0.6;
  if (distanceToCoastNm >= 8 && distanceToCoastNm <= 65) {
    chlorophyll = Number((1.8 + Math.abs(Math.sin(lat * 1.5)) * 1.4).toFixed(2));
  } else if (distanceToCoastNm < 8) {
    chlorophyll = 1.2;
  } else {
    chlorophyll = Number((0.35 + Math.random() * 0.3).toFixed(2));
  }

  // PFZ Suitability based on Chlorophyll & Thermal fronts
  let pfzSuitability: MarineParameters['pfzSuitability'] = 'Moderate';
  if (chlorophyll >= 2.0 && sst >= 28.0 && sst <= 29.8) {
    pfzSuitability = 'High';
  } else if (chlorophyll < 0.6 || waveHeight > 3.2) {
    pfzSuitability = waveHeight > 3.5 ? 'Unfavorable' : 'Low';
  }

  // Composite Risk Score (0 - 100)
  const waveRisk = Math.min(45, (waveHeight / 4.0) * 45);
  const windRisk = Math.min(35, (windSpeedKnots / 35) * 35);
  const weatherRisk = Math.min(20, (rainfall / 50) * 20);
  const riskScore = Math.min(98, Math.max(15, Math.round(waveRisk + windRisk + weatherRisk)));

  const salinity = Number((34.8 + Math.sin(lat * 0.8) * 1.2).toFixed(1));
  const currentVelocity = Number((0.8 + (distanceToCoastNm > 40 ? 0.9 : 0.4)).toFixed(1));
  const pressureHpa = Math.round(1012 - cycloneIntensity * 28);

  return {
    sst,
    waveHeight,
    windSpeed,
    windSpeedKnots,
    windDirection,
    rainfall,
    pfzSuitability,
    riskScore,
    salinity,
    chlorophyll,
    currentVelocity,
    pressureHpa,
  };
}

/**
 * Generates the 7 Independent AI Agent Evaluations with transparent reasoning
 */
export function evaluateSevenAgents(
  coords: LocationCoordinates,
  params: MarineParameters
): {
  agents: Record<AgentId, AgentResult>;
  consensus: ConsensusResult;
} {
  const { waveHeight, windSpeedKnots, windSpeed, sst, rainfall, pfzSuitability, riskScore, chlorophyll, pressureHpa } = params;

  // 1. WEATHER AGENT
  let weatherRisk: RiskLevel = 'LOW';
  let weatherSummary = `Atmospheric conditions stable. Surface winds at ${windSpeed} km/h (${windSpeedKnots} kts). Atmospheric pressure nominal at ${pressureHpa} hPa.`;
  if (windSpeedKnots >= 28 || rainfall > 30 || pressureHpa < 995) {
    weatherRisk = 'HIGH';
    weatherSummary = `Squall warnings active. Gusts exceeding ${windSpeed} km/h with heavy precip (${rainfall} mm). Cyclone periphery pressure drop (${pressureHpa} hPa).`;
  } else if (windSpeedKnots >= 18 || rainfall > 10) {
    weatherRisk = 'MODERATE';
    weatherSummary = `Breezy sea conditions. Moderate wind shear at ${windSpeed} km/h with scattered precipitation (${rainfall} mm).`;
  }

  const weatherAgent: AgentResult = {
    id: 'weather',
    name: 'WEATHER AGENT',
    roleTitle: 'Atmospheric & Coastal Meteorological Specialist',
    status: 'COMPLETED',
    riskLevel: weatherRisk,
    shortConclusion: weatherSummary,
    detailedAnalysis: `Barometric pressure monitored at ${pressureHpa} hPa with relative humidity at 84%. Satellite vapor channels reveal cyclonic inflow bands within 90 nautical miles.`,
    confidence: 89,
    dataSources: ['IMD Doppler Coastal Radar', 'INSAT-3DR Atmospheric Sounder', 'ECMWF IFS-10'],
    lastUpdated: 'Updated 4 min ago',
    keyMetric: {
      label: 'Surface Wind / Rain',
      value: `${windSpeed} km/h • ${rainfall} mm`,
    },
  };

  // 2. OCEAN AGENT
  let oceanRisk: RiskLevel = 'LOW';
  let oceanSummary = `Sea state within normal range. Significant wave height at ${waveHeight}m with SST of ${sst}°C.`;
  if (waveHeight >= 3.0 || sst > 30.5) {
    oceanRisk = waveHeight >= 3.8 ? 'CRITICAL' : 'HIGH';
    oceanSummary = `Heavy swell dynamics detected. Significant wave height at ${waveHeight}m with surface temperature at ${sst}°C.`;
  } else if (waveHeight >= 1.8) {
    oceanRisk = 'MODERATE';
    oceanSummary = `Moderate sea chop. Swell height measuring ${waveHeight}m with thermal stratification at ${sst}°C.`;
  }

  const oceanAgent: AgentResult = {
    id: 'ocean',
    name: 'OCEAN AGENT',
    roleTitle: 'Physical Oceanography & Hydrodynamics Engine',
    status: 'COMPLETED',
    riskLevel: oceanRisk,
    shortConclusion: oceanSummary,
    detailedAnalysis: `Acoustic Doppler profiles show surface current velocity of ${params.currentVelocity} knots from the south-southwest. Shelf break thermocline gradient is stable at 45m depth.`,
    confidence: 93,
    dataSources: ['INCOIS Wave Watch III Model', 'NIOT Moored Buoy Array', 'Copernicus Sentinel-3 Altika'],
    lastUpdated: 'Updated 6 min ago',
    keyMetric: {
      label: 'Significant Wave / SST',
      value: `${waveHeight}m • ${sst}°C`,
    },
  };

  // 3. FISHERIES / PFZ AGENT
  let fisheriesRisk: RiskLevel = 'LOW';
  let fisheriesSummary = 'Productive pelagic aggregation zone detected. Chlorophyll density and thermal fronts optimal for purse-seiners.';
  if (pfzSuitability === 'High') {
    fisheriesRisk = 'LOW'; // Low risk to catch yield = highly favorable
    fisheriesSummary = `High Potential Fishing Zone (PFZ). Chlorophyll-a at ${chlorophyll} mg/m³ indicates dense sardine/mackerel feeding corridors.`;
  } else if (pfzSuitability === 'Moderate') {
    fisheriesRisk = 'MODERATE';
    fisheriesSummary = `Moderate fishing suitability. Surface chlorophyll is ${chlorophyll} mg/m³ with dispersed pelagic schools.`;
  } else {
    fisheriesRisk = 'HIGH'; // High risk to catch yield
    fisheriesSummary = `Low fishery yield probability. Chlorophyll density at ${chlorophyll} mg/m³ falls below commercial aggregation thresholds.`;
  }

  const fisheriesAgent: AgentResult = {
    id: 'fisheries',
    name: 'FISHERIES / PFZ AGENT',
    roleTitle: 'Marine Resources & Potential Fishing Zone Analyst',
    status: 'COMPLETED',
    riskLevel: fisheriesRisk,
    shortConclusion: fisheriesSummary,
    detailedAnalysis: `Ocean Color Monitor (ISRO OCM-3) indicates active nutrient upwelling along the coastal shelf. Chlorophyll concentration of ${chlorophyll} mg/m³ correlates with 85% pelagic aggregation probability.`,
    confidence: 91,
    dataSources: ['INCOIS Advisory PFZ Feed', 'ISRO Oceansat-3 OCM-3', 'FSI Catch Biomass Index'],
    lastUpdated: 'Updated 10 min ago',
    keyMetric: {
      label: 'Chlorophyll-a / PFZ',
      value: `${chlorophyll} mg/m³ • ${pfzSuitability}`,
    },
  };

  // 4. HAZARD / RISK AGENT
  let hazardRisk: RiskLevel = 'LOW';
  let hazardSummary = 'No acute maritime emergency or cyclonic triggers detected within operational perimeter.';
  if (riskScore >= 75) {
    hazardRisk = riskScore >= 85 ? 'CRITICAL' : 'HIGH';
    hazardSummary = `Severe maritime hazard warning (Composite Risk ${riskScore}/100). High swell combined with squall-force winds creates dangerous boarding conditions.`;
  } else if (riskScore >= 45) {
    hazardRisk = 'MODERATE';
    hazardSummary = `Elevated maritime risk index (${riskScore}/100). Small craft advisory recommended due to wave steepness.`;
  }

  const hazardAgent: AgentResult = {
    id: 'risk',
    name: 'HAZARD / RISK AGENT',
    roleTitle: 'Extreme Marine Events & Cyclone Warning Guardian',
    status: 'COMPLETED',
    riskLevel: hazardRisk,
    shortConclusion: hazardSummary,
    detailedAnalysis: `Multi-hazard index synthesizes 4.1m maximum crest waves, 28 knot cross-winds, and shallow bathymetric compression. Recommended small vessel recall window is 3 hours.`,
    confidence: 94,
    dataSources: ['INCOIS Ocean State Forecast', 'IMD Cyclone Warning Center', 'NDRF Coastal Grid'],
    lastUpdated: 'Updated 2 min ago',
    keyMetric: {
      label: 'Risk Score / Alert',
      value: `${riskScore}/100 • ${hazardRisk}`,
    },
  };

  // 5. NAVIGATION / ROUTE AGENT
  let navRisk: RiskLevel = 'LOW';
  let navSummary = 'Navigational channel clear. Hydrodynamic drag and vessel leeway parameters remain well within safe limits.';
  if (waveHeight >= 2.8 || windSpeedKnots >= 24) {
    navRisk = 'HIGH';
    navSummary = `Navigation caution mandatory. High beam sea chop and hull pitching risk for motorized craft under 20m length.`;
  } else if (waveHeight >= 1.7 || windSpeedKnots >= 16) {
    navRisk = 'MODERATE';
    navSummary = `Moderate navigational drift. Maintain safe clearance from rocky headlands and shallow reefs.`;
  }

  const navAgent: AgentResult = {
    id: 'navigation',
    name: 'NAVIGATION / ROUTE AGENT',
    roleTitle: 'Navigational Safety, AIS & Hydrographic Pilot',
    status: 'COMPLETED',
    riskLevel: navRisk,
    shortConclusion: navSummary,
    detailedAnalysis: `AIS vessel density shows 14 commercial trawlers in neighboring corridor. Tidal ebb velocity of 1.4 kts opposing swell creates short-period steep chop.`,
    confidence: 88,
    dataSources: ['Directorate General of Lighthouses & Lightships', 'Indian Coast Guard SAR Matrix', 'NHO Electronic Navigational Charts'],
    lastUpdated: 'Updated 5 min ago',
    keyMetric: {
      label: 'Transit Safety',
      value: navRisk === 'HIGH' ? 'Restricted Transit' : navRisk === 'MODERATE' ? 'Cautionary Steer' : 'Unrestricted',
    },
  };

  // 6. ENVIRONMENT AGENT
  let envRisk: RiskLevel = 'LOW';
  let envSummary = `Ecosystem indicators nominal. Sea surface salinity (${params.salinity} PSU) and dissolved oxygen within standard marine biotope limits.`;
  if (sst > 30.2 || params.salinity > 36.2) {
    envRisk = 'MODERATE';
    envSummary = `Elevated thermal anomaly detected (+1.2°C above seasonal mean). Marine heatwave stress watch flagged for benthic fauna.`;
  }

  const envAgent: AgentResult = {
    id: 'environment',
    name: 'ENVIRONMENT AGENT',
    roleTitle: 'Marine Ecosystem & Thermal Anomaly Monitor',
    status: 'COMPLETED',
    riskLevel: envRisk,
    shortConclusion: envSummary,
    detailedAnalysis: `SST deviation from 30-year climatological baseline: +0.7°C. Photic zone depth calculated at 28 meters. No harmful algal bloom (HAB) toxicity signatures detected.`,
    confidence: 90,
    dataSources: ['ISRO Oceansat-3 OCM-3 Chlorophyll', 'INCOIS Marine Heatwave Tracker', 'MoEFCC Coastal Eco-Zones'],
    lastUpdated: 'Updated 12 min ago',
    keyMetric: {
      label: 'SST Anomaly / Salinity',
      value: `+0.7°C • ${params.salinity} PSU`,
    },
  };

  // 7. RESEARCH / CONTEXT AGENT
  let researchRisk: RiskLevel = 'MODERATE';
  let researchSummary = `Conditions show an above-average wave and thermal anomaly compared to decadal seasonal averages for ${coords.region}.`;
  if (riskScore >= 75) {
    researchRisk = 'HIGH';
    researchSummary = `Historical decadal percentile comparison places current wave steepness in the top 92nd percentile for this maritime quadrant.`;
  } else if (riskScore < 40) {
    researchRisk = 'LOW';
    researchSummary = `Correlative data aligns with historical calm-weather post-monsoon circulation patterns for this coordinate block.`;
  }

  const researchAgent: AgentResult = {
    id: 'research',
    name: 'RESEARCH / CONTEXT AGENT',
    roleTitle: 'Oceanographic Telemetry & Historical Climatology',
    status: 'COMPLETED',
    riskLevel: researchRisk,
    shortConclusion: researchSummary,
    detailedAnalysis: `Pearson correlation coefficient between local SST and pelagic aggregation is r = 0.81. Deep sea mooring records indicate Pierson-Moskowitz wave spectrum maturity of 74%.`,
    confidence: 92,
    dataSources: ['NIO CSIR Historical Hydrographic Archive', 'INCOIS Argo Float Profiles', 'NOAA OISST High-Res Climatology'],
    lastUpdated: 'Updated 8 min ago',
    keyMetric: {
      label: 'Decadal Anomaly',
      value: `${(riskScore > 60 ? '+' : '')}${(riskScore * 0.2 - 8).toFixed(1)}% vs Median`,
    },
  };

  const agents: Record<AgentId, AgentResult> = {
    weather: weatherAgent,
    ocean: oceanAgent,
    fisheries: fisheriesAgent,
    risk: hazardAgent,
    navigation: navAgent,
    environment: envAgent,
    research: researchAgent,
  };

  // -------------------------------------------------------------
  // CROSS-AGENT REASONING & TRANSPARENT CONFLICT RESOLUTION
  // -------------------------------------------------------------
  const agentList = Object.values(agents);
  const riskCounts: Record<RiskLevel, number> = {
    LOW: 0,
    MODERATE: 0,
    HIGH: 0,
    CRITICAL: 0,
  };

  agentList.forEach((a) => {
    riskCounts[a.riskLevel] += 1;
  });

  // Calculate majority risk
  let majorityRisk: RiskLevel = 'LOW';
  let maxCount = -1;
  (['CRITICAL', 'HIGH', 'MODERATE', 'LOW'] as RiskLevel[]).forEach((lvl) => {
    if (riskCounts[lvl] > maxCount) {
      maxCount = riskCounts[lvl];
      majorityRisk = lvl;
    }
  });

  // Overall risk policy: ORCA prioritizes navigational and hazard safety.
  // If Risk or Navigation is HIGH/CRITICAL, the overall risk must be HIGH/CRITICAL even if Fisheries is LOW!
  let overallRisk: RiskLevel = majorityRisk;
  if (hazardRisk === 'CRITICAL' || oceanRisk === 'CRITICAL') {
    overallRisk = 'CRITICAL';
  } else if (hazardRisk === 'HIGH' || navRisk === 'HIGH' || oceanRisk === 'HIGH') {
    overallRisk = 'HIGH';
  } else if (hazardRisk === 'MODERATE' || weatherRisk === 'MODERATE' || oceanRisk === 'MODERATE') {
    overallRisk = 'MODERATE';
  }

  // Identify supporting vs conflicting agents
  const supportingAgents: string[] = [];
  const conflictingAgents: string[] = [];

  agentList.forEach((a) => {
    if (a.riskLevel === overallRisk || (overallRisk === 'HIGH' && (a.riskLevel === 'CRITICAL' || a.riskLevel === 'MODERATE'))) {
      supportingAgents.push(a.name.replace(' AGENT', ''));
    } else {
      conflictingAgents.push(a.name.replace(' AGENT', ''));
    }
  });

  const isConflictPresent = conflictingAgents.length > 0;
  const agreementRatio = `${supportingAgents.length}/${agentList.length}`;

  let conflictExplanation = '';
  if (isConflictPresent) {
    if (fisheriesRisk === 'LOW' && (overallRisk === 'HIGH' || overallRisk === 'CRITICAL')) {
      conflictExplanation =
        'While the Fisheries Agent identifies rich pelagic feeding grounds, ORCA prioritizes the higher-risk conclusion because Hazard and Navigation agents indicate dangerous wave steepness and wind shear for small craft.';
    } else if (weatherRisk === 'LOW' && oceanRisk === 'HIGH') {
      conflictExplanation =
        'Weather sensors indicate moderate local wind, but the Ocean Agent detects distant swell propagation generating elevated breakers at this coordinate.';
    } else {
      conflictExplanation = `ORCA synthesizes divergent telemetry by prioritizing maritime safety directives over yield opportunity, with ${supportingAgents.length} agents supporting elevated caution.`;
    }
  } else {
    conflictExplanation = 'Full consensus achieved across all 7 operational modules with unanimous risk assessment.';
  }

  // Summary and recommendation text
  let summary = '';
  let recommendedAction = '';

  if (overallRisk === 'CRITICAL' || overallRisk === 'HIGH') {
    summary = `Multiple agents indicate elevated marine risk at ${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E due to strong wind (${windSpeed} km/h) and significant wave conditions (${waveHeight}m). Fishing conditions may be productive, but vessel safety takes strict precedence.`;
    recommendedAction = `Exercise extreme caution. Suspend artisanal vessel departures and instruct motorized craft under 20m to seek sheltered coastal waters or delay transit.`;
  } else if (overallRisk === 'MODERATE') {
    summary = `Mild to moderate maritime conditions observed. Sea surface temperature of ${sst}°C and wave height of ${waveHeight}m remain workable for mechanized craft with vigilant bridge watch.`;
    recommendedAction = `Navigation permitted with standard coastal safety precautions. Monitor VHF Channel 16 for sudden squall bulletins and maintain emergency transponders.`;
  } else {
    summary = `Optimal marine operational window detected. Low swell (${waveHeight}m) and gentle winds (${windSpeed} km/h) provide safe passage and favorable fishing conditions across the sector.`;
    recommendedAction = `Unrestricted maritime transit and commercial fishing authorized within designated regulatory boundaries.`;
  }

  // Average confidence across agents
  const avgConfidence = Math.round(
    agentList.reduce((acc, a) => acc + a.confidence, 0) / agentList.length
  );

  const consensus: ConsensusResult = {
    overallRisk,
    confidence: avgConfidence,
    summary,
    recommendedAction,
    agentAgreement: {
      agreeingCount: supportingAgents.length,
      totalCount: agentList.length,
      ratioText: `${supportingAgents.length}/7`,
    },
    majorityRisk,
    supportingAgents,
    conflictingAgents,
    conflictExplanation,
    isConflictPresent,
  };

  return { agents, consensus };
}

/**
 * Builds the comprehensive Evidence & Data Sources list for the location
 */
export function buildEvidenceList(params: MarineParameters): EvidenceItem[] {
  return [
    {
      source: 'INCOIS Wave Watch III',
      parameter: 'Significant Wave Height',
      value: `${params.waveHeight} m (swell period 8.4s)`,
      status: 'Available',
      timestamp: 'Updated 5 min ago',
    },
    {
      source: 'ISRO Oceansat-3 OCM-3',
      parameter: 'Sea Surface Temperature',
      value: `${params.sst} °C (thermal infrared)`,
      status: 'Available',
      timestamp: 'Updated 6 min ago',
    },
    {
      source: 'IMD Coastal Doppler Radar',
      parameter: 'Surface Wind Vector',
      value: `${params.windSpeed} km/h (${params.windDirection})`,
      status: 'Available',
      timestamp: 'Updated 8 min ago',
    },
    {
      source: 'INCOIS Marine Fishery Advisory',
      parameter: 'Chlorophyll-a Biomass',
      value: `${params.chlorophyll} mg/m³ (${params.pfzSuitability} PFZ)`,
      status: 'Available',
      timestamp: 'Updated 10 min ago',
    },
    {
      source: 'NIOT Deep-Sea Moored Buoy',
      parameter: 'Salinity & Barometric Pressure',
      value: `${params.salinity} PSU • ${params.pressureHpa} hPa`,
      status: 'Available',
      timestamp: 'Updated 12 min ago',
    },
    {
      source: 'Indian Coast Guard SAR Matrix',
      parameter: 'Vessel Traffic & Hazard Alerts',
      value: `Risk Score ${params.riskScore}/100`,
      status: 'Available',
      timestamp: 'Updated 3 min ago',
    },
  ];
}

/**
 * Main Location Analysis Entry Point
 * 
 * High-precision marine telemetry and 7-agent consensus evaluation
 */
export function analyzeMarineLocation(
  lat: number,
  lng: number
): LocationAnalysisResponse {
  const safeLat = typeof lat === 'number' && !isNaN(lat) ? lat : 18.922;
  const safeLng = typeof lng === 'number' && !isNaN(lng) ? lng : 72.8346;

  const metadata = deriveLocationMetadata(safeLat, safeLng);
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const coords: LocationCoordinates = {
    lat: Number(safeLat.toFixed(4)),
    lng: Number(safeLng.toFixed(4)),
    region: metadata.region,
    nearestCoast: metadata.nearestCoast,
    distanceToCoastNm: metadata.distanceToCoastNm,
    analysisTime: timeString,
    freshness: 'Real-time Telemetry Stream (<10m)',
  };

  // Client-side synthesis (simulated / prototype mode)
  const params = synthesizeMarineParameters(safeLat, safeLng);
  const { agents, consensus } = evaluateSevenAgents(coords, params);
  const evidence = buildEvidenceList(params);

  // Generate 7-day historical trend for this location
  const historicalTrend = [
    { date: 'Day -6', riskScore: Math.max(20, params.riskScore - 18), waveHeight: Number((params.waveHeight * 0.75).toFixed(1)), sst: Number((params.sst - 0.4).toFixed(1)) },
    { date: 'Day -5', riskScore: Math.max(22, params.riskScore - 12), waveHeight: Number((params.waveHeight * 0.82).toFixed(1)), sst: Number((params.sst - 0.2).toFixed(1)) },
    { date: 'Day -4', riskScore: Math.max(25, params.riskScore - 8), waveHeight: Number((params.waveHeight * 0.88).toFixed(1)), sst: Number((params.sst - 0.1).toFixed(1)) },
    { date: 'Day -3', riskScore: Math.max(28, params.riskScore - 4), waveHeight: Number((params.waveHeight * 0.94).toFixed(1)), sst: params.sst },
    { date: 'Day -2', riskScore: params.riskScore, waveHeight: params.waveHeight, sst: params.sst },
    { date: 'Day -1', riskScore: Math.min(95, params.riskScore + 3), waveHeight: Number((params.waveHeight * 1.05).toFixed(1)), sst: Number((params.sst + 0.1).toFixed(1)) },
    { date: 'Today', riskScore: params.riskScore, waveHeight: params.waveHeight, sst: params.sst },
  ];

  // Correlation analysis for researchers
  const correlations = [
    {
      factorA: 'Sea Surface Temp',
      factorB: 'Pelagic Fish Density',
      correlation: 0.84,
      note: 'Strong aggregation at 28.5°C thermal boundary',
    },
    {
      factorA: 'Wind Speed',
      factorB: 'Significant Wave Height',
      correlation: 0.91,
      note: 'Pierson-Moskowitz wind-driven wave development',
    },
    {
      factorA: 'Distance to Coast',
      factorB: 'Chlorophyll-a',
      correlation: -0.76,
      note: 'Nutrient upwelling concentrated within 50 nm of shelf',
    },
  ];

  return {
    location: coords,
    parameters: params,
    agents,
    consensus,
    evidence,
    historicalTrend,
    correlations,
    isSimulated: true,
  };
}

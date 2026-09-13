/**
 * ORCA Context-Aware Multi-Agent Mode Controller & Orchestrator
 * 
 * Architecture:
 * MAP CLICK -> LOCATION CONTEXT -> ACTIVE MODE -> MODE CONTROLLER
 * -> SELECT REQUIRED AGENTS -> RUN AGENTS -> VALIDATE DATA & FRESHNESS
 * -> CROSS-AGENT REASONING -> FINAL CONCLUSION -> MODE-SPECIFIC RESULT
 */

export type AppMode = 'fisherman' | 'marine-safety' | 'research';

export type AgentId =
  | 'safety'
  | 'pfz'
  | 'weather'
  | 'ocean'
  | 'navigation'
  | 'environment'
  | 'data_quality';

export type AgentStatus =
  | 'ACTIVE'
  | 'NOT_REQUIRED'
  | 'COMPLETED'
  | 'FAILED'
  | 'DATA_UNAVAILABLE';

export type FreshnessStatus = 'FRESH' | 'RECENT' | 'AGING' | 'OUTDATED' | 'UNKNOWN';

export type SafetySeverity = 'SAFE' | 'CAUTION' | 'WARNING' | 'DANGER';

export interface SpecializedAgentResult {
  id: AgentId;
  name: string;
  responsibility: string;
  status: AgentStatus;
  result: string;
  confidence: number; // 0.00 to 1.00
  source: string;
  updated_at: string;
  data_age: string;
  freshness_status: FreshnessStatus;
  keyMetrics?: Record<string, string | number>;
  recommendations?: string;
  errorNotice?: string;
}

export interface LocationContext {
  lat: number;
  lng: number;
  timestamp: string;
  region: string;
  nearestCoast: string;
  distanceToCoastNm: number;
}

export interface FishermanResult {
  safety: {
    level: SafetySeverity;
    headline: string;
    details: string;
    hazards: string[];
    isSafeForDeparture: boolean;
  };
  pfz: {
    status: 'PFZ AVAILABLE' | 'PFZ NEARBY' | 'NO PFZ' | 'DATA UNAVAILABLE';
    isAvailable: boolean;
    distanceKm: number;
    suitability: 'High' | 'Moderate' | 'Low' | 'Unfavorable';
    confidence: number; // e.g. 0.91
    targetSpecies: string[];
    chlorophyllMgM3: number;
  };
  freshness: {
    overallStatus: FreshnessStatus;
    hasOutdatedWarning: boolean;
    sources: Array<{
      category: string;
      sourceName: string;
      age: string;
      timestamp: string;
      status: FreshnessStatus;
    }>;
  };
  conclusion: {
    summary: string;
    confidence: 'High' | 'Moderate' | 'Low';
    confidenceScore: number;
    answers: {
      isItSafe: string;
      isTherePfz: string;
      howFreshIsData: string;
      whatShouldIDo: string;
    };
  };
}

export interface MarineSafetyResult {
  riskLevel: SafetySeverity;
  riskScore: number; // 0 - 100
  alertHeadline: string;
  weatherSummary: string;
  oceanConditions: {
    waveHeight: number;
    swellPeriod: number;
    surfaceCurrent: number;
    sst: number;
  };
  windConditions: {
    speedKmh: number;
    speedKnots: number;
    direction: string;
    gustsKmh: number;
  };
  navigationHazards: string[];
  restrictedZones: Array<{
    name: string;
    type: 'Security' | 'Shallow Reef' | 'Commercial Lane' | 'Hazard';
    distanceNm: number;
  }>;
  safetyRecommendations: string[];
  coastGuardNotice: string;
  freshnessSummary: {
    overallStatus: FreshnessStatus;
    lastRadarPing: string;
    lastBuoyTelemetry: string;
  };
  conclusion: {
    text: string;
    confidence: number;
  };
}

export interface ResearchResult {
  allAgents: Record<AgentId, SpecializedAgentResult>;
  oceanParameters: {
    sst: number;
    salinity: number;
    chlorophyll: number;
    currentVelocity: number;
    waveHeight: number;
    pressureHpa: number;
  };
  decadalAnomaly: {
    wavePercentile: number;
    sstDeviation: string;
    climatologyMatch: string;
  };
  consensusBreakdown: {
    agreementRatio: string;
    supportingAgentNames: string[];
    conflictingAgentNames: string[];
    conflictReasoning: string;
  };
  evidenceTrail: Array<{
    source: string;
    sensor: string;
    parameter: string;
    value: string;
    latency: string;
    freshness: FreshnessStatus;
  }>;
  conclusion: {
    text: string;
    scientificSummary: string;
    aggregateConfidence: number;
  };
}

export interface ModeOrchestratorResult {
  location: LocationContext;
  activeMode: AppMode;
  modeLabel: string;
  requiredAgentIds: AgentId[];
  executedAgentIds: AgentId[];
  skippedAgentIds: AgentId[];
  agentResults: Record<AgentId, SpecializedAgentResult>;
  overallConfidence: number;
  confidenceRating: 'High' | 'Moderate' | 'Low';
  hasAgentFailure: boolean;
  failureNotices: string[];
  
  // Mode-specific payload
  fisherman?: FishermanResult;
  marineSafety?: MarineSafetyResult;
  research?: ResearchResult;

  // Unified high-level conclusion
  actionableConclusion: string;
  timestamp: string;
}

export interface OrchestrationOptions {
  simulatePfzUnavailable?: boolean;
  simulateOutdatedWeather?: boolean;
}

// -----------------------------------------------------------------------------
// HELPER: Indian Coastal Spatial Context
// -----------------------------------------------------------------------------
export function deriveSpatialContext(lat: number, lng: number): LocationContext {
  const safeLat = typeof lat === 'number' && !isNaN(lat) ? lat : 18.922;
  const safeLng = typeof lng === 'number' && !isNaN(lng) ? lng : 72.8346;

  let region = 'Central West Coast (Maharashtra & Goa)';
  let nearestCoast = 'Mumbai Offshore Basin';
  let distanceToCoastNm = 12;

  if (safeLat >= 20.0 && safeLng <= 72.5) {
    region = 'North-West Coast (Gujarat & Gulf of Khambhat)';
    nearestCoast = 'Veraval / Diu Coastal Quadrant';
    distanceToCoastNm = Math.round(Math.abs(safeLng - 70.0) * 35 + 8);
  } else if (safeLat >= 17.5 && safeLat < 20.0 && safeLng <= 73.5) {
    region = 'Central West Coast (Konkan & Mumbai)';
    nearestCoast = 'Ratnagiri / Mumbai High Sector';
    distanceToCoastNm = Math.round(Math.abs(safeLng - 72.8) * 45 + 10);
  } else if (safeLat >= 12.0 && safeLat < 17.5 && safeLng <= 75.0) {
    region = 'South-West Coast (Goa, Malabar & Mangalore)';
    nearestCoast = 'Karwar / Panaji Coast';
    distanceToCoastNm = Math.round(Math.abs(safeLng - 74.0) * 40 + 6);
  } else if (safeLat < 12.0 && safeLng <= 78.0) {
    region = 'Southern Tip & Lakshadweep Sea (Kerala & Kanyakumari)';
    nearestCoast = 'Kochi / Vizhinjam Deep Sea Sector';
    distanceToCoastNm = Math.round(Math.abs(safeLat - 9.0) * 30 + 14);
  } else if (safeLng > 78.0 && safeLat < 16.0) {
    region = 'South-East Coast (Coromandel & Gulf of Mannar)';
    nearestCoast = 'Chennai / Tuticorin Corridor';
    distanceToCoastNm = Math.round(Math.abs(safeLng - 80.5) * 42 + 9);
  } else if (safeLng > 78.0 && safeLat >= 16.0) {
    region = 'North-East Coast (Andhra & Odisha Bay Sector)';
    nearestCoast = 'Visakhapatnam / Paradip Basin';
    distanceToCoastNm = Math.round(Math.abs(safeLng - 83.5) * 38 + 15);
  }

  const now = new Date();
  const timestamp = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return {
    lat: Number(safeLat.toFixed(4)),
    lng: Number(safeLng.toFixed(4)),
    timestamp,
    region,
    nearestCoast,
    distanceToCoastNm: Math.max(2, distanceToCoastNm),
  };
}

// -----------------------------------------------------------------------------
// HELPER: Mode Controller Agent Requirements
// -----------------------------------------------------------------------------
export const MODE_CONFIG: Record<
  AppMode,
  {
    label: string;
    description: string;
    requiredAgents: AgentId[];
  }
> = {
  fisherman: {
    label: 'Fisherman Mode',
    description: 'Ultra-fast, practical safety, PFZ fishing zones, and data freshness',
    requiredAgents: ['safety', 'pfz', 'weather', 'ocean', 'data_quality'],
  },
  'marine-safety': {
    label: 'Marine Safety Mode',
    description: 'Maritime hazards, extreme weather, navigation risks, and coastal alerts',
    requiredAgents: ['safety', 'weather', 'ocean', 'navigation', 'data_quality'],
  },
  research: {
    label: 'Research / Analysis Mode',
    description: 'Comprehensive 7-agent scientific analysis, raw telemetry, and evidence trail',
    requiredAgents: [
      'safety',
      'pfz',
      'weather',
      'ocean',
      'navigation',
      'environment',
      'data_quality',
    ],
  },
};

// -----------------------------------------------------------------------------
// AGENT EXECUTION ENGINE
// -----------------------------------------------------------------------------
export class ModeAgentOrchestrator {
  /**
   * Determine required agents for the active mode
   */
  static getRequiredAgents(mode: AppMode): AgentId[] {
    return MODE_CONFIG[mode]?.requiredAgents || MODE_CONFIG.fisherman.requiredAgents;
  }

  /**
   * Run the 7 specialized agents based on active mode requirements
   */
  static orchestrate(
    lat: number,
    lng: number,
    mode: AppMode = 'fisherman',
    options: OrchestrationOptions = {}
  ): ModeOrchestratorResult {
    const context = deriveSpatialContext(lat, lng);
    const requiredAgents = this.getRequiredAgents(mode);
    const allAgentIds: AgentId[] = [
      'safety',
      'pfz',
      'weather',
      'ocean',
      'navigation',
      'environment',
      'data_quality',
    ];

    // Synthesize physical parameters deterministically from coordinates
    const latSeed = Math.abs(context.lat);
    const lngSeed = Math.abs(context.lng);

    const waveHeight = Number(
      (1.1 + Math.sin(latSeed * 1.7) * 0.9 + Math.cos(lngSeed * 1.3) * 0.7).toFixed(1)
    );
    const windSpeed = Math.round(
      18 + Math.sin(latSeed * 2.1) * 14 + Math.cos(lngSeed * 1.9) * 12
    );
    const windSpeedKnots = Math.round(windSpeed * 0.539957);
    const sst = Number((27.8 + Math.sin(latSeed * 0.9) * 2.2).toFixed(1));
    const chlorophyll = Number((0.65 + Math.sin(lngSeed * 2.3) * 0.45).toFixed(2));
    const salinity = Number((34.5 + Math.sin(latSeed) * 1.4).toFixed(1));
    const pressureHpa = Math.round(1008 - Math.max(0, (windSpeed - 24) * 0.4));
    const currentVelocity = Number((0.9 + Math.abs(Math.sin(latSeed * 1.2)) * 1.4).toFixed(1));

    // Calculate nearest PFZ distance (km)
    // Distance varies between 2.1 km to 28.5 km
    const pfzDistOffset = Math.abs(Math.sin(latSeed * 3.7 + lngSeed * 2.1));
    const pfzDistanceKm = Number((2.4 + pfzDistOffset * 16.8).toFixed(1));
    const isInsidePfz = pfzDistanceKm <= 6.5;
    const isNearbyPfz = pfzDistanceKm <= 18.0;

    // Safety Severity Determination
    let safetyLevel: SafetySeverity = 'SAFE';
    if (waveHeight >= 3.0 || windSpeed >= 48 || pressureHpa < 996) {
      safetyLevel = 'DANGER';
    } else if (waveHeight >= 2.2 || windSpeed >= 36) {
      safetyLevel = 'WARNING';
    } else if (waveHeight >= 1.5 || windSpeed >= 24) {
      safetyLevel = 'CAUTION';
    } else {
      safetyLevel = 'SAFE';
    }

    // Determine agent freshness
    const weatherAgeMin = options.simulateOutdatedWeather ? 430 : 18; // 18m or ~7h
    const weatherFreshness: FreshnessStatus = options.simulateOutdatedWeather
      ? 'OUTDATED'
      : 'FRESH';
    const weatherAgeText = options.simulateOutdatedWeather
      ? 'Updated 7 hrs ago'
      : 'Updated 18 min ago';

    const oceanAgeMin = 42;
    let oceanFreshness: FreshnessStatus = 'RECENT';
    const oceanAgeText = 'Updated 42 min ago';

    const pfzAgeMin = 120; // 2 hours
    let pfzFreshness: FreshnessStatus = 'AGING';
    const pfzAgeText = 'Updated 2 hrs ago';

    const navAgeText = 'Updated 6 min ago';
    const envAgeText = 'Updated 3.5 hrs ago';
    const sensorAgeText = 'Updated 2 min ago';

    // -------------------------------------------------------------
    // 7 SPECIALIZED AGENTS IMPLEMENTATION
    // -------------------------------------------------------------
    const agentResults: Record<AgentId, SpecializedAgentResult> = {} as any;
    const failureNotices: string[] = [];
    let hasAgentFailure = false;

    // 1. SAFETY AGENT
    if (requiredAgents.includes('safety')) {
      let safetySummary = '';
      if (safetyLevel === 'DANGER') {
        safetySummary = `Critical marine conditions. Dangerous wave height (${waveHeight}m) and high wind gusts (${windSpeed} km/h). Severe squall alert in effect.`;
      } else if (safetyLevel === 'WARNING') {
        safetySummary = `Rough sea alert. Strong winds (${windSpeed} km/h) and elevated swells (${waveHeight}m). Small artisanal boats advised not to venture out.`;
      } else if (safetyLevel === 'CAUTION') {
        safetySummary = `Moderate sea conditions. Wind speed is ${windSpeed} km/h with chop up to ${waveHeight}m. Caution advised for small vessels.`;
      } else {
        safetySummary = `Calm and safe sea conditions. Swell at ${waveHeight}m with light breezes (${windSpeed} km/h). Safe for all marine activities.`;
      }

      agentResults.safety = {
        id: 'safety',
        name: 'Safety & Hazard Alert Agent',
        responsibility: 'Evaluates marine hazards, squall warnings, high waves, and vessel departure safety',
        status: 'COMPLETED',
        result: safetySummary,
        confidence: 0.94,
        source: 'INCOIS Ocean State Forecast & IMD Marine Weather Division',
        updated_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
        data_age: 'Updated 4 min ago',
        freshness_status: 'FRESH',
        keyMetrics: {
          'Safety Status': safetyLevel,
          'Composite Risk': safetyLevel === 'DANGER' ? '86/100' : safetyLevel === 'WARNING' ? '68/100' : safetyLevel === 'CAUTION' ? '44/100' : '18/100',
        },
        recommendations:
          safetyLevel === 'DANGER'
            ? 'SUSPEND all small-boat departures. Seek immediate harbor shelter.'
            : safetyLevel === 'WARNING'
            ? 'Artisanal craft stay ashore. Mechanized boats exercise elevated caution.'
            : safetyLevel === 'CAUTION'
            ? 'Proceed with standard caution. Maintain active VHF radio watch.'
            : 'Unrestricted marine operations authorized.',
      };
    } else {
      agentResults.safety = {
        id: 'safety',
        name: 'Safety & Hazard Alert Agent',
        responsibility: 'Evaluates marine hazards and vessel safety',
        status: 'NOT_REQUIRED',
        result: 'Not evaluated for current mode',
        confidence: 0,
        source: 'Standby',
        updated_at: '',
        data_age: 'N/A',
        freshness_status: 'UNKNOWN',
      };
    }

    // 2. PFZ AGENT (Potential Fishing Zone)
    if (requiredAgents.includes('pfz')) {
      if (options.simulatePfzUnavailable) {
        hasAgentFailure = true;
        failureNotices.push('PFZ satellite feed is temporarily unavailable from ground telemetry.');
        agentResults.pfz = {
          id: 'pfz',
          name: 'PFZ / Fisheries Agent',
          responsibility: 'Detects Potential Fishing Zones, chlorophyll fronts, and species aggregation',
          status: 'DATA_UNAVAILABLE',
          result: 'PFZ data temporarily unavailable due to satellite ground station latency.',
          confidence: 0.35,
          source: 'ISRO Oceansat-3 OCM-3 (Offline)',
          updated_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
          data_age: 'Data unavailable (>6 hrs)',
          freshness_status: 'OUTDATED',
          errorNotice: 'Satellite telemetry down. Catch zones cannot be calculated.',
        };
      } else {
        const pfzSuitability =
          chlorophyll >= 0.8 ? 'High' : chlorophyll >= 0.5 ? 'Moderate' : 'Low';
        let pfzSummary = '';

        if (isInsidePfz) {
          pfzSummary = `Direct PFZ corridor detected at this location (${pfzDistanceKm} km). Chlorophyll-a at ${chlorophyll} mg/m³ indicates active pelagic feeding grounds.`;
        } else if (isNearbyPfz) {
          pfzSummary = `Potential fishing zone detected approximately ${pfzDistanceKm} km from the selected location. Suitability: ${pfzSuitability}.`;
        } else {
          pfzSummary = `No active PFZ at immediate coordinates. Nearest productive thermal front is located ${pfzDistanceKm} km away.`;
        }

        agentResults.pfz = {
          id: 'pfz',
          name: 'PFZ / Fisheries Agent',
          responsibility: 'Detects Potential Fishing Zones, chlorophyll fronts, and species aggregation',
          status: 'COMPLETED',
          result: pfzSummary,
          confidence: 0.91,
          source: 'INCOIS PFZ Advisory & ISRO Oceansat-3 OCM-3 Feed',
          updated_at: new Date(Date.now() - 1000 * 60 * pfzAgeMin).toISOString(),
          data_age: pfzAgeText,
          freshness_status: pfzFreshness,
          keyMetrics: {
            'PFZ Distance': `${pfzDistanceKm} km`,
            'Suitability': pfzSuitability,
            'Chlorophyll-a': `${chlorophyll} mg/m³`,
          },
          recommendations: isNearbyPfz
            ? `Navigate toward coordinates ${(context.lat + 0.03).toFixed(4)}°N, ${(context.lng + 0.04).toFixed(4)}°E for optimal surface aggregation.`
            : 'Dispersed fishing zone. Better yields expected further offshore.',
        };
      }
    } else {
      agentResults.pfz = {
        id: 'pfz',
        name: 'PFZ / Fisheries Agent',
        responsibility: 'Detects Potential Fishing Zones',
        status: 'NOT_REQUIRED',
        result: 'Not evaluated for current mode',
        confidence: 0,
        source: 'Standby',
        updated_at: '',
        data_age: 'N/A',
        freshness_status: 'UNKNOWN',
      };
    }

    // 3. WEATHER AGENT
    if (requiredAgents.includes('weather')) {
      const weatherSummary = `Surface winds blowing at ${windSpeed} km/h (${windSpeedKnots} kts). Atmospheric pressure at ${pressureHpa} hPa with no cyclone rotation.`;

      agentResults.weather = {
        id: 'weather',
        name: 'Meteorological & Wind Agent',
        responsibility: 'Monitors wind speed, squall gusts, rainfall, and barometric trends',
        status: 'COMPLETED',
        result: weatherSummary,
        confidence: options.simulateOutdatedWeather ? 0.62 : 0.93,
        source: 'IMD Coastal Doppler Radar & ECMWF IFS-10 Stream',
        updated_at: new Date(Date.now() - 1000 * 60 * weatherAgeMin).toISOString(),
        data_age: weatherAgeText,
        freshness_status: weatherFreshness,
        keyMetrics: {
          'Wind Velocity': `${windSpeed} km/h (${windSpeedKnots} kts)`,
          'Pressure': `${pressureHpa} hPa`,
        },
      };
    } else {
      agentResults.weather = {
        id: 'weather',
        name: 'Meteorological & Wind Agent',
        responsibility: 'Monitors wind and atmospheric conditions',
        status: 'NOT_REQUIRED',
        result: 'Not evaluated for current mode',
        confidence: 0,
        source: 'Standby',
        updated_at: '',
        data_age: 'N/A',
        freshness_status: 'UNKNOWN',
      };
    }

    // 4. OCEAN AGENT
    if (requiredAgents.includes('ocean')) {
      const oceanSummary = `Significant wave height observed at ${waveHeight}m with SST of ${sst}°C. Surface drift current velocity is ${currentVelocity} knots.`;

      agentResults.ocean = {
        id: 'ocean',
        name: 'Ocean Hydrodynamics Agent',
        responsibility: 'Analyzes significant wave height, swell periods, surface currents, and sea temperature',
        status: 'COMPLETED',
        result: oceanSummary,
        confidence: 0.92,
        source: 'INCOIS Wave Watch III Model & NIOT Moored Buoy Array',
        updated_at: new Date(Date.now() - 1000 * 60 * oceanAgeMin).toISOString(),
        data_age: oceanAgeText,
        freshness_status: oceanFreshness,
        keyMetrics: {
          'Wave Height': `${waveHeight} m`,
          'Sea Surface Temp': `${sst} °C`,
          'Current Velocity': `${currentVelocity} kts`,
        },
      };
    } else {
      agentResults.ocean = {
        id: 'ocean',
        name: 'Ocean Hydrodynamics Agent',
        responsibility: 'Analyzes waves and currents',
        status: 'NOT_REQUIRED',
        result: 'Not evaluated for current mode',
        confidence: 0,
        source: 'Standby',
        updated_at: '',
        data_age: 'N/A',
        freshness_status: 'UNKNOWN',
      };
    }

    // 5. NAVIGATION AGENT
    if (requiredAgents.includes('navigation')) {
      const isNavCaution = waveHeight >= 2.0 || windSpeed >= 32;
      const navSummary = isNavCaution
        ? `Navigational clearance restricted. Beam sea chop creates pitch risk for motorized vessels under 20m.`
        : `Clear navigation fairway. Nominal channel clearance and minimal hydrodynamic drift.`;

      agentResults.navigation = {
        id: 'navigation',
        name: 'Navigation & Hydrographic Pilot Agent',
        responsibility: 'Monitors AIS vessel traffic, bathymetry, fairway hazards, and channel safety',
        status: 'COMPLETED',
        result: navSummary,
        confidence: 0.89,
        source: 'Directorate General of Lighthouses & AIS Receiver Matrix',
        updated_at: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
        data_age: navAgeText,
        freshness_status: 'FRESH',
        keyMetrics: {
          'Traffic Density': '12 vessels / 5nm',
          'Channel Safety': isNavCaution ? 'Restricted' : 'Safe Passage',
        },
      };
    } else {
      agentResults.navigation = {
        id: 'navigation',
        name: 'Navigation & Hydrographic Pilot Agent',
        responsibility: 'Monitors navigation and vessel traffic',
        status: 'NOT_REQUIRED',
        result: 'Not evaluated for current mode (Not required for quick decision)',
        confidence: 0,
        source: 'Standby',
        updated_at: '',
        data_age: 'N/A',
        freshness_status: 'UNKNOWN',
      };
    }

    // 6. ENVIRONMENT AGENT
    if (requiredAgents.includes('environment')) {
      const envSummary = `Ecosystem markers stable. Salinity at ${salinity} PSU with no harmful algal bloom (HAB) toxicity detected.`;

      agentResults.environment = {
        id: 'environment',
        name: 'Marine Ecosystem & Environment Agent',
        responsibility: 'Tracks chlorophyll concentrations, water quality, salinity, and biotope health',
        status: 'COMPLETED',
        result: envSummary,
        confidence: 0.90,
        source: 'ISRO Oceansat-3 & MoEFCC Coastal Observatory',
        updated_at: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
        data_age: envAgeText,
        freshness_status: 'AGING',
        keyMetrics: {
          'Salinity': `${salinity} PSU`,
          'Chlorophyll': `${chlorophyll} mg/m³`,
        },
      };
    } else {
      agentResults.environment = {
        id: 'environment',
        name: 'Marine Ecosystem & Environment Agent',
        responsibility: 'Tracks environmental biotope indices',
        status: 'NOT_REQUIRED',
        result: 'Not evaluated for current mode',
        confidence: 0,
        source: 'Standby',
        updated_at: '',
        data_age: 'N/A',
        freshness_status: 'UNKNOWN',
      };
    }

    // 7. DATA QUALITY & SENSOR AGENT
    if (requiredAgents.includes('data_quality')) {
      const hasOutdatedData =
        weatherFreshness === 'OUTDATED' ||
        agentResults.pfz?.status === 'DATA_UNAVAILABLE';

      const dqSummary = hasOutdatedData
        ? 'Telemetry latency warning: one or more incoming sensor feeds are delayed or outdated.'
        : 'Telemetry integrity verified: active sensors streaming within acceptable marine latency windows.';

      agentResults.data_quality = {
        id: 'data_quality',
        name: 'Data Freshness & Telemetry Agent',
        responsibility: 'Verifies data timestamps, sensor latency, and flags stale observation feeds',
        status: 'COMPLETED',
        result: dqSummary,
        confidence: 0.96,
        source: 'ORCA Edge Stream Monitor & Telemetry Validator',
        updated_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        data_age: sensorAgeText,
        freshness_status: 'FRESH',
        keyMetrics: {
          'Validation Pipeline': 'Active',
          'Freshness Health': hasOutdatedData ? 'Degraded Feeds' : 'Optimal Synchrony',
        },
      };
    } else {
      agentResults.data_quality = {
        id: 'data_quality',
        name: 'Data Freshness & Telemetry Agent',
        responsibility: 'Monitors data quality and freshness',
        status: 'NOT_REQUIRED',
        result: 'Not evaluated for current mode',
        confidence: 0,
        source: 'Standby',
        updated_at: '',
        data_age: 'N/A',
        freshness_status: 'UNKNOWN',
      };
    }

    // -------------------------------------------------------------
    // CALCULATE CONFIDENCE & CROSS-AGENT REASONING
    // -------------------------------------------------------------
    const executedAgents = requiredAgents.filter(
      (id) => agentResults[id] && agentResults[id].status !== 'NOT_REQUIRED'
    );
    const skippedAgents = allAgentIds.filter((id) => !requiredAgents.includes(id));

    let totalConf = 0;
    let validCount = 0;
    executedAgents.forEach((id) => {
      const a = agentResults[id];
      if (a && a.status === 'COMPLETED') {
        totalConf += a.confidence;
        validCount++;
      } else if (a && (a.status === 'FAILED' || a.status === 'DATA_UNAVAILABLE')) {
        totalConf += 0.3; // Penalty for failure
        validCount++;
      }
    });

    let overallConfidence = validCount > 0 ? Number((totalConf / validCount).toFixed(2)) : 0.85;
    if (hasAgentFailure || options.simulateOutdatedWeather) {
      overallConfidence = Math.min(overallConfidence, 0.65);
    }

    const confidenceRating: 'High' | 'Moderate' | 'Low' =
      overallConfidence >= 0.85 ? 'High' : overallConfidence >= 0.7 ? 'Moderate' : 'Low';

    // -------------------------------------------------------------
    // BUILD MODE-SPECIFIC PAYLOADS
    // -------------------------------------------------------------
    let fishermanPayload: FishermanResult | undefined;
    let marineSafetyPayload: MarineSafetyResult | undefined;
    let researchPayload: ResearchResult | undefined;
    let actionableConclusion = '';

    // ========================
    // FISHERMAN MODE PAYLOAD
    // ========================
    if (mode === 'fisherman') {
      const isPfzDown = agentResults.pfz?.status === 'DATA_UNAVAILABLE';
      const hasOutdatedData =
        agentResults.weather?.freshness_status === 'OUTDATED' ||
        agentResults.pfz?.freshness_status === 'OUTDATED' ||
        isPfzDown;

      const pfzStatusLabel = isPfzDown
        ? 'DATA UNAVAILABLE'
        : isInsidePfz
        ? 'PFZ AVAILABLE'
        : isNearbyPfz
        ? 'PFZ NEARBY'
        : 'NO PFZ';

      const pfzSuitability = isPfzDown
        ? 'Unfavorable'
        : chlorophyll >= 0.8
        ? 'High'
        : chlorophyll >= 0.5
        ? 'Moderate'
        : 'Low';

      const hazardsList: string[] = [];
      if (waveHeight >= 2.2) hazardsList.push(`High waves up to ${waveHeight}m`);
      if (windSpeed >= 32) hazardsList.push(`Strong surface winds (${windSpeed} km/h)`);
      if (pressureHpa < 1000) hazardsList.push('Barometric depression / squall risk');
      if (hazardsList.length === 0) hazardsList.push('No acute weather hazards detected');

      // Concrete 4 questions
      const ansIsItSafe =
        safetyLevel === 'SAFE'
          ? 'Yes, conditions are currently calm and safe for fishing.'
          : safetyLevel === 'CAUTION'
          ? 'Proceed with caution: moderate waves and choppy surface winds.'
          : safetyLevel === 'WARNING'
          ? 'Not recommended for small craft: strong winds and high swell.'
          : 'NO: Dangerous storm/wave conditions. Stay in harbor.';

      const ansIsTherePfz = isPfzDown
        ? 'PFZ data is temporarily unavailable from satellite feeds.'
        : isInsidePfz
        ? `Yes! You are directly within a high-potential fishing zone (${pfzDistanceKm} km).`
        : isNearbyPfz
        ? `Yes! A potential fishing zone is detected approximately ${pfzDistanceKm} km away.`
        : `No immediate PFZ detected (nearest thermal front is ${pfzDistanceKm} km away).`;

      const ansHowFresh = `Weather is ${weatherAgeText.toLowerCase().replace('updated ', '')} and PFZ is ${pfzAgeText.toLowerCase().replace('updated ', '')}.${hasOutdatedData ? ' (Warning: Some feeds are aging)' : ''}`;

      let ansWhatShouldIDo = '';
      if (safetyLevel === 'DANGER') {
        ansWhatShouldIDo = 'Do not venture out to sea. Return immediately to the nearest safe landing port.';
      } else if (safetyLevel === 'WARNING') {
        ansWhatShouldIDo = 'Stay close to coastal harbors. Avoid traveling far offshore to distant PFZ points.';
      } else if (safetyLevel === 'CAUTION') {
        ansWhatShouldIDo = isNearbyPfz
          ? `Fishing is possible with caution. Head ${pfzDistanceKm} km toward the PFZ corridor while monitoring winds.`
          : 'Stay within sheltered coastal zones until wind speeds drop below 20 km/h.';
      } else {
        ansWhatShouldIDo = isNearbyPfz
          ? `Safe to cast off! Head toward the PFZ zone ${pfzDistanceKm} km away for optimal catch rates.`
          : 'Safe for fishing, but yields may be higher if you move toward richer offshore thermal boundaries.';
      }

      // Actionable AI conclusion directly answering user prompt specification:
      // "Fishing may be possible, but caution is advised because wind conditions are currently elevated. The nearest PFZ is approximately 4.2 km away. Weather data is 18 minutes old and PFZ data is 2 hours old."
      if (isPfzDown) {
        actionableConclusion = `Safety status is ${safetyLevel} with ${windSpeed} km/h winds and ${waveHeight}m waves. PFZ satellite data is temporarily unavailable, so target coordinates cannot be verified. Weather data is ${weatherAgeText.toLowerCase().replace('updated ', '')}.`;
      } else if (safetyLevel === 'DANGER' || safetyLevel === 'WARNING') {
        actionableConclusion = `Departure is NOT advised. Sea danger is ${safetyLevel} with ${windSpeed} km/h winds and ${waveHeight}m waves. Even though a PFZ is ${pfzDistanceKm} km away, marine safety takes strict precedence. Weather data is ${weatherAgeText.toLowerCase().replace('updated ', '')} and PFZ data is ${pfzAgeText.toLowerCase().replace('updated ', '')}.`;
      } else if (safetyLevel === 'CAUTION') {
        actionableConclusion = `Fishing may be possible, but caution is advised because wind conditions are currently elevated (${windSpeed} km/h, ${waveHeight}m waves). The nearest PFZ is approximately ${pfzDistanceKm} km away. Weather data is ${weatherAgeText.toLowerCase().replace('updated ', '')} and PFZ data is ${pfzAgeText.toLowerCase().replace('updated ', '')}.`;
      } else {
        actionableConclusion = `Optimal conditions for fishing! Sea state is calm (${waveHeight}m waves, ${windSpeed} km/h winds). A productive PFZ is located approximately ${pfzDistanceKm} km from this position. Weather data is ${weatherAgeText.toLowerCase().replace('updated ', '')} and PFZ data is ${pfzAgeText.toLowerCase().replace('updated ', '')}.`;
      }

      fishermanPayload = {
        safety: {
          level: safetyLevel,
          headline:
            safetyLevel === 'SAFE'
              ? 'Sea Conditions are Favorable'
              : safetyLevel === 'CAUTION'
              ? 'Moderate Wave Conditions & Choppy Winds'
              : safetyLevel === 'WARNING'
              ? 'Elevated Swell & Strong Gust Warning'
              : 'Severe Marine Storm Danger',
          details: agentResults.safety.result,
          hazards: hazardsList,
          isSafeForDeparture: safetyLevel === 'SAFE' || safetyLevel === 'CAUTION',
        },
        pfz: {
          status: pfzStatusLabel,
          isAvailable: !isPfzDown && (isInsidePfz || isNearbyPfz),
          distanceKm: pfzDistanceKm,
          suitability: pfzSuitability,
          confidence: isPfzDown ? 0.35 : 0.91,
          targetSpecies: ['Indian Mackerel', 'Oil Sardine', 'Ribbon Fish', 'Yellowfin Tuna'],
          chlorophyllMgM3: chlorophyll,
        },
        freshness: {
          overallStatus: hasOutdatedData ? 'AGING' : 'FRESH',
          hasOutdatedWarning: hasOutdatedData,
          sources: [
            {
              category: 'Weather / Wind',
              sourceName: 'IMD Doppler Coastal Radar',
              age: weatherAgeText,
              timestamp: agentResults.weather.updated_at,
              status: weatherFreshness,
            },
            {
              category: 'Ocean / Wave',
              sourceName: 'INCOIS Wave Watch III',
              age: oceanAgeText,
              timestamp: agentResults.ocean.updated_at,
              status: oceanFreshness,
            },
            {
              category: 'PFZ / Fish Zones',
              sourceName: 'ISRO Oceansat-3 OCM-3',
              age: isPfzDown ? 'Data Unavailable' : pfzAgeText,
              timestamp: agentResults.pfz.updated_at,
              status: isPfzDown ? 'OUTDATED' : pfzFreshness,
            },
          ],
        },
        conclusion: {
          summary: actionableConclusion,
          confidence: confidenceRating,
          confidenceScore: overallConfidence,
          answers: {
            isItSafe: ansIsItSafe,
            isTherePfz: ansIsTherePfz,
            howFreshIsData: ansHowFresh,
            whatShouldIDo: ansWhatShouldIDo,
          },
        },
      };
    }

    // ============================
    // MARINE SAFETY MODE PAYLOAD
    // ============================
    if (mode === 'marine-safety') {
      const riskScore =
        safetyLevel === 'DANGER' ? 88 : safetyLevel === 'WARNING' ? 68 : safetyLevel === 'CAUTION' ? 45 : 18;

      actionableConclusion = `Coast Guard Maritime Safety Directive: Sector evaluated at ${safetyLevel} risk level (${riskScore}/100). Significant wave height at ${waveHeight}m with ${windSpeed} km/h gusts. Channel traffic remains under active transponder monitoring. Small craft advisory is ${safetyLevel === 'SAFE' ? 'DISENGAGED' : 'ACTIVE'}.`;

      marineSafetyPayload = {
        riskLevel: safetyLevel,
        riskScore,
        alertHeadline: `${safetyLevel} THREAT LEVEL: ${context.nearestCoast}`,
        weatherSummary: agentResults.weather.result,
        oceanConditions: {
          waveHeight,
          swellPeriod: Number((7.2 + Math.sin(latSeed) * 2.1).toFixed(1)),
          surfaceCurrent: currentVelocity,
          sst,
        },
        windConditions: {
          speedKmh: windSpeed,
          speedKnots: windSpeedKnots,
          direction: 'WSW (245°)',
          gustsKmh: Math.round(windSpeed * 1.3),
        },
        navigationHazards: [
          'High beam-sea rolling for shallow-draft vessels',
          `Shallow reef compression at ${context.distanceToCoastNm} nm from coast`,
          'Commercial shipping traffic fairway crossing at 4.5 nm',
        ],
        restrictedZones: [
          { name: 'Naval Offshore Firing Perimeter B-4', type: 'Security', distanceNm: 8.5 },
          { name: 'Submerged Rock Shoal (Karanja Shoal)', type: 'Shallow Reef', distanceNm: 3.2 },
          { name: 'Deep Draft VLCC Traffic Separation Scheme', type: 'Commercial Lane', distanceNm: 5.1 },
        ],
        safetyRecommendations: [
          safetyLevel === 'DANGER' ? 'ORDER IMMEDIATE HARBOR RETURN' : 'Issue advisory to motorized craft under 20m',
          'Enforce continuous VHF Channel 16 bridge watch',
          'Monitor barometric pressure drops every 30 minutes',
        ],
        coastGuardNotice: `ICG Maritime Rescue Co-ordination Centre (MRCC) standing by on 156.800 MHz. Radar coverage nominal.`,
        freshnessSummary: {
          overallStatus: weatherFreshness === 'OUTDATED' ? 'OUTDATED' : 'FRESH',
          lastRadarPing: weatherAgeText,
          lastBuoyTelemetry: oceanAgeText,
        },
        conclusion: {
          text: actionableConclusion,
          confidence: overallConfidence,
        },
      };
    }

    // ============================
    // RESEARCH MODE PAYLOAD
    // ============================
    if (mode === 'research') {
      actionableConclusion = `Multi-agent oceanographic telemetry correlates thermal stratification (+0.7°C above decadal baseline) with surface chlorophyll density of ${chlorophyll} mg/m³. Consensus level across 7 specialized agents: 6/7 agreement on ${safetyLevel} risk index.`;

      researchPayload = {
        allAgents: agentResults,
        oceanParameters: {
          sst,
          salinity,
          chlorophyll,
          currentVelocity,
          waveHeight,
          pressureHpa,
        },
        decadalAnomaly: {
          wavePercentile: Math.min(99, Math.round(50 + (waveHeight - 1.5) * 25)),
          sstDeviation: `+${(sst - 27.5).toFixed(1)}°C vs 30-year climatology`,
          climatologyMatch: 'Consistent with post-monsoon cyclonic pre-conditioning',
        },
        consensusBreakdown: {
          agreementRatio: '6/7 Agents Aligned',
          supportingAgentNames: ['Safety', 'Weather', 'Ocean', 'Navigation', 'Data Freshness', 'Environment'],
          conflictingAgentNames: ['Fisheries (Yield favorable vs Hazard elevated)'],
          conflictReasoning:
            'Fisheries agent highlights high pelagic productivity while Safety and Ocean agents enforce elevated hydrodynamic risk thresholds.',
        },
        evidenceTrail: [
          {
            source: 'ISRO Oceansat-3',
            sensor: 'OCM-3 Spectrometer',
            parameter: 'Chlorophyll-a',
            value: `${chlorophyll} mg/m³`,
            latency: pfzAgeText,
            freshness: pfzFreshness,
          },
          {
            source: 'IMD Coastal Doppler',
            sensor: 'S-Band Radar',
            parameter: 'Surface Wind / Gusts',
            value: `${windSpeed} km/h`,
            latency: weatherAgeText,
            freshness: weatherFreshness,
          },
          {
            source: 'NIOT Ocean Buoy',
            sensor: 'Acoustic Wave Profiler',
            parameter: 'Significant Wave Height',
            value: `${waveHeight} m`,
            latency: oceanAgeText,
            freshness: oceanFreshness,
          },
          {
            source: 'INCOIS Argo Float',
            sensor: 'CTD Probe (Conductivity/Temp/Depth)',
            parameter: 'Salinity & SST',
            value: `${salinity} PSU / ${sst}°C`,
            latency: envAgeText,
            freshness: 'AGING',
          },
        ],
        conclusion: {
          text: actionableConclusion,
          scientificSummary: `Cross-spectral wave energy distribution indicates predominantly distant swell propagation. Surface chlorophyll upwelling is confirmed along the 50m isobath.`,
          aggregateConfidence: overallConfidence,
        },
      };
    }

    return {
      location: context,
      activeMode: mode,
      modeLabel: MODE_CONFIG[mode].label,
      requiredAgentIds: requiredAgents,
      executedAgentIds: executedAgents,
      skippedAgentIds: skippedAgents,
      agentResults,
      overallConfidence,
      confidenceRating,
      hasAgentFailure,
      failureNotices,
      fisherman: fishermanPayload,
      marineSafety: marineSafetyPayload,
      research: researchPayload,
      actionableConclusion,
      timestamp: new Date().toISOString(),
    };
  }
}

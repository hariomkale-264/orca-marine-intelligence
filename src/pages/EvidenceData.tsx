import React, { useState } from 'react';
import { Database, Download, Search, FileText, CheckCircle2, SlidersHorizontal } from 'lucide-react';

interface DatasetRecord {
  id: string;
  datasetName: string;
  category: 'Oceanographic' | 'Fisheries' | 'Acoustic' | 'Satellite' | 'Meteorological';
  coordinates: string;
  timestamp: string;
  format: 'NetCDF' | 'CSV' | 'JSON' | 'GeoTIFF';
  size: string;
  status: 'Verified' | 'Calibrated';
}

const DATASETS: DatasetRecord[] = [
  {
    id: 'DS-2026-041',
    datasetName: 'Benthic CTD Salinity & Thermocline Profile #148',
    category: 'Oceanographic',
    coordinates: '18.840° N, 72.650° E',
    timestamp: '2026-04-12 09:15 UTC',
    format: 'CSV',
    size: '14.8 MB',
    status: 'Verified',
  },
  {
    id: 'DS-2026-039',
    datasetName: 'Sentinel-3 Sea Surface Chlorophyll-a Radiometry Matrix',
    category: 'Satellite',
    coordinates: '14.800° N, 72.400° E',
    timestamp: '2026-04-12 06:30 UTC',
    format: 'GeoTIFF',
    size: '182.4 MB',
    status: 'Calibrated',
  },
  {
    id: 'DS-2026-032',
    datasetName: 'Potential Fishing Zone (PFZ) Advisory Composite V4',
    category: 'Fisheries',
    coordinates: 'Coastal Sectors A-D',
    timestamp: '2026-04-11 18:00 UTC',
    format: 'JSON',
    size: '4.2 MB',
    status: 'Verified',
  },
  {
    id: 'DS-2026-028',
    datasetName: 'Passive Acoustic Hydrophone Bio-Telemetry Log (Sperm Whale & Cetaceans)',
    category: 'Acoustic',
    coordinates: 'Outer Trench Station #04',
    timestamp: '2026-04-11 12:00 UTC',
    format: 'NetCDF',
    size: '412.0 MB',
    status: 'Verified',
  },
  {
    id: 'DS-2026-019',
    datasetName: 'High-Frequency Coastal Radar Surface Currents Grid',
    category: 'Meteorological',
    coordinates: '18.900° N, 72.800° E',
    timestamp: '2026-04-11 08:45 UTC',
    format: 'CSV',
    size: '8.6 MB',
    status: 'Verified',
  },
];

export const EvidenceData: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const filtered = DATASETS.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.datasetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.coordinates.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDownload = (id: string, name: string) => {
    setDownloadSuccess(id);
    // Trigger sample JSON download
    const sampleData = {
      datasetId: id,
      datasetName: name,
      extractedAt: new Date().toISOString(),
      provenance: 'ORCA Marine Intelligence Global Repository',
      telemetryNodes: ['Buoy-Alpha', 'Buoy-Gamma', 'HF-Radar-01'],
      qualityFlag: 'WMO Grade 1',
    };
    const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${id.toLowerCase()}-orca-evidence.json`;
    a.click();
    URL.revokeObjectURL(url);

    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  return (
    <div
      id="orca-evidence-data-page"
      className="w-full flex-1 max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 text-white select-text pb-20 sm:pb-24"
    >
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest text-white/50 uppercase">
            <Database className="w-3.5 h-3.5 text-white/70" />
            OCEANOGRAPHIC OBSERVATION REPOSITORY & EVIDENCE DATASETS
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans mt-1">
            Evidence & Ocean Data
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-white/60">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>GOOS / WMO PROTOCOL SYNCHRONIZED</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="liquid-glass rounded-2xl p-4 sm:p-5 my-6 border border-white/15 shadow-xl flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search datasets, coordinates, IDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/50 border border-white/20 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/50"
          />
        </div>

        {/* Category Pills */}
        <div className="w-full md:w-auto flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <SlidersHorizontal className="w-3.5 h-3.5 text-white/40 mr-1 hidden sm:block" />
          {['All', 'Oceanographic', 'Fisheries', 'Satellite', 'Acoustic', 'Meteorological'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'bg-white/5 hover:bg-white/15 text-white/80 border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Datasets Table */}
      <div className="liquid-glass rounded-2xl sm:rounded-3xl border border-white/15 p-4 sm:p-6 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/50 text-[11px] font-mono uppercase">
                <th className="py-3 px-3">Dataset ID</th>
                <th className="py-3 px-3">Title & Classification</th>
                <th className="py-3 px-3">Location / Station</th>
                <th className="py-3 px-3">Observation Timestamp</th>
                <th className="py-3 px-3">Format & Size</th>
                <th className="py-3 px-3">Quality</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.04] transition-colors">
                  <td className="py-4 px-3 font-mono font-semibold text-white/90">
                    {row.id}
                  </td>
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-white/40 shrink-0" />
                      <div>
                        <span className="font-semibold text-white block text-xs sm:text-sm">
                          {row.datasetName}
                        </span>
                        <span className="text-[10px] text-white/40 uppercase font-mono">
                          {row.category}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-3 font-mono text-gray-300 text-xs">{row.coordinates}</td>
                  <td className="py-4 px-3 font-mono text-gray-400 text-xs">{row.timestamp}</td>
                  <td className="py-4 px-3 font-mono text-gray-300 text-xs">
                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-white text-[10px] mr-1.5">
                      {row.format}
                    </span>
                    {row.size}
                  </td>
                  <td className="py-4 px-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {row.status}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-right">
                    <button
                      onClick={() => handleDownload(row.id, row.datasetName)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-white/90 active:scale-95 transition-all cursor-pointer shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{downloadSuccess === row.id ? 'Downloaded' : 'Export'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-white/50 text-xs">
              No datasets matching the filter criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

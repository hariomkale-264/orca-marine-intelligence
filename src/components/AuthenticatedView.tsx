import React from 'react';
import { Activity, Radio, Compass, LogOut, CheckCircle2 } from 'lucide-react';
import { UserSession } from '../types.ts';
import { SecurityBadge } from './SecurityBadge.tsx';

interface AuthenticatedViewProps {
  session: UserSession;
  onSignOut: () => void;
  onEnterApp?: () => void;
}

export const AuthenticatedView: React.FC<AuthenticatedViewProps> = ({ session, onSignOut, onEnterApp }) => {
  return (
    <div className="w-full text-center space-y-4">
      {/* Active Session Status */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-medium">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span>Telemetry Uplink Active</span>
      </div>

      <div>
        <h2 className="text-white text-2xl font-semibold tracking-tight">
          Welcome to ORCA
        </h2>
        <p className="text-white/60 text-xs mt-1 font-mono break-all">
          {session.email}
        </p>
      </div>

      {/* Marine Intelligence Telemetry Card */}
      <div className="p-3.5 rounded-xl bg-white/[0.06] border border-white/15 text-left space-y-2.5 backdrop-blur-md">
        <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10">
          <span className="text-white/50 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            Node Station
          </span>
          <span className="font-mono text-cyan-300 font-semibold">{session.stationId}</span>
        </div>

        <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10">
          <span className="text-white/50 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            Coordinates
          </span>
          <span className="text-white/90 text-right">{session.nodeLocation}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-white/50 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            AI AI Status
          </span>
          <span className="flex items-center gap-1 text-emerald-300 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            Real-time Autonomous
          </span>
        </div>
      </div>

      {/* Enter Application Button */}
      <button
        type="button"
        id="btn-launch-orca-app"
        onClick={() => {
          if (onEnterApp) {
            onEnterApp();
          } else {
            window.location.pathname = '/home';
          }
        }}
        className="w-full rounded-xl py-3 font-semibold text-black text-xs tracking-wider uppercase bg-white hover:bg-white/90 active:scale-98 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
      >
        <span>ENTER ORCA APPLICATION</span>
      </button>

      {/* Sign Out button */}
      <button
        type="button"
        id="btn-sign-out"
        onClick={onSignOut}
        className="w-full rounded-xl py-2.5 font-medium text-white/80 hover:text-white text-xs tracking-wider uppercase bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>SIGN OUT & TERMINATE SESSION</span>
      </button>

      <SecurityBadge />
    </div>
  );
};

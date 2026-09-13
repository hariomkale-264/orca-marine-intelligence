import React, { useEffect, useRef } from 'react';
import { OrcaRole } from '../types.ts';
import { Fish, Compass, ShieldAlert, Ship, Anchor, Check } from 'lucide-react';

interface RoleSelectorProps {
  activeRole: OrcaRole;
  onSelectRole: (role: OrcaRole) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface RoleOption {
  role: OrcaRole;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ROLES: RoleOption[] = [
  {
    role: 'Fisherman',
    label: 'Fisherman',
    description: 'Fishing zones, sea state, weather & safe routes',
    icon: Fish,
  },
  {
    role: 'Marine Researchers',
    label: 'Marine Researchers',
    description: 'Oceanographic data, CTD, salinity & observations',
    icon: Compass,
  },
  {
    role: 'Coastal Authorities',
    label: 'Coastal Authorities',
    description: 'Hazards, emergency alerts & coastal security',
    icon: ShieldAlert,
  },
  {
    role: 'Maritime Operators',
    label: 'Maritime Operators',
    description: 'Vessel transit, route safety & logistics',
    icon: Ship,
  },
  {
    role: 'Default Mode',
    label: 'Default Mode',
    description: 'General marine intelligence decision support',
    icon: Anchor,
  },
];

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  activeRole,
  onSelectRole,
  isOpen,
  onClose,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      id="orca-role-selector-popover"
      className="absolute bottom-full right-0 mb-3 w-72 sm:w-80 rounded-2xl liquid-glass border border-white/20 p-2 shadow-[0_16px_40px_rgba(0,0,0,0.7)] z-50 animate-fade-slide-up backdrop-blur-xl"
    >
      <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-white/70">
          Select Operating Role
        </span>
        <span className="text-[10px] text-white/40 font-mono">ORCA AI CONTEXT</span>
      </div>

      <div className="mt-1 space-y-1">
        {ROLES.map((item) => {
          const isSelected = activeRole === item.role;
          const Icon = item.icon;

          return (
            <button
              key={item.role}
              id={`role-option-${item.role.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => {
                onSelectRole(item.role);
                onClose();
              }}
              className={`w-full text-left flex items-start gap-3 p-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-white text-black'
                  : 'hover:bg-white/10 text-white/90'
              }`}
            >
              <div
                className={`p-2 rounded-lg flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-black text-white' : 'bg-white/10 text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isSelected ? 'text-black' : 'text-white'}`}>
                    {item.label}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-black shrink-0" />}
                </div>
                <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-black/70' : 'text-white/50'}`}>
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

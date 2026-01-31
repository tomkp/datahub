import { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Tenant } from '../lib/api';

interface TenantSelectorProps {
  tenants: Tenant[];
  selectedTenantId: string | null;
  onSelect: (tenantId: string) => void;
}

export function TenantSelector({ tenants, selectedTenantId, onSelect }: TenantSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId);

  useEffect(() => {
    function handleClickOutside(event: globalThis.MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as globalThis.Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (tenantId: string) => {
    onSelect(tenantId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border border-border',
          'hover:bg-surface-2 transition-colors duration-150',
          'text-sm min-w-[180px]'
        )}
        aria-label="Select tenant"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 text-left truncate">
          {selectedTenant?.name || 'Select tenant...'}
        </span>
        <ChevronDown className={cn(
          'h-4 w-4 text-muted-foreground transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className={cn(
            'absolute top-full left-0 right-0 mt-1 z-50',
            'bg-background border border-border rounded-lg shadow-lg',
            'max-h-60 overflow-y-auto'
          )}
        >
          {tenants.map((tenant) => (
            <button
              key={tenant.id}
              role="option"
              aria-selected={tenant.id === selectedTenantId}
              onClick={() => handleSelect(tenant.id)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm',
                'hover:bg-surface-2 transition-colors duration-75',
                tenant.id === selectedTenantId && 'bg-primary/10 text-primary'
              )}
            >
              <Building2 className="h-4 w-4" />
              <span className="flex-1 text-left truncate">{tenant.name}</span>
              {tenant.id === selectedTenantId && (
                <Check className="h-4 w-4" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

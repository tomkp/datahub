import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TenantSelector } from './TenantSelector';

const mockTenants = [
  { id: 't1', name: 'Acme Corp' },
  { id: 't2', name: 'Globex Inc' },
];

describe('TenantSelector', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders current tenant name', () => {
    render(
      <TenantSelector
        tenants={mockTenants}
        selectedTenantId="t1"
        onSelect={() => {}}
      />
    );
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('shows dropdown when clicked', () => {
    render(
      <TenantSelector
        tenants={mockTenants}
        selectedTenantId="t1"
        onSelect={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('lists all tenants in dropdown', () => {
    render(
      <TenantSelector
        tenants={mockTenants}
        selectedTenantId="t1"
        onSelect={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Globex Inc')).toBeInTheDocument();
  });

  it('calls onSelect when a tenant is selected', () => {
    const onSelect = vi.fn();
    render(
      <TenantSelector
        tenants={mockTenants}
        selectedTenantId="t1"
        onSelect={onSelect}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Globex Inc'));
    expect(onSelect).toHaveBeenCalledWith('t2');
  });

  it('closes dropdown after selection', () => {
    render(
      <TenantSelector
        tenants={mockTenants}
        selectedTenantId="t1"
        onSelect={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Globex Inc'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows placeholder when no tenant selected', () => {
    render(
      <TenantSelector
        tenants={mockTenants}
        selectedTenantId={null}
        onSelect={() => {}}
      />
    );
    expect(screen.getByText(/select tenant/i)).toBeInTheDocument();
  });

  it('has accessible label', () => {
    render(
      <TenantSelector
        tenants={mockTenants}
        selectedTenantId="t1"
        onSelect={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: /select tenant/i })).toBeInTheDocument();
  });
});

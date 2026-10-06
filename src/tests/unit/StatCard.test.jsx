/**
 * UNIT TESTS: StatCard Component
 * Tests that stat values and labels render correctly across all 4 dashboard roles.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from '../../components/StatCard';
import { ClipboardList } from 'lucide-react';

describe('StatCard component', () => {
  it('renders the value correctly', () => {
    render(<StatCard icon={ClipboardList} tone="total" value={42} label="Active Complaints" />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders the label correctly', () => {
    render(<StatCard icon={ClipboardList} tone="review" value={10} label="Pending Triage" />);
    expect(screen.getByText('Pending Triage')).toBeInTheDocument();
  });

  it('renders a dash while loading (value is "-")', () => {
    render(<StatCard icon={ClipboardList} tone="progress" value="-" label="In Progress" />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('renders with zero value', () => {
    render(<StatCard icon={ClipboardList} tone="resolved" value={0} label="Needs Verification" />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});

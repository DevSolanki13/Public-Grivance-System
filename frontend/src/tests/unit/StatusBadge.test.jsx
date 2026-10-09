/**
 * UNIT TESTS: StatusBadge Component
 * Verifies that the correct status label and CSS class is applied per lifecycle state.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../../components/StatusBadge';

describe('StatusBadge component', () => {
  const statuses = ['Submitted', 'Under Review', 'In Progress', 'Closed', 'Reopened', 'Rejected'];

  statuses.forEach((status) => {
    it(`renders "${status}" text with its status class`, () => {
      render(<StatusBadge status={status} />);
      const badge = screen.getByText(status);
      expect(badge).toHaveClass('badge', `badge-${status.toLowerCase().replace(/\s+/g, '-')}`);
    });
  });

  it('labels "Resolved" as "Awaiting Verification" (the citizen still has to approve)', () => {
    render(<StatusBadge status="Resolved" />);
    expect(screen.getByText('Awaiting Verification')).toHaveClass('badge-resolved');
  });

  it('renders without crashing for unknown status', () => {
    render(<StatusBadge status="Unknown Status" />);
    expect(screen.getByText('Unknown Status')).toBeInTheDocument();
  });

  it('renders null/empty gracefully', () => {
    const { container } = render(<StatusBadge status="" />);
    expect(container).toBeTruthy();
  });
});

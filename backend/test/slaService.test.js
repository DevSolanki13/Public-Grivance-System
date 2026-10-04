import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSLADeadline, computeSLAStatus, evaluateAllGrievancesSLA } from '../services/slaService.js';

describe('SLA Service and Deadlines', () => {
  it('should calculate future deadline based on target hours', () => {
    const base = new Date('2026-10-01T10:00:00.000Z');
    const result = calculateSLADeadline(48, base);
    assert.equal(result.slaStartedAt, '2026-10-01T10:00:00.000Z');
    assert.equal(result.slaDeadline, '2026-10-03T10:00:00.000Z');
  });

  it('should compute ON_TRACK and OVERDUE states correctly for active grievances', () => {
    const futureDeadline = new Date(Date.now() + 30 * 3600 * 1000).toISOString();
    const activeOnTrack = {
      status: 'IN_PROGRESS',
      slaDeadline: futureDeadline,
    };
    const onTrackStatus = computeSLAStatus(activeOnTrack);
    assert.equal(onTrackStatus.isOverdue, false);
    assert.equal(onTrackStatus.status, 'ON_TRACK');

    const pastDeadline = new Date(Date.now() - 5 * 3600 * 1000).toISOString();
    const activeOverdue = {
      status: 'IN_PROGRESS',
      slaDeadline: pastDeadline,
    };
    const overdueStatus = computeSLAStatus(activeOverdue);
    assert.equal(overdueStatus.isOverdue, true);
    assert.equal(overdueStatus.status, 'OVERDUE');
  });

  it('should evaluate closed grievances accurately based on completion timestamp', () => {
    const deadline = new Date('2026-10-03T10:00:00.000Z').toISOString();
    const closedEarly = {
      status: 'CLOSED',
      closedAt: new Date('2026-10-02T15:00:00.000Z').toISOString(),
      slaDeadline: deadline,
    };
    const statusEarly = computeSLAStatus(closedEarly);
    assert.equal(statusEarly.status, 'RESOLVED_WITHIN_SLA');
    assert.equal(statusEarly.isOverdue, false);

    const closedLate = {
      status: 'CLOSED',
      closedAt: new Date('2026-10-04T12:00:00.000Z').toISOString(),
      slaDeadline: deadline,
    };
    const statusLate = computeSLAStatus(closedLate);
    assert.equal(statusLate.status, 'RESOLVED_AFTER_SLA');
    assert.equal(statusLate.isOverdue, true);
  });

  it('should evaluate and flag overdue active grievances during periodic batch runs', () => {
    const grievances = [
      {
        id: 'g-1',
        status: 'IN_PROGRESS',
        slaDeadline: new Date(Date.now() - 3600 * 1000).toISOString(),
        isOverdue: false,
        isEscalated: false,
      },
      {
        id: 'g-2',
        status: 'CLOSED',
        slaDeadline: new Date(Date.now() - 3600 * 1000).toISOString(),
        isOverdue: false,
        isEscalated: false,
      },
    ];

    const updated = evaluateAllGrievancesSLA(grievances);
    assert.equal(updated, 1);
    assert.equal(grievances[0].isOverdue, true);
    assert.equal(grievances[0].isEscalated, true);
    assert.equal(grievances[1].isOverdue, false);
  });
});

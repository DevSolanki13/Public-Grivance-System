import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { GrievanceService } from '../services/grievanceService.js';
import { db } from '../db.js';
import { HttpError } from '../middleware/errorHandler.js';

describe('Security & Lifecycle Enforcement (Status Endpoint & Happy Path)', () => {
  beforeEach(() => {
    db.reset();
  });

  const citizenUser = {
    id: 'user-citizen-1',
    name: 'Palak Rathod',
    role: 'citizen',
    email: 'palak.rathod@example.com',
  };

  const sanitationHead = {
    id: 'user-head-sanitation',
    name: 'Sneha Iyer',
    role: 'department_head',
    departmentId: 'dept-sanitation',
  };

  const roadsHead = {
    id: 'user-head-roads',
    name: 'Ramesh Kulkarni',
    role: 'department_head',
    departmentId: 'dept-roads',
  };

  const roadsOfficer = {
    id: 'user-officer-roads',
    name: 'Rahul Sharma',
    role: 'officer',
    departmentId: 'dept-roads',
  };

  it('proves a Sanitation dept head cannot change a Roads complaint', () => {
    // grv-3 is a Roads complaint (departmentId: dept-roads)
    const roadsGrievance = db.getGrievances().find((g) => g.departmentId === 'dept-roads');
    assert.ok(roadsGrievance, 'Roads grievance must exist in seed data');

    assert.throws(
      () => {
        GrievanceService.updateStatus(roadsGrievance.id, 'UNDER_REVIEW', 'Sanitation head illegal update', sanitationHead);
      },
      (err) => {
        assert.ok(err instanceof HttpError);
        assert.equal(err.statusCode, 403);
        assert.match(err.message, /Forbidden.*department/i);
        return true;
      }
    );
  });

  it('proves an officer cannot reach AWAITING_VERIFICATION without /resolve (no photo)', () => {
    // grv-1 is assigned to officer Vinay Nair
    const elecOfficer = {
      id: 'user-officer-elec',
      name: 'Vinay Nair',
      role: 'officer',
      departmentId: 'dept-electrical',
    };
    const grievance = db.getGrievances().find((g) => g.id === 'grv-1');
    assert.ok(grievance, 'grv-1 must exist');
    assert.equal(grievance.status, 'IN_PROGRESS');

    assert.throws(
      () => {
        GrievanceService.updateStatus(grievance.id, 'AWAITING_VERIFICATION', 'Bypassing photo upload', elecOfficer);
      },
      (err) => {
        assert.ok(err instanceof HttpError);
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /Cannot transition to 'AWAITING_VERIFICATION' via status endpoint/i);
        return true;
      }
    );
  });

  it('proves a citizen cannot close or reopen via PATCH /status', () => {
    // grv-2 is awaiting verification and created by user-citizen-1
    const grievance = db.getGrievances().find((g) => g.id === 'grv-2');
    assert.ok(grievance, 'grv-2 must exist');

    // Attempt direct CLOSE via status endpoint
    assert.throws(
      () => {
        GrievanceService.updateStatus(grievance.id, 'CLOSED', 'Citizen closing via status patch', citizenUser);
      },
      (err) => {
        assert.ok(err instanceof HttpError);
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /Cannot transition to 'CLOSED' via status endpoint/i);
        return true;
      }
    );

    // Attempt direct REOPEN via status endpoint
    assert.throws(
      () => {
        GrievanceService.updateStatus(grievance.id, 'REOPENED', 'Citizen reopening via status patch', citizenUser);
      },
      (err) => {
        assert.ok(err instanceof HttpError);
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /Cannot transition to 'REOPENED' via status endpoint/i);
        return true;
      }
    );
  });

  it('proves the full happy path works: submit -> assign -> start work -> resolve with photo -> citizen reopens with reason -> officer redoes -> citizen closes with rating', () => {
    // 1. Submit
    const created = GrievanceService.create(
      {
        categoryId: 'cat-roads',
        subject: 'Deep pothole outside school entrance',
        description: 'Large crater in the middle of the road causing safety hazards for schoolchildren.',
        priority: 'HIGH',
        address: 'School Road, Ward 4',
        area: 'Bhayandar West',
        pincode: '401101',
        latitude: 19.3012,
        longitude: 72.8519,
      },
      citizenUser
    );
    assert.equal(created.status, 'SUBMITTED');
    assert.equal(created.priority, 'HIGH');
    assert.equal(created.departmentId, 'dept-roads');

    // 2. Dept head assigns officer
    const assigned = GrievanceService.assignOfficer(created.id, 'user-officer-roads', 'Assigned for immediate repair', roadsHead);
    assert.equal(assigned.status, 'ASSIGNED');
    assert.equal(assigned.assignedOfficerId, 'user-officer-roads');

    // 3. Officer starts work
    const started = GrievanceService.updateStatus(created.id, 'IN_PROGRESS', 'Arrived at site with asphalt roller', roadsOfficer);
    assert.equal(started.status, 'IN_PROGRESS');

    // 4. Officer resolves with photo
    const resolved = GrievanceService.resolveWithProof(
      created.id,
      { resolutionSummary: 'Pothole filled with cold asphalt patch and compacted' },
      [{ filename: 'work-completed.jpg' }],
      roadsOfficer
    );
    assert.equal(resolved.status, 'AWAITING_VERIFICATION');
    assert.equal(resolved.resolution.proofFiles.length, 1);

    // 5. Citizen reopens with reason
    const reopened = GrievanceService.verifyResolution(
      created.id,
      {
        satisfied: false,
        reopenReason: 'Patch deteriorated after rain; gravel is loose on roadway.',
      },
      citizenUser
    );
    assert.equal(reopened.status, 'REOPENED');
    assert.equal(reopened.isEscalated, true);

    // 6. Officer redoes work (start work -> resolve with photo)
    const reStarted = GrievanceService.updateStatus(created.id, 'IN_PROGRESS', 'Commencing complete excavation and hot mix asphalt repave', roadsOfficer);
    assert.equal(reStarted.status, 'IN_PROGRESS');

    const reResolved = GrievanceService.resolveWithProof(
      created.id,
      { resolutionSummary: 'Completely excavated, poured reinforced concrete sub-base, and topped with hot bitumen layer.' },
      [{ filename: 'heavy-repair-done.jpg' }],
      roadsOfficer
    );
    assert.equal(reResolved.status, 'AWAITING_VERIFICATION');

    // 7. Citizen closes with rating
    const closed = GrievanceService.verifyResolution(
      created.id,
      {
        satisfied: true,
        rating: 5,
        feedback: 'Excellent re-paving job! Road surface is completely even and safe now.',
      },
      citizenUser
    );
    assert.equal(closed.status, 'CLOSED');
    assert.equal(closed.verification.satisfied, true);
    assert.equal(closed.verification.rating, 5);
    assert.ok(closed.verification.verifiedAt);
  });

  describe('Input Validation on Grievance Creation', () => {
    it('rejects invalid priority with 400', () => {
      assert.throws(
        () => {
          GrievanceService.create(
            {
              categoryId: 'cat-roads',
              subject: 'Valid Subject Line',
              description: 'Valid description that has sufficient character length.',
              priority: 'SUPER_EXTREME',
            },
            citizenUser
          );
        },
        (err) => {
          assert.ok(err instanceof HttpError);
          assert.equal(err.statusCode, 400);
          assert.match(err.message, /Invalid priority/i);
          return true;
        }
      );
    });

    it('rejects latitude outside -90..90 with 400', () => {
      assert.throws(
        () => {
          GrievanceService.create(
            {
              categoryId: 'cat-roads',
              subject: 'Valid Subject Line',
              description: 'Valid description that has sufficient character length.',
              latitude: 95.5,
              longitude: 72.85,
            },
            citizenUser
          );
        },
        (err) => {
          assert.ok(err instanceof HttpError);
          assert.equal(err.statusCode, 400);
          assert.match(err.message, /Latitude must be a valid number between -90 and 90/i);
          return true;
        }
      );
    });

    it('rejects longitude outside -180..180 with 400', () => {
      assert.throws(
        () => {
          GrievanceService.create(
            {
              categoryId: 'cat-roads',
              subject: 'Valid Subject Line',
              description: 'Valid description that has sufficient character length.',
              latitude: 19.3,
              longitude: 195.0,
            },
            citizenUser
          );
        },
        (err) => {
          assert.ok(err instanceof HttpError);
          assert.equal(err.statusCode, 400);
          assert.match(err.message, /Longitude must be a valid number between -180 and 180/i);
          return true;
        }
      );
    });

    it('generates unique timeline ids without collisions', () => {
      const g = GrievanceService.create(
        {
          categoryId: 'cat-roads',
          subject: 'Timeline Collision Test',
          description: 'Testing timeline id uniqueness under sequential transitions.',
        },
        citizenUser
      );

      GrievanceService.assignOfficer(g.id, 'user-officer-roads', 'Assigned', roadsHead);
      GrievanceService.updateStatus(g.id, 'IN_PROGRESS', 'Working', roadsOfficer);

      const updated = db.getGrievances().find((item) => item.id === g.id);
      const timelineIds = updated.timeline.map((t) => t.id);
      const uniqueIds = new Set(timelineIds);

      assert.equal(timelineIds.length, uniqueIds.size, 'All timeline IDs must be unique');
    });
  });
});

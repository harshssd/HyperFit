import { MUSCLE_GROUP_TO_REGION, FRONT_REGIONS, BACK_REGIONS, MuscleId } from '../muscleRegions';

describe('MUSCLE_GROUP_TO_REGION', () => {
  it('maps direct muscle terms to themselves', () => {
    expect(MUSCLE_GROUP_TO_REGION.chest).toEqual(['chest']);
    expect(MUSCLE_GROUP_TO_REGION.biceps).toEqual(['biceps']);
    expect(MUSCLE_GROUP_TO_REGION.triceps).toEqual(['triceps']);
  });

  it('splits the legacy "shoulders" alias across the three deltoid heads', () => {
    expect(MUSCLE_GROUP_TO_REGION.shoulders.slice().sort()).toEqual(
      ['front_delts', 'rear_delts', 'side_delts']
    );
    expect(MUSCLE_GROUP_TO_REGION.delts).toEqual(MUSCLE_GROUP_TO_REGION.shoulders);
  });

  it('splits the legacy "back" alias into lats + mid-back', () => {
    expect(MUSCLE_GROUP_TO_REGION.back.slice().sort()).toEqual(['lats', 'mid_back']);
    expect(MUSCLE_GROUP_TO_REGION.lats).toEqual(['lats']);
  });

  it('splits "core" into abs + obliques', () => {
    expect(MUSCLE_GROUP_TO_REGION.core.slice().sort()).toEqual(['abs', 'obliques']);
  });

  it('legs distributes across all four leg muscles', () => {
    expect(MUSCLE_GROUP_TO_REGION.legs.slice().sort()).toEqual(
      ['calves', 'glutes', 'hamstrings', 'quads']
    );
  });

  it('full-body distributes across at least 5 regions', () => {
    expect(MUSCLE_GROUP_TO_REGION['full-body'].length).toBeGreaterThanOrEqual(5);
  });
});

describe('FRONT_REGIONS / BACK_REGIONS', () => {
  it('every region declares at least one shape with a known kind', () => {
    [...FRONT_REGIONS, ...BACK_REGIONS].forEach(r => {
      expect(r.shapes.length).toBeGreaterThan(0);
      r.shapes.forEach(s => {
        expect(['ellipse', 'rect', 'path']).toContain(s.kind);
      });
    });
  });

  it('front regions tag view=front, back regions tag view=back', () => {
    FRONT_REGIONS.forEach(r => expect(r.view).toBe('front'));
    BACK_REGIONS.forEach(r => expect(r.view).toBe('back'));
  });

  it('covers the front-visible muscle space (chest, delts, biceps, abs, quads, calves)', () => {
    const ids = new Set(FRONT_REGIONS.map(r => r.id));
    const required: MuscleId[] = ['chest', 'front_delts', 'biceps', 'abs', 'quads', 'calves'];
    required.forEach(id => expect(ids.has(id)).toBe(true));
  });

  it('covers the back-visible muscle space (lats, traps, glutes, hamstrings, lower_back)', () => {
    const ids = new Set(BACK_REGIONS.map(r => r.id));
    const required: MuscleId[] = ['lats', 'traps', 'glutes', 'hamstrings', 'lower_back'];
    required.forEach(id => expect(ids.has(id)).toBe(true));
  });

  it('every MUSCLE_GROUP_TO_REGION target resolves to a region that exists somewhere', () => {
    const allRegionIds = new Set<MuscleId>([
      ...FRONT_REGIONS.map(r => r.id),
      ...BACK_REGIONS.map(r => r.id),
    ]);
    Object.values(MUSCLE_GROUP_TO_REGION)
      .flat()
      .forEach(id => expect(allRegionIds.has(id)).toBe(true));
  });
});

import { MUSCLE_GROUP_TO_REGION, FRONT_REGIONS, BACK_REGIONS } from '../muscleRegions';

describe('MUSCLE_GROUP_TO_REGION', () => {
  it('maps common synonyms to canonical regions', () => {
    expect(MUSCLE_GROUP_TO_REGION.delts).toEqual(['shoulders']);
    expect(MUSCLE_GROUP_TO_REGION.abs).toEqual(['core']);
    expect(MUSCLE_GROUP_TO_REGION.lats).toEqual(['back']);
  });
  it('legs distributes across multiple regions', () => {
    expect(MUSCLE_GROUP_TO_REGION.legs.sort()).toEqual(['calves', 'glutes', 'hamstrings', 'quads']);
  });
  it('full-body distributes across at least 5 regions', () => {
    expect(MUSCLE_GROUP_TO_REGION['full-body'].length).toBeGreaterThanOrEqual(5);
  });
});

describe('FRONT_REGIONS / BACK_REGIONS', () => {
  it('every region declares at least one shape', () => {
    [...FRONT_REGIONS, ...BACK_REGIONS].forEach(r => {
      expect(r.shapes.length).toBeGreaterThan(0);
      r.shapes.forEach(s => {
        expect(['ellipse', 'rect']).toContain(s.kind);
      });
    });
  });
  it('front regions tag view=front, back regions tag view=back', () => {
    FRONT_REGIONS.forEach(r => expect(r.view).toBe('front'));
    BACK_REGIONS.forEach(r => expect(r.view).toBe('back'));
  });
});

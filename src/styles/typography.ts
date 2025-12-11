import { fonts } from './theme';

export const typography = {
  headingLg: { fontSize: 28, fontWeight: '900', fontFamily: fonts.family.base },
  headingMd: { fontSize: 24, fontWeight: '800', fontFamily: fonts.family.base },
  headingSm: { fontSize: 20, fontWeight: '700', fontFamily: fonts.family.base },
  body: { fontSize: 14, fontWeight: '400', fontFamily: fonts.family.base },
  bodyBold: { fontSize: 14, fontWeight: '700', fontFamily: fonts.family.base },
  caption: { fontSize: 12, fontWeight: '500', fontFamily: fonts.family.base },
  monoCaption: { fontSize: 12, fontWeight: '700', fontFamily: fonts.family.mono },
};

export type Typography = typeof typography;




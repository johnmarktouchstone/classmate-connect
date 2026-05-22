export type School = {
  slug: string;
  displayName: string;
  instagramUsername: string;
};

export const schools: School[] = [
  {
    slug: "acu2031",
    displayName: "ACU Class of 2031",
    instagramUsername: "@acuclassof2031"
  },
  {
    slug: "belmont2031",
    displayName: "Belmont Class of 2031",
    instagramUsername: "@belmontclassof2031"
  },
  {
    slug: "pepperdine2031",
    displayName: "Pepperdine Class of 2031",
    instagramUsername: "@pepperdineclassof2031"
  },
  {
    slug: "rutgers2031",
    displayName: "Rutgers Class of 2031",
    instagramUsername: "@rutgersclassof2031"
  }
];

export function getSchool(slug: string) {
  return schools.find((school) => school.slug === slug);
}

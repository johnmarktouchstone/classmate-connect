export type School = {
  slug: string;
  publicSlug: string;
  displayName: string;
  pageHeading: string;
  instagramUsername: string;
};

export const schools: School[] = [
  {
    slug: "acu2031",
    publicSlug: "acu",
    displayName: "ACU Class of 2031",
    pageHeading: "Abilene Christian University",
    instagramUsername: "@acuclassof2031"
  },
  {
    slug: "belmont2031",
    publicSlug: "belmont",
    displayName: "Belmont Class of 2031",
    pageHeading: "Belmont University",
    instagramUsername: "@belmontclassof2031"
  },
  {
    slug: "pepperdine2031",
    publicSlug: "pepperdine",
    displayName: "Pepperdine Class of 2031",
    pageHeading: "Pepperdine University",
    instagramUsername: "@pepperdineclassof2031"
  },
  {
    slug: "rutgers2031",
    publicSlug: "rutgers",
    displayName: "Rutgers Class of 2031",
    pageHeading: "Rutgers University",
    instagramUsername: "@rutgersclassof2031"
  },
  {
    slug: "washu2031",
    publicSlug: "washu",
    displayName: "WashU Class of 2031",
    pageHeading: "Washington University",
    instagramUsername: "@washuclassof2031"
  }
];

export function getSchool(slug: string) {
  return schools.find((school) => school.slug === slug);
}

export function getSchoolByPublicSlug(publicSlug: string) {
  return schools.find((school) => school.publicSlug === publicSlug);
}

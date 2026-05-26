export type School = {
  slug: string;
  publicSlug: string;
  displayName: string;
  pageHeading: string;
  instagramUsername: string;
  studentCount: number;
  initials: string;
  accentClass: string;
};

export const schools: School[] = [
  {
    slug: "acu2031",
    publicSlug: "acu",
    displayName: "ACU Class of 2031",
    pageHeading: "Abilene Christian University",
    instagramUsername: "@acuclassof2031",
    studentCount: 1245,
    initials: "ACU",
    accentClass: "from-violet-700 to-indigo-700"
  },
  {
    slug: "belmont2031",
    publicSlug: "belmont",
    displayName: "Belmont Class of 2031",
    pageHeading: "Belmont University",
    instagramUsername: "@belmontclassof2031",
    studentCount: 1087,
    initials: "BU",
    accentClass: "from-blue-950 to-blue-800"
  },
  {
    slug: "pepperdine2031",
    publicSlug: "pepperdine",
    displayName: "Pepperdine Class of 2031",
    pageHeading: "Pepperdine University",
    instagramUsername: "@pepperdineclassof2031",
    studentCount: 982,
    initials: "P",
    accentClass: "from-orange-500 to-amber-500"
  },
  {
    slug: "rutgers2031",
    publicSlug: "rutgers",
    displayName: "Rutgers Class of 2031",
    pageHeading: "Rutgers University",
    instagramUsername: "@rutgersclassof2031",
    studentCount: 2345,
    initials: "R",
    accentClass: "from-red-600 to-rose-600"
  },
  {
    slug: "washu2031",
    publicSlug: "washu",
    displayName: "WashU Class of 2031",
    pageHeading: "Washington University in St. Louis",
    instagramUsername: "@washuclassof2031",
    studentCount: 1156,
    initials: "W",
    accentClass: "from-emerald-800 to-teal-700"
  }
];

export function getSchool(slug: string) {
  return schools.find((school) => school.slug === slug);
}

export function getSchoolByPublicSlug(publicSlug: string) {
  return schools.find((school) => school.publicSlug === publicSlug);
}

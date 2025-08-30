// ------------------------------
// Data Models
// ------------------------------

export type PackageKey = "solo" | "live" | "legacy";

export const PACKAGES: Record<PackageKey, { name: string; price: number; unique: string[]; includes: string[]; }> = {
  solo: {
    name: "Tributestream Solo",
    price: 599,
    unique: ["DIY Livestream Kit"],
    includes: [
      "2 Hours of Broadcast Time",
      "Custom Link",
      "Complimentary Download (yours to keep)",
      "One Year Hosting (no auto‑renew)"
    ]
  },
  live: {
    name: "Tributestream Live",
    price: 1299,
    unique: ["Professional Videographer", "Professional Livestream Tech"],
    includes: [
      "2 Hours of Broadcast Time",
      "Custom Link",
      "Complimentary Download (yours to keep)",
      "One Year Hosting (no auto‑renew)"
    ]
  },
  legacy: {
    name: "Tributestream Legacy",
    price: 1599,
    unique: ["Video Editing", "Engraved USB Drive + Keepsake Box"],
    includes: [
      "2 Hours of Broadcast Time",
      "Custom Link",
      "Complimentary Download (yours to keep)",
      "One Year Hosting (no auto‑renew)"
    ]
  }
};
export const EmptyForm = {
	lovedOneName: '',
	memorialDate: '',
	memorialTime: '',
	locationName: '',
	locationAddress: '',
	website: ''
};

export const RATES = {
  extraHour: 125,
  extraDaySetup: 150,
  editing: 250,
  usbBox: 129,
  extraVideographer: 300,
  extraTech: 250
};
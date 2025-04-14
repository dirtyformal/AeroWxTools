const example = {
  station: "NZAA",
  day: 14,
  hour: 8,
  minute: 0,
  message:
    "NZAA 140800Z 12003KT 9999 SCT070 17/15 Q1022 RMK AUTO VATSIM USE ONLY",
  remarks: [
    {
      type: "Unknown",
      raw: "AUTO VATSIM USE ONLY",
    },
  ],
  clouds: [
    {
      quantity: "SCT",
      height: 7000,
    },
  ],
  weatherConditions: [],
  trends: [],
  runwaysInfo: [],
  wind: {
    speed: 3,
    direction: "ESE",
    degrees: 120,
    unit: "KT",
  },
  visibility: {
    indicator: "P",
    value: 9999,
    unit: "m",
  },
  temperature: 17,
  dewPoint: 15,
  altimeter: {
    value: 1022,
    unit: "hPa",
  },
  remark: "AUTO VATSIM USE ONLY",
};

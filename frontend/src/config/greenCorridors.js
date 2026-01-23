export const GREEN_CORRIDORS = [
  {
    id: "GC_001",
    name: "Manjalpur to Fatehgunj Express",
    description: "South to North arterial corridor connecting key junctions.",
    junctions: ["J004", "J001", "J002", "J003"],
    direction: "SOUTH_NORTH",
    maxDurationMinutes: 20,
    allowed: true
  },
  {
    id: "GC_002",
    name: "Fatehgunj to Manjalpur Return",
    description: "North to South return corridor for city traffic.",
    junctions: ["J003", "J002", "J001", "J004"],
    direction: "NORTH_SOUTH",
    maxDurationMinutes: 20,
    allowed: true
  },
  {
    id: "GC_003",
    name: "Gotri to Alkapuri Link",
    description: "Western connector into the central business district.",
    junctions: ["J005", "J001"],
    direction: "WEST_EAST",
    maxDurationMinutes: 10,
    allowed: true
  }
];

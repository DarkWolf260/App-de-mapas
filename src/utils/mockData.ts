export interface Location {
  name: string;
  center: [number, number];
  zoom: number;
}

export const LOCATIONS: Record<string, Location> = {
  venezuela: {
    name: "Venezuela",
    center: [-66.9036, 10.4806],
    zoom: 12,
  },
};


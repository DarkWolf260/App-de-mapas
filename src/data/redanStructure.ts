export interface RedanRegion {
  name: string;
  states: string[];
}

export interface Campamento {
  id: string;
  name: string;
  officers: string;
}

export const REDAN_REGIONS: RedanRegion[] = [
  {
    name: "REDAN Capital",
    states: ["PC La Guaira", "PC Miranda", "PC Nacional"],
  },
  {
    name: "REDAN Los Llanos",
    states: ["PC Apure", "PC Barinas", "PC Guárico", "PC Cojedes", "PC Aragua", "PC Carabobo", "PC Portuguesa"],
  },
  {
    name: "REDAN Occidente",
    states: ["PC Lara", "PC Falcón", "PC Zulia"],
  },
  {
    name: "REDAN Los Andes",
    states: ["PC Mérida", "PC Trujillo", "PC Yaracuy", "PC Táchira"],
  },
  {
    name: "REDAN Oriente",
    states: ["PC Anzoátegui", "PC Sucre", "PC Monagas"],
  },
  {
    name: "REDAN Guayana",
    states: ["PC Amazonas", "PC Bolívar", "PC Delta Amacuro"],
  },
  {
    name: "REDAN Marítima",
    states: ["PC Nueva Esparta"],
  },
];

// Map ids used in the Compendium app to tech names used here
// Map string ids to numeric ids
export const ModuleMap: Record<string, number> = {
  RedStarScanner: 701,
  ShipmentRelay: 702,

  AllianceLevel: 801,

  Transport: 103,
  Miner: 102,
  Battleship: 101,

  TransportCapacity: 401,
  ShipmentComputer: 402,
  RemoteRepair: 413,
  Rush: 404,
  Stealth: 608,
  TradeBurst: 405,
  ShipmentDrone: 406,
  RedStarExtender: 603,
  RelicDrone: 412,
  Dispatch: 411,
  CargoRocket: 414,

  MiningBoost: 501,
  HydroReplicator: 511,
  ArtifactBoost: 512,
  MassMining: 504,
  Genesis: 508,
  Enrich: 503,
  Crunch: 507,
  HydrogenUpload: 505,
  HydroRocket: 510,
  BlastDrone: 513,

  Laser: 203,
  MassBattery: 204,
  Battery: 202,
  DualLaser: 205,
  Barrage: 206,
  DartLauncher: 207,
  ChainRay: 208,
  PlayerRocketLauncher: 209,
  Pulse: 210,

  AlphaShield: 301,
  ImpulseShield: 302,
  PassiveShield: 303,
  OmegaShield: 304,
  BlastShield: 306,
  MirrorShield: 305,
  AreaShield: 307,
  MotionShield: 308,

  EMP: 601,
  Solitude: 625,
  Fortify: 609,
  Teleport: 602,
  DamageAmplifier: 626,
  Destiny: 614,
  Barrier: 615,
  Vengeance: 616,
  DeltaRocket: 617,
  Leap: 618,
  Bond: 619,
  Suspend: 622,
  OmegaRocket: 621,
  RemoteBomb: 623,

  DecoyDrone: 901,
  RepairDrone: 902,
  RocketDrone: 904,
  LaserTurret: 624,
  ChainRayDrone: 905,
  DeltaDrones: 906,
  DroneSquad: 907,
};
/*
const types: Record<string, number> = {
  rs: 701,
  shipmentrelay: 702,

  corplevel: 801,

  transp: 103,
  miner: 102,
  bs: 101,

  cargobay: 401,
  computer: 402,
  RemoteRepair: 413, // DN
  rush: 404,
  stealth: 608, // DN - transport only
  tradeburst: 405,
  shipdrone: 406,
  rsextender: 603,
  relicdrone: 412,
  dispatch: 411,
  cargorocket: 414,

  // tradeboost: 403, // Deprecated
  // offload: 407, // deprecated
  // beam: 408, // deprecated
  // entrust: 409, // deprecated
  // recall: 410, // deprecated

  miningboost: 501,
  hydroreplicator: 511, // DN
  artifactboost: 512, // DN
  remote: 504,
  genesis: 508,
  enrich: 503,
  crunch: 507,
  hydroupload: 505,
  hydrorocket: 510,
  blastdrone: 513, // DN
  // hydrobay: 502, // Deprecated
  //  miningunity: 506, // Deprecated
  //  minedrone: 509, // Deprecated

  laser: 203,
  mass: 204,
  battery: 202,
  dual: 205,
  barrage: 206,
  dart: 207,
  chainray: 208, // DN
  rocketLauncher: 209, // DN
  pulse: 210, // DN

  alpha: 301,
  delta: 302, // impulse shield
  passive: 303, // regenerating shield
  omega: 304,
  blast: 306,
  mirror: 305,
  area: 307, // ally shield
  motionshield: 308, // DN

  emp: 601,
  solittude: 625, // DN
  fortify: 609,
  teleport: 602,
  damageamplifier: 626,
  destiny: 614,
  barrier: 615,
  vengeance: 616,
  deltarocket: 617,
  leap: 618,
  bond: 619,
  suspend: 622,
  omegarocket: 621,
  remotebomb: 623,
  // repair: 604, // Deprecated
  // warp: 605, // Deprecated
  // unity: 606, // Deprecated
  // sanctuary: 607, // Deprecated
  // impulse: 610, // Deprecated
  // rocket: 611, // deprecated
  // salvage: 612, // deprecated
  // suppress: 613, // Deprecated
  // alphadrone: 620, // Deprecated

  // Drones
  decoydrone: 901, // DN
  repairdrone: 902, // DN
  rocketdrone: 904, // DN
  laserturret: 624,
  chainrayturret: 905, // DN
  deltadrone: 906, // DN
  dronesquad: 907, // DN
};
*/

let inverted_data: Record<number, string> = {};
let inverted_data_initialized = false;

export function getTechIndex(tech: string): number {
  if (Object.prototype.hasOwnProperty.call(ModuleMap, tech)) {
    return ModuleMap[tech];
  } else {
    return 0;
  }
}

function checkInvert() {
  if (!inverted_data_initialized) {
    inverted_data = Object.fromEntries(Object.entries(ModuleMap).map((e) => [e[1], e[0]]));
    inverted_data_initialized = true;
  }
}

export function getTechFromIndex(index: number) {
  checkInvert();
  if (Object.prototype.hasOwnProperty.call(inverted_data, index)) {
    return inverted_data[index];
  } else {
    return "";
  }
}

export function getTypes(): Record<string, number> {
  return ModuleMap;
}

export function getInvertedTypes(): Record<number, string> {
  checkInvert();
  return inverted_data;
}

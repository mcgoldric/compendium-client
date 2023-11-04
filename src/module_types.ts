// Map ids used in the Compendium app to tech names used here
// Map string ids to numeric ids
// This needs to be updated for DN
const types: Record<string, number> = {
  rs: 701,
  shipmentrelay: 702,

  corplevel: 801,

  transp: 103,
  miner: 102,
  bs: 101,

  cargobay: 401,
  computer: 402,
  tradeboost: 403,
  rush: 404,
  tradeburst: 405,
  shipdrone: 406,
  offload: 407,
  beam: 408,
  entrust: 409,
  recall: 410,
  dispatch: 411,
  relicdrone: 412,

  miningboost: 501,
  hydrobay: 502,
  enrich: 503,
  remote: 504,
  hydroupload: 505,
  miningunity: 506,
  crunch: 507,
  genesis: 508,
  minedrone: 509,
  hydrorocket: 510,

  battery: 202,
  laser: 203,
  mass: 204,
  dual: 205,
  barrage: 206,
  dart: 207,

  alpha: 301,
  delta: 302,
  passive: 303,
  omega: 304,
  mirror: 305,
  blast: 306,
  area: 307,

  emp: 601,
  teleport: 602,
  rsextender: 603,
  repair: 604,
  warp: 605,
  unity: 606,
  sanctuary: 607,
  stealth: 608,
  fortify: 609,
  impulse: 610,
  rocket: 611,
  salvage: 612,
  suppress: 613,
  destiny: 614,
  barrier: 615,
  vengeance: 616,
  deltarocket: 617,
  leap: 618,
  bond: 619,
  alphadrone: 620,
  omegarocket: 621,
  suspend: 622,
  remotebomb: 623,
  laserturret: 624,
};

let inverted_data: Record<number, string> = {};
let inverted_data_initialized = false;

export function getTechIndex(tech: string): number {
  if (Object.prototype.hasOwnProperty.call(types, tech)) {
    return types[tech];
  } else {
    return 0;
  }
}

function checkInvert() {
  if (!inverted_data_initialized) {
    inverted_data = Object.fromEntries(Object.entries(types).map((e) => [e[1], e[0]]));
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
  return types;
}

export function getInvertedTypes(): Record<number, string> {
  checkInvert();
  return inverted_data;
}

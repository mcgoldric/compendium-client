// import fetch from "cross-fetch";

export type Guild = {
  url: string; // guild image url
  id: string; // guild id
  name: string; // guild name
  icon: string; // guild icon id
};

export type User = {
  id: string; // User id
  username: string;
  discriminator: string; // No longer used
  avatar: string; // avatar id
  avatarUrl: string; // avatar image url for user
};

export type Identity = {
  user: User;
  guild: Guild;
  token: string;
};

export type CorpMember = {
  name: string;
  userId: string;
  clientUserId: string;
  avatar: string | null;
  // Tech is keyed on ids in module_types.
  // Each is an array - a[0] = level, a[1] = ws score
  tech: Record<number, Array<number>>;
  avatarUrl: string | null;
  timeZone: string | null;
  localTime: string | null;
  zoneOffset: number | null; // TZ offset in minutes
  afkFor: string | null; // readable afk duration
  afkWhen: number | null; // Unix Epoch when user returns
};

export type CorpRole = {
  id: string;
  name: string;
};

export type CorpData = {
  members: Array<CorpMember>;
  roles: Array<CorpRole>;
  filterId: string | null; // Current filter roleId
  filterName: string | null; // Name of current filter roleId
};

export type TechLevel = {
  level: number; // Current level
  ts: number; // Last sync timestamp
};

// Tech levels are indexed on the numeric ids found in module_types
export type TechLevels = Record<number, TechLevel>;

export type SyncData = {
  ver: number; // for now, 1
  inSync: number; // for now 1,
  techLevels: TechLevels;
};

export class CompendiumApiClient {
  constructor(private url: string = "https://bot.hs-compendium.com/compendium") {}

  /*
    Given a code from the bot %connect command (which has the format /[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}/)
    This validates the code and returns a token and identity. The app should confim the identity with the user
    which can include a display with the user and guild names and icons.
    The token returned here is only used for the connect endpoint, which returns a new token.
   */
  public async checkIdentity(code: string): Promise<Identity> {
    const rv = await fetch(`${this.url}/applink/identities?ver=2&code=1`, {
      cache: "no-cache",
      headers: {
        Authorization: code,
      },
    });
    if (rv.status < 200 || rv.status >= 500) {
      throw new Error("Server Error");
    }
    const obj = await rv.json();
    if (rv.status >= 400) {
      throw new Error(obj.error);
    }
    // Massage image urls
    // icons/guild_id/guild_icon.png *
    return {
      user: {
        ...obj.user,
        avatarUrl: `https://cdn.discordapp.com/icons/${obj.guilds[0].id}/${obj.guilds[0].icon}.png`,
      },
      guild: { ...obj.guilds[0], url: `https://cdn.discordapp.com/avatars/${obj.user.id}/${obj.user.avatar}.png` },
      token: obj.token,
    };
  }

  /*
  After confirming the identity to with the user, get a connection token and identity
  here. The identity struct here should be saved. It can be used for display, and the token
  is used in subsequent calls. A successful connect should be followed by a sync command. If user data 
  is cached in the absence of a connection the user should have an option of how to sync current data.
  (Options are Get, Set, and Sync)
  If data is not cached (most likely in a web app) then a sync with GET should be executed to get the
  current data.
  */
  public async connect(identity: Identity): Promise<Identity> {
    const rv = await fetch(`${this.url}/applink/connect`, {
      method: "POST",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
        Authorization: identity.token,
      },
      body: JSON.stringify({ guild_id: identity.guild.id }),
    });
    if (rv.status < 200 || rv.status >= 500) {
      throw new Error("Server Error");
    }
    const obj = await rv.json();
    if (rv.status >= 400) {
      throw new Error(obj.error);
    }
    return {
      user: obj.user,
      guild: { ...obj.guild, url: `https://cdn.discordapp.com/avatars/${obj.user.id}/${obj.user.avatar}.png` },
      token: obj.token,
    };
  }

  /*
   Given an active connection, this endpoint will refresh the token (to avoid expiration).
   The returned value should replace the existing Identity.
   The connection token has a lifetime of 365 days. A client app can track the 
   connection time and refresh before a year is up.
   */
  public async refreshConnection(token: string): Promise<Identity> {
    const rv = await fetch(`${this.url}/applink/refresh`, {
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });
    if (rv.status < 200 || rv.status >= 500) {
      throw new Error("Server Error");
    }
    const obj = await rv.json();
    if (rv.status >= 400) {
      throw new Error(obj.error);
    }
    return {
      user: obj.user,
      guild: { ...obj.guild, url: `https://cdn.discordapp.com/avatars/${obj.user.id}/${obj.user.avatar}.png` },
      token: obj.token,
    };
  }

  /* 
  Returns various data for all member sin the corp, optionally filtered by a role. 
  This can be cached for short periods of time as long as the role doesn't change to reduce round trips,
  since it returns all of teh data each call.
  UI Should present a way to select which data element to display for each user, and then do so. 
  This can be a module, or afk, local time, rs level, etc
  */
  public async corpdata(token: string, roleId?: string | null | undefined): Promise<CorpData> {
    roleId = roleId ?? "";
    const rv = await fetch(`${this.url}/cmd/corpdata?roleId=${roleId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });
    if (rv.status < 200 || rv.status >= 500) {
      throw new Error("Server Error");
    }
    const obj = await rv.json();
    if (rv.status >= 400) {
      throw new Error(obj.error);
    }
    return obj;
  }

  /*
  Synchronize tech levels with the bot. Mode determines action:
  get: Retrieve levels from the server to replace any stored locally, ie on new connection
  set: Set the bot values from the app, overwriting all values in the bot
  sync: Synchronize values - combine values from bot and app, using values with the greater timestamp

  To set a value from the app, collect the new value from the user and update the techLevels data structure with
  the new value and a current timestamp, and then call sync in "sync" mode and passing the resulting 
  TechLevels structure.

  The techlevels can be persisted alongside the Identity, in localStorage for example.
  When app is initialized and there is existing data, sync should be called in sync mode with the persisted 
  data to get the most recent synchronized data.
  */
  public async sync(token: string, mode: string, currentTech: TechLevels = {}): Promise<SyncData> {
    if (!["get", "set", "sync"].includes(mode)) {
      throw new Error(`Invalid sync mode ${mode}`);
    }
    if (mode === "get") {
      currentTech = {};
    }
    const rv = await fetch(`${this.url}/cmd/syncTech/${mode}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ ver: 1, techLevels: currentTech }),
    });
    if (rv.status < 200 || rv.status >= 500) {
      throw new Error("Server Error");
    }
    const obj = await rv.json();
    if (rv.status >= 400) {
      throw new Error(obj.error);
    }
    return obj;
  }
}

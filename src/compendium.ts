import EventEmitter from "events";
import { CompendiumApiClient, CorpData, Guild, Identity, SyncData, TechLevels, User } from "./bot_api";
import { getTechFromIndex } from "./module_types";

/* 
This class encapsulates the bot api functionality with persistence in 
local storage and provides a simpler interface for front ends.
*/
const REFRESH_MS = 5 * 60 * 1000;

const STORAGE_KEY = "hscompendium";

type StorageData = {
  ident: Identity;
  userData: SyncData;
  refresh: number;
  tokenRefresh: number;
};

export class Compendium extends EventEmitter {
  public client: CompendiumApiClient;
  private ident: Identity | null = null;
  private lastRefresh: number = 0;
  private lastTokenRefresh: number = 0;
  private syncData: SyncData | null = null;
  private timer: any = null;

  constructor(url: string = "https://bot.hs-compendium.com/compendium") {
    super();
    this.client = new CompendiumApiClient(url);
  }

  public getUser(): User | undefined {
    return this.ident?.user;
  }
  public getGuild(): Guild | undefined {
    return this.ident?.guild;
  }
  public getTechLevels(): TechLevels | undefined {
    return this.syncData?.techLevels;
  }

  /*
  Initialize the local data. If we have a valid connection, refresh the data
  */
  public async initialize() {
    this.ident = null;
    const ident = this.readStorage();
    if (ident) {
      if (!this.syncData || Object.entries(this.syncData.techLevels).length === 0) {
        await this.syncUserData("get");
      } else {
        await this.syncUserData("sync");
      }
      this.emit("connected", this.ident);
    }
    this.timer = setInterval(() => this.tick(), REFRESH_MS);
  }

  public shutdown() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /*
  Get the code based identity - this should be presented to user to verify, and the value passed to connect()
  to make the connection
  */
  public async checkConnectCode(code: string): Promise<Identity> {
    return this.client.checkIdentity(code);
  }

  public async connect(ident: Identity): Promise<Identity> {
    this.clearData();
    this.ident = await this.client.connect(ident);
    this.emit("connected", this.ident);

    this.lastTokenRefresh = Date.now();
    this.writeStorage();

    await this.syncUserData("get");
    return this.ident;
  }

  public logout() {
    this.emit("disconnected");
    this.clearData();
  }

  public async corpdata(roleId?: string | null | undefined): Promise<CorpData> {
    if (!this.ident) {
      throw new Error("not connected");
    }

    return this.client.corpdata(this.ident?.token, roleId);
  }

  public async setTechLevel(techId: number, level: number): Promise<void> {
    if (!this.ident) {
      throw new Error("not connected");
    }
    if (getTechFromIndex(techId) === "") {
      throw new Error("Invalid tech id");
    }

    if (!this.syncData) {
      this.syncData = { ver: 1, inSync: 1, techLevels: {} };
    }
    this.syncData.techLevels[techId] = { level, ts: Date.now() };
    await this.syncUserData("sync");
  }

  private writeStorage() {
    if (!this.ident) {
      return;
    }
    const data: StorageData = {
      ident: this.ident,
      userData: this.syncData ?? { ver: 1, inSync: 1, techLevels: {} },
      refresh: this.lastRefresh,
      tokenRefresh: this.lastTokenRefresh,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  private readStorage(): Identity | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    // Validate identity. Reasonable defaults elsewhere
    if (!raw) {
      this.clearData();
      return null;
    } else {
      try {
        const stored = JSON.parse(raw);
        if (stored && stored.ident) {
          this.ident = stored.ident;
          this.syncData = stored.syncData ?? { ver: 1, inSync: 1, techLevels: {} };
          this.lastRefresh = Number(stored.refresh ?? 0);
          this.lastTokenRefresh = Number(stored.lastTokenRefresh ?? 0);
          return this.ident;
        } else {
          throw new Error("Data corrupt");
        }
      } catch (e) {
        // if there was data and it failed to parse, emit a connectfailed
        this.clearData();
        this.emit("connectfailed", (e as Error).message);
        return null;
      }
    }
  }

  private clearData() {
    localStorage.removeItem(STORAGE_KEY);
    this.ident = null;
    this.lastTokenRefresh = 0;
    this.lastRefresh = 0;
    this.syncData = null;
  }

  private async syncUserData(mode: string) {
    if (!this.ident || (mode !== "get" && !this.syncData)) {
      throw new Error("Cannot sync user data - not connected");
    }
    this.syncData = await this.client.sync(this.ident.token, mode, this.syncData?.techLevels ?? {});
    this.lastRefresh = Date.now();
    this.writeStorage();
    this.emit("sync", this.syncData.techLevels);
  }

  private async tick() {
    if (this.ident) {
      if (Date.now() - this.lastTokenRefresh > 7776000000) {
        // three months - this is unlikely to occur in a browser environment
        // but may occur in a hybrid mobile app
        try {
          this.ident = await this.client.refreshConnection(this.ident.token);
          this.lastTokenRefresh = Date.now();
          this.writeStorage();
        } catch (e) {
          this.clearData();
          this.emit("connectfailed", (e as Error).message);
          throw e;
        }
      }
      if (Date.now() - this.lastRefresh > REFRESH_MS) {
        await this.syncUserData("sync");
      }
    }
  }
}

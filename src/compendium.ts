import EventEmitter from "events";
import { CompendiumApiClient, CorpData, Guild, Identity, SyncData, TechLevels, User } from "./bot_api";
import { getTechFromIndex } from "./module_types";

/* 
This class encapsulates the bot api functionality with persistence in 
local storage and provides a simpler interface for front ends.
*/
const REFRESH_MS = 5 * 60 * 1000;

const IDENTITY_KEY = "hscompendium-identity";
const USERDATA_KEY = "hscompendium-userdata";
const REFRESH_KEY = "hscompendium-refreshed";
const TOKEN_REFRESH = "hscompendium_tokenrefresh";

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
    const identity = localStorage.getItem(IDENTITY_KEY);
    if (!identity) {
      this.clearData();
    } else {
      try {
        const ident = JSON.parse(identity);
        if (ident) {
          this.ident = await this.client.refreshConnection(ident.token);
          this.lastRefresh = Number(localStorage.getItem(REFRESH_KEY) ?? 0);
          this.lastTokenRefresh = Number(localStorage.getItem(TOKEN_REFRESH) ?? 0);
          this.emit("connected", this.ident);
          const syncData = localStorage.getItem(USERDATA_KEY);
          if (syncData) {
            try {
              this.syncData = JSON.parse(syncData);
            } catch (_e) {
              this.syncData = null;
            }
          }
          if (!this.syncData) {
            await this.syncUserData("get");
          } else {
            await this.syncUserData("sync");
          }
        }
      } catch (e) {
        this.clearData();
        this.emit("connectfailed", (e as Error).message);
        throw e;
      }
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

    localStorage.setItem(IDENTITY_KEY, JSON.stringify(this.ident));
    this.lastTokenRefresh = Date.now();
    localStorage.setItem(TOKEN_REFRESH, this.lastTokenRefresh.toString());

    this.syncUserData("get");
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

  private clearData() {
    localStorage.removeItem(IDENTITY_KEY);
    localStorage.removeItem(USERDATA_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(TOKEN_REFRESH);
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
    localStorage.setItem(USERDATA_KEY, JSON.stringify(this.syncData));
    this.lastRefresh = Date.now();
    localStorage.setItem(REFRESH_KEY, this.lastRefresh.toString());
    this.emit("sync", this.syncData.techLevels);
  }

  private async tick() {
    if (this.ident) {
      if (Date.now() - this.lastTokenRefresh > 7776000000) {
        // three months - this is unlikely to occur in a browser environment
        // but may occur in a hybrid mobile app
        try {
          this.ident = await this.client.refreshConnection(this.ident.token);
          localStorage.setItem(IDENTITY_KEY, JSON.stringify(this.ident));
          this.lastTokenRefresh = Date.now();
          localStorage.setItem(TOKEN_REFRESH, this.lastTokenRefresh.toString());
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

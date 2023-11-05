import "cross-fetch/polyfill";

import { LocalStorage } from "node-localstorage";
import { Compendium } from "..";
import { Identity, TechLevels } from "..";
import path from "path";

global.localStorage = new LocalStorage(path.resolve(__dirname, "local-storage"));

// Run this once with a code from the %connect command on the command line to establish a connection
async function main() {
  // Catch and report events
  const client = new Compendium();

  client.on("connected", (ident: Identity) => {
    console.log(`Connected: ${ident.user.username}, Guild: ${ident.guild.name}`);
  });
  client.on("connectfailed", (e: string) => {
    console.log(`Connect failed: ${e}`);
  });
  client.on("disconnected", (e: string) => {
    console.log(`Disconnected`);
  });
  client.on("sync", (tl: TechLevels) => {
    console.log(`Tech Levels synced: rs=${tl[701].level}`);
  });

  await client.initialize();
  if (process.argv.length > 2) {
    const code = process.argv[2];
    try {
      const ident = await client.checkConnectCode(code);
      console.log(
        `Successfully submitted code and retrieved identity:\nUser: ${ident.user.username}\nGuild: ${ident.guild.name})`
      );
      const connectedIdent = await client.connect(ident);
      console.log(`Successfully connected:\nUser: ${ident.user.username}\nGuild: ${ident.guild.name})`);
    } catch (e) {
      console.error(e);
      return;
    }
  }
  const tl = client.getTechLevels();
  if (tl) {
    console.log(tl[701]);
  }
  await client.setTechLevel(701, 4);

  // Compendium also supports corpdata with an optional role (corpdata returns the list of available roles)
  // const cd = await client.corpdata();
  // console.log(cd);
  client.shutdown();
}
main().then(() => console.log("DONE"));

import "cross-fetch/polyfill";

import { CompendiumApiClient, Identity } from "..";
import * as fs from "node:fs/promises";
import path from "path";

// run this with npx ts-node test/connect <code> where code is the code from the %connect command

async function main() {
  const code = process.argv[process.argv.length - 1];

  const client = new CompendiumApiClient();

  const preConnectIdent = await client.checkIdentity(code);
  console.log(
    `Successfully submitted code and retrieved identity:\nUser: ${preConnectIdent.user.username}\nGuild: ${preConnectIdent.guild.name})`
  );

  // App confirms identity and guild with user, then connects:
  const ident = await client.connect(preConnectIdent);
  console.log(`Successfully connected:\nUser: ${ident.user.username}\nGuild: ${ident.guild.name})`);
  // User can periodically refresh the connection
  const _refresh = await client.refreshConnection(ident.token);
  console.log("Successfully refreshed connection");

  // Save the connection info
  await fs.writeFile(path.resolve(__dirname, "identity.json"), JSON.stringify(ident));
  const data = await client.sync(ident.token, "get");
  console.log(JSON.stringify(data, null, 3));
}

main().then(() => console.log("DONE"));

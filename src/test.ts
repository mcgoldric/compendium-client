import { CompendiumApiClient, Identity } from "./bot_api";

async function main() {
  const client = new CompendiumApiClient();
  // User gets code from %connect command
  // const code = "Wjan-sACb-krNB";

  // App submits the code
  // const preConnectIdent = await client.checkIdentity(code);

  // App confirms identity and guild with user, then connects:
  // const ident = await client.connect(preConnectIdent);

  // User can periodically refresh the connection
  // const rv = await client.refreshConnection(ident.token);

  // Retrieve corp data optionally filtered by Role
  //   const rv = await client.corpdata(ident.token, null);
  const rv = await client.sync(ident.token, "get");
  console.log(JSON.stringify(rv, null, 3));
}

main().then(() => console.log("DONE"));

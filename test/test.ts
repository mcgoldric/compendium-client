import "cross-fetch/polyfill";
import { CompendiumApiClient } from "..";
import * as fs from "node:fs/promises";
import path from "path";

async function main() {
  // Load existing identity
  const ident = JSON.parse((await fs.readFile(path.resolve(__dirname, "identity.json"))).toString());
  const client = new CompendiumApiClient();

  //   const rv = await client.corpdata(ident.token, null);

  const rv = await client.sync(ident.token, "get");
  console.log(JSON.stringify(rv, null, 3));
}

main().then(() => console.log("DONE"));

import { loadStdlib, ask } from "@reach-sh/stdlib";
import * as backend from "./build/index.main.mjs";

if (
  process.argv.length < 3 ||
  ["Alice", "Bob"].includes(process.argv[2]) == false
) {
  console.log("Usage: reach run index [Alice|Bob]");
  process.exit(0);
}
const role = process.argv[2];
const reach = loadStdlib(process.env);
console.log(`You are the ${role}`);

const startingBalance = (amount) => reach.parseCurrency(amount);

const getBalance = async (account) => {
  console.log(
    `Your balance`,
    reach.formatCurrency(await reach.balanceOf(account))
  );
};
const inherit = {
  alert: (count) => {
    console.log("Timeout at ", count);
  },
  seeResult: (outcome) => {
    console.log(outcome ? "Inherited" : "Not inherited");
  },
};
const ALICE = async () => {
  const acc = await reach.newTestAccount(startingBalance(6000));
  getBalance(acc);
  const ctc = acc.contract(backend);
  try {
    await Promise.all([
      backend.Alice(ctc, {
        ...inherit,
        contractReady: async () => {
          console.log(`Contract info: ${JSON.stringify(await ctc.getInfo())}`);
        },
        isSwitchOn: async () => {
          const arr = ["Yes, i'm not ready", "no, let them have it"];
          const ans = await ask.ask("Keep inheritance???", ask.yesno);
          console.log(`${arr[ans ? 0 : 1]}`);
          return ans;
        },
      }),
    ]);
  } catch (err) {
    console.log(err);
  }
  await getBalance(acc);
  ask.done();
};
const BOB = async () => {
  const acc = await reach.newTestAccount(startingBalance(100));
  getBalance(acc);
  const ctcInfo = await ask.ask("Paste contract ctcInfo:", (s) =>
    JSON.parse(s)
  );
  const ctc = acc.contract(backend, ctcInfo);
  try {
    await Promise.all([
      backend.Bob(ctc, {
        ...inherit,
        doYouAccept: async () => {
          const terms = ["Yes i accept  the terms", "i refuse "];
          const ans = await ask.ask("Do you accept the terms Bob? ", ask.yesno);
          console.log(terms[ans ? 0 : 1]);
          console.log(`${ans}`);
          return ans;
        },
      }),
    ]);
  } catch (error) {
    console.log(error);
  }
  await getBalance(acc);
  ask.done();
};

role == "Alice" ? ALICE() : BOB();

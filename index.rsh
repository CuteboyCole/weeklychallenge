"reach 0.1";
const shared = {
  alert: Fun([UInt], Null),
  seeResult: Fun([Bool], Null),
};
const amt = 5000000000;
const count = 10;
export const main = Reach.App(() => {
  const A = Participant("Alice", {
    contractReady: Fun([], Null),
    isSwitchOn: Fun([], Bool),
    ...shared,
  });
  const B = Participant("Bob", {
    doYouAccept: Fun([], Bool),
    ...shared,
  });

  init();
  const informTimeout = () => {
    each([A, B], () => {
      interact.alert(count);
    });
  };

  A.publish().pay(amt);
  A.interact.contractReady();
  commit();

  B.only(() => {
    const contractTerms = declassify(interact.doYouAccept());
  });
  B.publish(contractTerms).timeout(relativeTime(count), () =>
    closeTo(A, informTimeout)
  );

  var [countTime, isSwitchTrue] = [count + lastConsensusTime(), false];
  invariant(balance() == amt);
  while (lastConsensusTime() < countTime) {
    commit();
    A.only(() => {
      const val = declassify(interact.isSwitchOn());
      const terminate = !val;
    });
    A.publish(terminate).timeout(relativeTime(count), () =>
      closeTo(B, informTimeout)
    );
    each([B, A], () => {
      interact.seeResult(terminate);
    });
    const ctcTimeLEft = !terminate
      ? lastConsensusTime() + count
      : lastConsensusTime();

    [countTime, isSwitchTrue] = [ctcTimeLEft, terminate];
    continue;
  }

  transfer(balance()).to(!isSwitchTrue ? A : B);
  commit();

  // write your program here
  exit();
});

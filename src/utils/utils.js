async function waitForEvent(contract, filter) {
  return new Promise((resolve, reject) => {
    contract.once(filter, function(...args) {
      resolve(args);
    });
  });
}

async function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export { waitForEvent, sleep };

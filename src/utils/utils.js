async function waitForEvent(contract, filter) {
  return new Promise((resolve, reject) => {
    contract.once(filter, function(...args) {
      resolve(args);
    });
  });
}

export { waitForEvent };

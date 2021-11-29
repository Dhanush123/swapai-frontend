import React, { useState, useEffect } from 'react';

import { ethers } from 'ethers';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Typography from "@mui/material/Typography";

import PriceFeedChart from './PriceFeedChart';

// import NavigationBar from './NavigationBar';
import GenericButton from './GenericButton';

import NoWalletDetected from './NoWalletDetected';
import ConnectWallet from './ConnectWallet';
import BlockchainLogsTable from './BlockchainLogsTable';

import SwapAIContract from '../utils/swapai-contract';

import ChainlinkPriceFeedAPI from '../utils/ChainlinkPriceFeedAPI';

import { PRICE_FEED_BTC_ADDRESS, BTC_DECIMALS } from '../utils/constants';

// list of network ids https://docs.metamask.io/guide/ethereum-provider.html#properties
const KOVAN_ID = '42';
const NETWORK_ERR_MSG = 'Please connect Metamask to Kovan';

function App() {
  const [walletAddress, setWalletAddress] = useState('');
  // const [txnError, setTxnError] = useState('');
  const [networkError, setNetworkError] = useState('');
  const [userRegistered, setUserRegistered] = useState(false);
  const [optInStatus, setOptInStatus] = useState(false);
  const [logs, setLogs] = useState([]);
  const [swapperContract, setSwapperContract] = useState(null);

  const [priceFeedData, setPriceFeedData] = useState([]);

  useEffect(() => {
    const priceFeedAPI = new ChainlinkPriceFeedAPI(PRICE_FEED_BTC_ADDRESS, BTC_DECIMALS);

    const fetchData = async () => {
      const data = await priceFeedAPI.fetchHistoricPrices(60 * 60 * 24 * 7);
      setPriceFeedData(data);
    };

    fetchData();
  }, []);

  async function connectWallet() {
    // Fetch the user's address
    const [userAddress] = await window.ethereum.request({ method: 'eth_requestAccounts' });

    // Check if the address is on Kovan testnet
    if (window.ethereum.networkVersion !== KOVAN_ID) {
      setNetworkError(NETWORK_ERR_MSG);
      return false;
    }

    // Save the user's address in our state
    setWalletAddress(userAddress);

    // Initialize the provider to initialize our contracts
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    // Initialize the swapping contract
    setSwapperContract(new SwapAIContract(provider));

    // We reinitialize it whenever the user changes their account.
    window.ethereum.on('accountsChanged', ([newAddress]) => {
      // `accountsChanged` event can be triggered with an undefined newAddress.
      // This happens when the user removes the Dapp from the 'Connected
      // list of sites allowed access to your addresses' (Metamask > Settings > Connections)
      // To avoid errors, we reset the dapp state
      if (newAddress === undefined)
        resetState();
      else
        setWalletAddress(newAddress);
    });

    // We reset the dapp state if the network is changed
    window.ethereum.on('chainChanged', resetState);

    return true;
  }

  function resetState() {
    setWalletAddress('');
    // setTxnError('');
    setNetworkError('');
    setUserRegistered(false);
    setOptInStatus(false);
    setLogs([]);
  }

  //////////////////////////
  // Contract interaction //
  //////////////////////////

  async function executeRegisterUser() {
    const { success, isNewUser } = await swapperContract.registerUser();

    setUserRegistered(success);
    setLogs([
      ...logs,
      [
        `User registration status: ${success ? 'success' : 'failure'}`,
        `User account is ${isNewUser ? 'new' : 'existing'}`
      ].join('\n')
    ]);
  }

  async function executeFetchUserBalance() {
    const {
      WBTC: wbtcBalance,
      TUSD: tusdBalance,
    } = await swapperContract.fetchUserBalance();

    setLogs([
      ...logs,
      [
        `TUSD Balance: ${tusdBalance}`,
        `WBTC Balance: ${wbtcBalance}`
      ].join('\n')
    ]);
  }

  async function executeSetOptInStatus(userOptedIn) {
    await swapperContract.setOptInStatus(userOptedIn);

    setOptInStatus(userOptedIn);
    setLogs([
      ...logs,
      `User has opted-${userOptedIn ? 'in' : 'out'} for auto-swapping`
    ]);
  }

  async function executeDepositTUSD() {
    const { oldBalance, newBalance } = await swapperContract.depositTUSD(10000);

    setLogs([
      ...logs,
      `TUSD Balance: ${oldBalance} -> ${newBalance} balance`,
    ]);
  }

  async function executeDepositWBTC() {
    const { oldBalance, newBalance } = await swapperContract.depositWBTC(10);

    setLogs([
      ...logs,
      `WBTC Balance: ${oldBalance} -> ${newBalance} balance`,
    ]);
  }

  async function executeManualSwapUserToWBTC() {
    const {
      WBTC: wbtcBalance, TUSD: tusdBalance
    } = await swapperContract.manualSwapUserToWBTC();

    setLogs([
      ...logs,
      [
        `TUSD Balance: ${tusdBalance.old} -> ${tusdBalance.new} balance`,
        `WBTC Balance: ${wbtcBalance.old} -> ${wbtcBalance.new} balance`,
      ].join('\n'),
    ]);
  }

  async function executeManualSwapUserToTUSD() {
    const {
      WBTC: wbtcBalance, TUSD: tusdBalance
    } = await swapperContract.manualSwapUserToTUSD();

    setLogs([
      ...logs,
      [
        `TUSD Balance: ${tusdBalance.old} -> ${tusdBalance.new} balance`,
        `WBTC Balance: ${wbtcBalance.old} -> ${wbtcBalance.new} balance`,
      ].join('\n'),
    ]);
  }

  async function executeFetchPredictionForecast() {
    const {
      btcPriceCurrent,
      btcPricePrediction,
      tusdAssets,
      tusdReserves,
      btcSentiment,
      isNegativeFuture,
      isPositiveFuture,
    } = await swapperContract.fetchPredictionForecast();

    setLogs([
      ...logs,
      [
        `BTC current price: ${btcPriceCurrent / (10 ** 8)}`,
        `BTC price in 24 hours: ${btcPricePrediction / (10 ** 8)}`,
        `TUSD asset:reserve ratio: ${(tusdAssets / tusdReserves).toFixed(2)}`,
        `BTC 24 hour sentiment: ${(btcSentiment / 100)}%`,
        `BTC very negative outlook prediction: ${isNegativeFuture}`,
        `BTC very positive outlook prediction: ${isPositiveFuture}`,
      ].join('\n'),
    ]);
  }

  // Ethereum wallets inject the window.ethereum object. If it hasn't been
  // injected, we instruct the user to install MetaMask.
  if (typeof window.ethereum === 'undefined') {
    return <NoWalletDetected />;
  }

  if (!walletAddress) {
    return (
      <ConnectWallet
        connectWallet={() => connectWallet()}
        networkError={networkError}
        dismiss={() => setNetworkError('')}
      />
    );
  }

  let optInStatusLabel = (userRegistered && optInStatus) ? 'Out of' : 'In to';

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={2} padding={4} sx={{ width: '100vw', height: '100vh' }}>
        <Grid item xs={8}>
          <Box sx={{ height: '100%', pb: 1 }}>
            <PriceFeedChart data={priceFeedData} height="500%" />
          </Box>
        </Grid>

        <Grid item xs={4} padding={1}>
          <Box sx={{ height: '50%' }}>
            <Typography variant="h5" component="div">
              Manage Account
            </Typography>

            <Stack direction="row">
              <Grid item xs={6}>
                <GenericButton
                  sx={{ width: '100%' }}
                  onClick={() => executeRegisterUser()}
                  label='Register Account'
                />
              </Grid>

              <Grid item xs={6}>
                <GenericButton
                  sx={{ width: '100%' }}
                  onClick={() => executeSetOptInStatus(!optInStatus)}
                  /*disabled={!userRegistered}*/
                  label={`Opt ${optInStatusLabel} auto swapping`}
                />
              </Grid>
            </Stack>

            <Typography variant="h5" component="div">
              Deposit Funds
            </Typography>

            <Stack direction="row">
              <Grid item xs={4}>
                <GenericButton
                  sx={{ width: '100%' }}
                  onClick={() => executeDepositTUSD()}
                  /*disabled={!userRegistered}*/
                  label='Deposit TUSD'
                />
              </Grid>

              <Grid item xs={4}>
                <GenericButton
                  sx={{ width: '100%' }}
                  onClick={() => executeDepositWBTC()}
                  /*disabled={!userRegistered}*/
                  label='Deposit WBTC'
                />
              </Grid>

              <Grid item xs={4}>
                <GenericButton
                  sx={{ width: '100%' }}
                  onClick={() => executeFetchUserBalance()}
                  /*disabled={!userRegistered}*/
                  label='Refresh Balance'
                />
              </Grid>
            </Stack>

            <Typography variant="h5" component="div">
              Swap Funds
            </Typography>

            <Stack direction="row">
              <Grid item xs={6}>
                <GenericButton
                  sx={{ width: '100%' }}
                  onClick={() => executeManualSwapUserToWBTC()}
                  /*disabled={!userRegistered}*/
                  label='Force Swap TUSD -> WBTC'
                />
              </Grid>

              <Grid item xs={6}>
                <GenericButton
                  sx={{ width: '100%' }}
                  onClick={() => executeManualSwapUserToTUSD()}
                  /*disabled={!userRegistered}*/
                  label='Force Swap WBTC -> TUSD'
                />
              </Grid>
            </Stack>

            <Typography variant="h5" component="div">
              Debug
            </Typography>

            <Stack direction="row">
              <Grid item xs={12}>
                <GenericButton
                  sx={{ width: '100%' }}
                  onClick={() => executeFetchPredictionForecast()}
                  /*disabled={!userRegistered}*/
                  label='Fetch Prediction Forecast'
                />
              </Grid>
            </Stack>
          </Box>

          <Box sx={{ maxHeight: '50%' }}>
            <BlockchainLogsTable logs={logs} />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default App;

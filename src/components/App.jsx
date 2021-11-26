import React from "react";

import { ethers } from "ethers";

import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";

import PriceChart from "./PriceChart";

// import NavigationBar from "./NavigationBar";
import GenericButton from "./GenericButton";

import NoWalletDetected from "./NoWalletDetected";
import ConnectWallet from "./ConnectWallet";
import BlockchainLogsTable from "./BlockchainLogsTable";

import SwapAIContract from "../utils/swapai-contract";

// list of network ids https://docs.metamask.io/guide/ethereum-provider.html#properties
const KOVAN_ID = "42";
const NETWORK_ERR_MSG = "Please connect Metamask to Kovan";

class App extends React.Component {
  constructor(props) {
    super(props);

    this.initialState = {
      selectedAddress: undefined,
      transactionError: undefined,
      networkError: undefined,
      userRegistered: false,
      optInStatus: false,
      logs: [],
    };

    this.state = this.initialState;
  }

  async connectWallet() {
    // Fetch the user's address
    const [userAddress] = await window.ethereum.request({ method: 'eth_requestAccounts' });

    // Check if the address is on Kovan testnet
    if (window.ethereum.networkVersion !== KOVAN_ID) {
      this.setState({
        networkError: NETWORK_ERR_MSG,
      });

      return false;
    }

    // Save the user's address in our state
    this.setState({ selectedAddress: userAddress });

    // Initialize the provider to initialize our contracts
    this.provider = new ethers.providers.Web3Provider(window.ethereum);

    // Initialize the swapping contract
    this.swapperContract = new SwapAIContract(this.provider);

    // We reinitialize it whenever the user changes their account.
    window.ethereum.on("accountsChanged", ([newAddress]) => {
      // `accountsChanged` event can be triggered with an undefined newAddress.
      // This happens when the user removes the Dapp from the "Connected
      // list of sites allowed access to your addresses" (Metamask > Settings > Connections)
      // To avoid errors, we reset the dapp state
      if (newAddress === undefined)
        this.resetState();
      else
        this.setState({ selectedAddress: newAddress });
    });

    // We reset the dapp state if the network is changed
    window.ethereum.on("chainChanged", () => {
      this.resetState();
    });

    return true;
  }

  dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  resetState() {
    this.setState(this.initialState);
  }

  //////////////////////////
  // Contract interaction //
  //////////////////////////

  async executeRegisterUser() {
    const { success, isNewUser } = await this.swapperContract.registerUser();

    this.setState((prevState) => ({
      userRegistered: success,
      logs: [
        ...prevState.logs,
        [
          `User registration status: ${success ? 'success' : 'failure'}`,
          `User account is ${isNewUser ? 'new' : 'existing'}`
        ].join('\n'),
      ],
    }));
  }

  async executeFetchUserBalance() {
    const {
      TUSD: tusdBalance,
      WBTC: wbtcBalance,
    } = await this.swapperContract.fetchUserBalance();

    this.setState((prevState) => ({
      logs: [
        ...prevState.logs,
        [
          `TUSD Balance: ${tusdBalance}`,
          `WBTC Balance: ${wbtcBalance}`
        ].join('\n'),
      ],
    }));
  }

  async executeSetOptInStatus(userOptedIn) {
    await this.swapperContract.setOptInStatus(userOptedIn);

    this.setState((prevState) => ({
      optInStatus: userOptedIn,
      logs: [
        ...prevState.logs,
        `User has opted-${userOptedIn ? 'in' : 'out'} for auto-swapping`,
      ],
    }));
  }

  async executeDepositTUSD() {
    const { oldBalance, newBalance } = await this.swapperContract.depositTUSD(10000);

    this.setState((prevState) => ({
      logs: [
        ...prevState.logs,
        `TUSD Balance: ${oldBalance} -> ${newBalance} balance`,
      ],
    }));
  }

  async executeDepositWBTC() {
    const { oldBalance, newBalance } = await this.swapperContract.depositWBTC(10);

    this.setState((prevState) => ({
      logs: [
        ...prevState.logs,
        `WBTC Balance: ${oldBalance} -> ${newBalance} balance`,
      ],
    }));
  }

  async executeManualSwapUserBalance(swapToTUSD) {
    const {
      // success, toTUSD,
      /*tusdRatio,*/ btcSentiment,
      btcPriceCurrent, btcPricePrediction,
      isNegativeFuture, isPositiveFuture
    } = await this.swapperContract.manualSwapUserBalance(swapToTUSD);

    this.setState((prevState) => ({
      logs: [
        ...prevState.logs,
        [
          // `TUSD asset/reserve ratio: ${tusdRatio}`,
          `BTC 24 hour sentiment: ${(btcSentiment / 100)}%`,
          `BTC current price: ${btcPriceCurrent / (10 ** 8)}`,
          `BTC price in 24 hours: ${btcPricePrediction / (10 ** 8)}`,
          `BTC very negative outlook prediction: ${isNegativeFuture}`,
          `BTC very positive outlook prediction: ${isPositiveFuture}`,
        ].join('\n'),
      ]
    }));
  }

  async updateSwapSingleUserBalance(coinSwapFrom, coinSwapTo) {
    let swapSingleUserBalanceStatusMap =
      await this.swapperContract.swapSingleUserBalance(coinSwapFrom, coinSwapTo);

    const [
      tusdRatio,
      btcSentiment,
      btcPriceCurrent,
      btcPricePrediction,
      isNegativeFuture,
      isPositiveFuture,
      user,
    ] = swapSingleUserBalanceStatusMap;

    let userMsg = `address: ${user[0]}, BTC balance: ${(
      user[1] /
      10 ** 8
    ).toFixed(2)}, TUSD balance: ${(user[2] / 10 ** 18).toFixed(2)}`; // TODO: show optInStatus later

    this.setState((prevState) => ({
      logs: [
        ...prevState.logs,
        `TUSD asset/reserve ratio: ${tusdRatio},\n
        BTC 24 hour sentiment in [negative, positive] range [-1,1]: ${btcSentiment},\n
        BTC current price: ${btcPriceCurrent},\n
        BTC price 24 hour prediction: ${btcPricePrediction},\n
        BTC very negative outlook prediction: ${isNegativeFuture},\n
        BTC very positive outlook prediction: ${isPositiveFuture},\n
        Swapped user data: ${userMsg}`,
      ],
    }));
  }

  render() {
    // Ethereum wallets inject the window.ethereum object. If it hasn't been
    // injected, we instruct the user to install MetaMask.
    if (typeof window.ethereum === 'undefined') {
      return <NoWalletDetected />;
    }

    if (!this.state.selectedAddress) {
      return (
        <ConnectWallet
          connectWallet={() => this.connectWallet()}
          networkError={this.state.networkError}
          dismiss={() => this.dismissNetworkError()}
        />
      );
    }

    let optInStatusLabel = (this.state.userRegistered && this.state.optInStatus) ? "Out of" : "In to";

    return (
      <div>
        <Box sx={{ flexGrow: 1 }}>
          <Grid container spacing={4} padding={4}>
            <Grid item xs={8}>
              <PriceChart />
              <BlockchainLogsTable logs={this.state.logs} />
            </Grid>

            <Grid item xs={4}>
              <GenericButton
                onClick={() => this.executeRegisterUser()}
                label="Register Account"
              />

              <GenericButton
                onClick={() => this.executeSetOptInStatus(!this.state.optInStatus)}
                /*disabled={!this.state.userRegistered}*/
                label={`Opt ${optInStatusLabel} automatic swapping`}
              />

              <GenericButton
                onClick={() => this.executeFetchUserBalance()}
                /*disabled={!this.state.userRegistered}*/
                label="Refresh Balance"
              />

              <GenericButton
                onClick={() => this.executeDepositTUSD()}
                /*disabled={!this.state.userRegistered}*/
                label="Deposit TUSD"
              />

              <GenericButton
                onClick={() => this.executeDepositWBTC()}
                /*disabled={!this.state.userRegistered}*/
                label="Deposit WBTC"
              />

              <GenericButton
                onClick={() => this.executeManualSwapUserBalance(false)}
                /*disabled={!(this.state.userRegistered)}*/
                label="Force Swap TUSD -> WBTC"
              />

              <GenericButton
                onClick={() => this.executeManualSwapUserBalance(true)}
                /*disabled={!(this.state.userRegistered)}*/
                label="Force Swap WBTC -> TUSD"
              />
            </Grid>
          </Grid>
        </Box>
      </div>
    );
  }
}

export default App;

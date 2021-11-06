import React from "react";

import { ethers } from "ethers";

// import SwapAIArtifact from "../contracts/SwapAI.json";
// import contractAddress from "../contracts/contract-address.json";

// import MockSwapAIArtifact from "../contracts/MockSwapAISwap.json";
// import mockContractAddress from "../contracts/mock-contract-address.json";

import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";

import Grid from '@material-ui/core/Grid';
import GenericButton from './GenericButton';

import Utils from '../Utils';

// list of network ids https://docs.metamask.io/guide/ethereum-provider.html#properties
const HARDHAT_NETWORK_ID = "31337";
const MAINNET_ID = "1";
const KOVAN_ID = "42";
const NETWORK_ERR_MSG = "Please connect Metamask to Localhost:8545, mainnet, or Kovan";

class App extends React.Component {
  constructor(props) {
    super(props);

    this.initialState = {
      selectedAddress: undefined,
      transactionError: undefined,
      networkError: undefined,
      optInStatus: false,
      blockchainMessages: [],
      utils: undefined
    };

    this.state = this.initialState;
  }

  async intializeEthers() {
    // We first initialize ethers by creating a provider using window.ethereum
    this.provider = new ethers.providers.Web3Provider(window.ethereum);
    // TODO: uncomment once created mock contract
    // if (window.ethereum.networkVersion === HARDHAT_NETWORK_ID) {
    //   this.swapAI = new ethers.Contract(
    //     mockContractAddress.MockSwapAI,
    //     MockSwapAIArtifact.abi,
    //     this.provider.getSigner(0)
    //   );
    // }
    if (window.ethereum.networkVersion === KOVAN_ID) {
      // TODO: uncomment once added contract abi to this repo
      // this.swapAI = new ethers.Contract(
      //   contractAddress.SwapAI,
      //   SwapAIArtifact.abi,
      //   this.provider.getSigner(0)
      // );
      // console.log("SwapAI Kovan address", contractAddress);
    }
    console.log("networkVersion", window.ethereum.networkVersion);
  }

  dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  async initialize(userAddress) {
    // This method initializes the dapp

    // We first store the user's address in the component's state
    this.setState({
      selectedAddress: userAddress,
    });

    // Then, we initialize ethers
    await this.intializeEthers();
  }

  async connectWallet() {
    //connects dapp to wallet when user clicks on connect wallet button

    const [selectedAddress] = await window.ethereum.enable();
    console.log("selectedAddress", selectedAddress);
    // Once we have the address, we can initialize the application.

    if (!this.checkNetwork()) {
      return;
    }

    this.initialize(selectedAddress);

    // We reinitialize it whenever the user changes their account.
    window.ethereum.on("accountsChanged", ([newAddress]) => {
      // `accountsChanged` event can be triggered with an undefined newAddress.
      // This happens when the user removes the Dapp from the "Connected
      // list of sites allowed access to your addresses" (Metamask > Settings > Connections)
      // To avoid errors, we reset the dapp state
      if (newAddress === undefined) {
        return this.resetState();
      }

      this.initialize(newAddress);
    });

    // We reset the dapp state if the network is changed
    window.ethereum.on("networkChanged", () => {
      this.resetState();
    });
  }

  // This method resets the state
  resetState() {
    this.setState(this.initialState);
  }

  // This method checks if Metamask selected network is Localhost:8545, mainnet, or Kovan
  checkNetwork() {
    if (
      window.ethereum.networkVersion === HARDHAT_NETWORK_ID ||
      window.ethereum.networkVersion === MAINNET_ID ||
      window.ethereum.networkVersion === KOVAN_ID
    ) {
      return true;
    }

    this.setState({
      networkError: NETWORK_ERR_MSG,
    });

    return false;
  }

  async updateCreateUser() {
    let createUserStatus = await this.state.utils.createUser();
    console.log("this.state.createUserStatus", this.state.createUserStatus);
    this.setState(prevState => ({
      blockchainMessages: [...prevState.blockchainMessages, `User added to app status: ${createUserStatus}`]
    }));
  }

  render() {
    // Ethereum wallets inject the window.ethereum object. If it hasn't been
    // injected, we instruct the user to install MetaMask.
    if (window.ethereum === undefined) {
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

    let optInStatusLabel = this.state.optInStatus ? 'Out of' : 'In to';

    return (
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          display: "inline-block",
        }}
      >
        <Grid container direction="row" justify="center" alignItems="center">
          <GenericButton
            onClick={() => this.updateCreateUser()}
            label="Register Account"
          />
          <GenericButton
            onClick={() => this.updateDepositState()}
            label="Refresh Deposits"
          />
          <GenericButton
            onClick={() => this.updateSwapStablecoinDeposit(false)}
            label="Force Swap TUSD -> WBTC"
          />
          <GenericButton
            onClick={() => this.updateSwapStablecoinDeposit(true)}
            label="FForce Swap TUSD -> WBTC"
          />
          <GenericButton
            onClick={() => this.updateOptInToggle()}
            label={`Opt ${optInStatusLabel} automatic swapping`}
          />
        </Grid>
      </div>
    );
  }
}

export default App;

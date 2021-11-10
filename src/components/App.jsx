import React from "react";

import { ethers } from "ethers";

// import MockSwapAIArtifact from "../contracts/MockSwapAISwap.json";
// import mockContractAddress from "../contracts/mock-contract-address.json";

import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";

import Grid from "@material-ui/core/Grid";
import GenericButton from "./GenericButton";

import { TUSD, WBTC } from "../Constants";
import Utils from "../Utils";
import BlockchainMessagesTable from "./BlockchainMessagesTable";

import SwapAIArtifact from "../contracts/SwapAI.json";
import contractAddress from "../contracts/contract-address.json";

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
      optInStatus: false,
      blockchainMessages: [],
      utils: undefined,
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
      this.swapAI = new ethers.Contract(
        contractAddress.SwapAI,
        SwapAIArtifact.abi,
        this.provider.getSigner(0)
      );
      console.log("SwapAI Kovan address", contractAddress);
    }
    console.log("networkVersion", window.ethereum.networkVersion);
    this.setState({
      utils: new Utils(this.swapAI, this.state.selectedAddress, this.provider),
    });
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
    if (window.ethereum.networkVersion === KOVAN_ID) {
      return true;
    }

    this.setState({
      networkError: NETWORK_ERR_MSG,
    });

    return false;
  }

  async updateCreateUser() {
    let createUserStatus = await this.state.utils.createUser();
    console.log(
      "updateCreateUser this.state.createUserStatus",
      this.state.createUserStatus
    );
    this.setState((prevState) => ({
      blockchainMessages: [
        ...prevState.blockchainMessages,
        `User registration status: ${createUserStatus}`,
      ],
    }));
  }

  async updateOptInToggle() {
    let newOptInStatus = await this.state.utils.optInToggle();
    this.setState({ optInStatus: newOptInStatus }, () => {
      console.log(
        "updateOptInToggle this.state.optInStatus",
        this.state.optInStatus
      );
      this.setState((prevState) => ({
        blockchainMessages: [
          ...prevState.blockchainMessages,
          `User opt-in status for auto-swapping TUSD <-> WBTC: ${this.state.optInStatus}`,
        ],
      }));
    });
  }

  async updateGetUserBalance() {
    let userBalanceResultMap = await this.state.utils.getUserBalance(
      this.state.selectedAddress
    );
    let tusdBalance = userBalanceResultMap[TUSD];
    let wbtcBalance = userBalanceResultMap[WBTC];
    this.setState((prevState) => ({
      blockchainMessages: [
        ...prevState.blockchainMessages,
        `${TUSD} balance: ${tusdBalance}, ${WBTC}: ${wbtcBalance}`,
      ],
    }));
  }

  async updateAddDeposit(coinNameToDeposit) {
    let addDepositResultMap = await this.state.utils.addDeposit(
      contractAddress.SwapAI,
      coinNameToDeposit
    );
    let oldBalance = addDepositResultMap["oldBalance"];
    let newBalance = addDepositResultMap["newBalance"];
    this.setState((prevState) => ({
      blockchainMessages: [
        ...prevState.blockchainMessages,
        `${coinNameToDeposit}: ${oldBalance} -> ${newBalance} balance`,
      ],
    }));
  }

  async updateSwapSingleUserBalance(coinSwapFrom, coinSwapTo) {
    // TODO: extract data from swapSingleUserBalanceSummary here + update state & log
    let swapSingleUserBalanceResult =
      await this.state.utils.swapSingleUserBalance(coinSwapFrom, coinSwapTo);
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

    let optInStatusLabel = this.state.optInStatus ? "Out of" : "In to";

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
          {/* <GenericButton
            onClick={() => this.updateOptInToggle()}
            label={`Opt ${optInStatusLabel} automatic swapping`}
          /> */}
          <GenericButton
            onClick={() => this.updateGetUserBalance()}
            label="Refresh Balance"
          />
          <GenericButton
            onClick={() => this.updateAddDeposit(TUSD)}
            label="Deposit TUSD"
          />
          <GenericButton
            onClick={() => this.updateAddDeposit(WBTC)}
            label="Deposit WBTC"
          />
          <GenericButton
            onClick={() => this.updateSwapDeposit(TUSD, WBTC)}
            label="Force Swap TUSD -> WBTC"
          />
          <GenericButton
            onClick={() => this.updateSwapDeposit(WBTC, TUSD)}
            label="Force Swap TUSD -> WBTC"
          />
        </Grid>
        <Grid container direction="row" justify="center" alignItems="center">
          <BlockchainMessagesTable
            blockchainMessages={this.state.blockchainMessages}
          />
        </Grid>
      </div>
    );
  }
}

export default App;

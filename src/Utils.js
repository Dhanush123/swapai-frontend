import { ethers } from "ethers";
import Web3 from "web3";
import { TUSD, WBTC, TUSD_KOVAN_ADDRESS, WBTC_KOVAN_ADDRESS } from "./Constants";
require("dotenv").config();

class Utils {
  constructor(swapAI, userAddress, provider) {
    this.provider = provider;
    this.userAddress = userAddress;
    this.swapAI = swapAI;
  }

  async createUser() {
    try {
      console.log("this.swapAI.createUser", this.swapAI.createUser.toString());
      let tx = await this.swapAI.createUser();
      let txwait = await tx.wait();
      console.log("createUser response!", txwait);

      let filterValues = await this.swapAI.queryFilter(
        this.swapAI.filters.CreateUser()
      );
      let createUserStatus =
        filterValues === undefined || filterValues.length === 0
          ? false
          : ethers.utils.defaultAbiCoder.decode(
              ["bool"],
              filterValues[filterValues.length - 1].data
            );
      console.log("createUserStatus from chain", createUserStatus);
      return createUserStatus;
    } catch (e) {
      console.log("createUser exception", e);
      return "Error";
    }
  }

  async getUserBalance(userAddress) {
    try {
      let tx = await this.swapAI.fetchUserBalance();
      let txwait = await tx.wait();
      console.log("getUserBalance response!", txwait);

      let filterValues = await this.swapAI.queryFilter(
        this.swapAI.filters.UserBalance()
      );

      let userBalanceResult =
        filterValues === undefined || filterValues.length === 0
          ? [-1, -1]
          : ethers.utils.defaultAbiCoder.decode(
              ["uint", "uint"],
              filterValues[filterValues.length - 1].data
            );
      let balanceMap = {};
      balanceMap[TUSD] = userBalanceResult[0]
        .div(ethers.BigNumber.from("10").pow(18))
        .toString();
      balanceMap[WBTC] = userBalanceResult[1]
        .div(ethers.BigNumber.from("10").pow(8))
        .toString();
      return balanceMap;
    } catch (e) {
      console.log("createUser exception", e);
      return "Error";
    }
  }

  async addDeposit(toAddress, coinNameToDeposit) {
    let abi = ["function approve(address _spender, uint256 _value) public returns (bool success)"]
    let wei;
    let decimals;
    let transferResult;
    let tokenContract;
    if (coinNameToDeposit === TUSD) {
      decimals = 18;
      tokenContract = new ethers.Contract(TUSD_KOVAN_ADDRESS, abi, this.provider.getSigner(0));
      wei = ethers.utils.parseEther((10 * 10**decimals).toString());
      await tokenContract.approve(this.userAddress, wei);
      transferResult = await this.swapAI.depositTUSD(wei);
    } else if (coinNameToDeposit === WBTC) {
      decimals = 8;
      tokenContract = new ethers.Contract(WBTC_KOVAN_ADDRESS, abi, this.provider.getSigner(0));
      wei = ethers.utils.parseEther((10**-4).toString());
      await tokenContract.approve(this.userAddress, wei);
      transferResult = await this.swapAI.depositWBTC(wei);
    }
    console.log("addDeposit response!", transferResult);
    let filterValues;
    if (coinNameToDeposit === TUSD) {
      filterValues = await this.swapAI.queryFilter(
        this.swapAI.filters.DepositTUSD()
      );
    } else if (coinNameToDeposit === WBTC) {
      filterValues = await this.swapAI.queryFilter(
        this.swapAI.filters.DepositWBTC()
      );
    }
    let userDepositResult =
      filterValues === undefined || filterValues.length === 0
        ? [-1, -1]
        : ethers.utils.defaultAbiCoder.decode(
            ["uint", "uint"],
            filterValues[filterValues.length - 1].data
          );
    let depositMap = {};
    depositMap["oldBalance"] = userDepositResult[0]
      .div(ethers.BigNumber.from("10").pow(decimals))
      .toString();
    depositMap["newBalance"] = userDepositResult[1]
      .div(ethers.BigNumber.from("10").pow(decimals))
      .toString();
    return depositMap;
  }

  async updateSwapSingleUserBalance() {
    // TODO: figure out if need to "initialize" OracleCaller contract like SwapAI in order to extract event data, have asked in Chainlink Discord
  }
}

export default Utils;

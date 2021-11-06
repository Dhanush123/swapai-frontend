import { ethers } from "ethers";
import Web3 from "web3";
import { TUSD, WBTC } from "./Constants";
require("dotenv").config();

class Utils {
  constructor(swapAI, provider, address) {
    this.swapAI = swapAI;
    this.provider = provider;
    this.address = address;
    this.httpProvider = new Web3.providers.HttpProvider(
      process.env.KOVAN_RPC_URL
    );
    console.log("httpProvider", this.httpProvider);
  }

  async createUser() {
    try {
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
      let tx = await this.swapAI.getUserBalance();
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
    let tokenAmt;
    let decimals;
    if (coinNameToDeposit === TUSD) {
      decimals = 18;
      tokenAmt = ethers.utils.parseUnits(1, decimals);
    } else if (coinNameToDeposit === WBTC) {
      decimals = 8;
      tokenAmt = ethers.utils.parseUnits(0.0001, decimals);
    }
    let transferResult = await this.swapAI.transfer(toAddress, tokenAmt);
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

  async updateSwapSingleUserBalance() {}
}

export default Utils;

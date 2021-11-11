import { ethers } from "ethers";
import {
  TUSD,
  WBTC,
  TUSD_KOVAN_ADDRESS,
  WBTC_KOVAN_ADDRESS,
} from "./Constants";
require("dotenv").config();

class Utils {
  constructor(swapAI, userAddress, provider) {
    this.provider = provider;
    this.userAddress = userAddress;
    this.swapAI = swapAI;
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

  async addDeposit(coinNameToDeposit) {
    try {
      let abi = [
        "function approve(address _spender, uint256 _value) public returns (bool success)",
      ];
      let wei;
      let decimals;
      let transferResult;
      let tokenContract;
      if (coinNameToDeposit === TUSD) {
        decimals = 18;
        tokenContract = new ethers.Contract(
          TUSD_KOVAN_ADDRESS,
          abi,
          this.provider.getSigner(0)
        );
        wei = ethers.utils.parseEther((10 * 10 ** decimals).toString());
        await tokenContract.approve(this.userAddress, wei);
        transferResult = await this.swapAI.depositTUSD(wei);
      } else if (coinNameToDeposit === WBTC) {
        decimals = 8;
        tokenContract = new ethers.Contract(
          WBTC_KOVAN_ADDRESS,
          abi,
          this.provider.getSigner(0)
        );
        wei = ethers.utils.parseEther((10 ** -4).toString());
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
      console.log("depositMap", depositMap);
      return depositMap;
    } catch (e) {
      console.log("addDeposit exception", e);
      return "Error";
    }
  }

  async updateSwapSingleUserBalance() {
    try {
      let tx = await this.swapAI.swapSingleUserBalance();
      let txwait = await tx.wait();
      console.log("swapSingleUserBalance response!", txwait);

      let filterValues = await this.swapAI.queryFilter(
        this.swapAI.filters.SwapUsersBalances()
      );
      let swapSingleUserBalanceStatus =
        filterValues === undefined || filterValues.length === 0
          ? [-1, -1, -1, -1, false, false, []]
          : ethers.utils.defaultAbiCoder.decode(
              ["uint, uint, uint, uint, bool, bool, SwapUser[]"],
              filterValues[filterValues.length - 1].data
            );
      console.log(
        "swapSingleUserBalanceStatus from chain",
        swapSingleUserBalanceStatus
      );
      let swapSingleUserBalanceStatusMap = {
        tusdRatio:
          swapSingleUserBalanceStatus[0] > 0
            ? swapSingleUserBalanceStatus[0] / 10 ** 4
            : "error",
        btcSentiment: swapSingleUserBalanceStatus[1] / 10 ** 4,
        btcPriceCurrent: (swapSingleUserBalanceStatus[2] / 10 ** 8).toFixed(2),
        btcPricePrediction: swapSingleUserBalanceStatus[3].toFixed(2),
        isNegativeFuture: swapSingleUserBalanceStatus[4],
        isPositiveFuture: swapSingleUserBalanceStatus[5],
        user: swapSingleUserBalanceStatus[6][0],
      };
      return swapSingleUserBalanceStatusMap;
    } catch (e) {
      console.log("swapSingleUserBalance exception", e);
      return "Error";
    }
    // TODO: figure out if need to "initialize" OracleCaller contract like SwapAI in order to extract event data, have asked in Chainlink Discord
  }

  async optInToggle() {
    try {
      let tx = await this.swapAI.optInToggle();
      let txwait = await tx.wait();
      console.log("optInToggle response!", txwait);

      let filterValues = await this.swapAI.queryFilter(
        this.swapAI.filters.OptInToggle()
      );
      console.log("filterValues", filterValues);
      let toggleValue =
        filterValues === undefined || filterValues.length === 0
          ? "Error"
          : ethers.utils.defaultAbiCoder.decode(
              ["bool"],
              filterValues[filterValues.length - 1].data
            );
      console.log("toggleValue", toggleValue);
      return toggleValue;
    } catch (e) {
      console.log("optInToggle exception", e);
      return "Error";
    }
  }
}

export default Utils;

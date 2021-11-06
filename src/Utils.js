import { ethers } from "ethers";
import Web3 from "web3";
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

      let filterValues = await this.stableRatioSwap.queryFilter(
        this.stableRatioSwap.filters.CreateUser()
      );
      let createUserStatus =
        filterValues === undefined || filterValues.length == 0
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
}

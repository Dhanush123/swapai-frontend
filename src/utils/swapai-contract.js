import { ethers } from "ethers";
import {
  MAX_GAS_LIMIT,
  TUSD_KOVAN_ADDRESS,
  WBTC_KOVAN_ADDRESS,
  CONTRACT_ADDRESS,
  ERC20_TOKEN_ABI,
  SWAPAI_ABI,
} from "./constants";

import { waitForEvent } from "./utils";

const BigNum = ethers.BigNumber;

class SwapAIContract {
  constructor(provider) {
    this.tusdToken = new ethers.Contract(
      TUSD_KOVAN_ADDRESS,
      ERC20_TOKEN_ABI,
      provider.getSigner(0),
    );


    this.wbtcToken = new ethers.Contract(
      WBTC_KOVAN_ADDRESS,
      ERC20_TOKEN_ABI,
      provider.getSigner(0),
    );

    this.swapAI = new ethers.Contract(
      CONTRACT_ADDRESS,
      SWAPAI_ABI,
      provider.getSigner(0),
    );
  }

  async _waitEvent(filter) {
    return await waitForEvent(this.swapAI, filter);
  }

  async _tusdFactor() {
    // TODO: Fetch decimals dynamically somehow
    const tusdDecimals = 18; //await this.tusdToken.decimals();
    const tusdFactor = BigNum.from(10).pow(BigNum.from(tusdDecimals));
    return tusdFactor;
  }

  async _wbtcFactor() {
    // TODO: Fetch decimals dynamically somehow
    const wbtcDecimals = 8; //await this.wbtcToken.decimals();
    const wbtcFactor = BigNum.from(10).pow(BigNum.from(wbtcDecimals));
    return wbtcFactor;
  }

  _formatCurrency(rawValue, decimals) {
    const formattedValue = ethers.utils.formatUnits(rawValue, decimals);
    const prettyValue = ethers.utils.commify(formattedValue);
    return prettyValue;
  }

  async userExists() {
    await this.swapAI.userExists({ gasLimit: MAX_GAS_LIMIT });
    const [userExists] = await this._waitEvent(this.swapAI.filters.UserExists());

    return userExists;
  }

  async registerUser() {
    await this.swapAI.registerUser({ gasLimit: MAX_GAS_LIMIT });
    const [success, isNewUser] = await this._waitEvent(this.swapAI.filters.RegisterUser());

    return { success, isNewUser };
  }

  async fetchUserBalance() {
    await this.swapAI.fetchUserBalance({ gasLimit: MAX_GAS_LIMIT });
    const [tusdBalance, wbtcBalance] = await this._waitEvent(this.swapAI.filters.UserBalance());

    return {
      'TUSD': this._formatCurrency(BigNum.from(tusdBalance), 18),
      'WBTC': this._formatCurrency(BigNum.from(wbtcBalance), 8),
    };
  }

  async fetchOptInStatus() {
    await this.swapAI.fetchOptInStatus({ gasLimit: MAX_GAS_LIMIT });
    const [optInStatus] = await this._waitEvent(this.swapAI.filters.OptInStatus());

    return optInStatus;
  }

  async setOptInStatus(wantedOptInStatus) {
    await this.swapAI.setOptInStatus(wantedOptInStatus, { gasLimit: MAX_GAS_LIMIT });
    const [newOptInStatus] = await this._waitEvent(this.swapAI.filters.OptInStatus());

    return newOptInStatus;
  }

  async depositTUSD(depositAmount) {
    // First approve the contract to spend the TUSD on your behalf
    const realAmount = BigNum.from(depositAmount).mul(await this._tusdFactor());
    await this.tusdToken.approve(CONTRACT_ADDRESS, realAmount);

    // Then deposit that much TUSD into the contract
    await this.swapAI.depositTUSD(realAmount, { gasLimit: MAX_GAS_LIMIT });
    const [oldBalance, newBalance] = await this._waitEvent(this.swapAI.filters.DepositTUSD());

    return {
      oldBalance: this._formatCurrency(BigNum.from(oldBalance), 18),
      newBalance: this._formatCurrency(BigNum.from(newBalance), 18),
    };
  }

  async depositWBTC(depositAmount) {
    // First approve the contract to spend the WBTC on your behalf
    const realAmount = BigNum.from(depositAmount).mul(await this._wbtcFactor());
    await this.wbtcToken.approve(CONTRACT_ADDRESS, realAmount);

    // Then deposit that much WBTC into the contract
    await this.swapAI.depositWBTC(realAmount, { gasLimit: MAX_GAS_LIMIT });
    const [oldBalance, newBalance] = await this._waitEvent(this.swapAI.filters.DepositWBTC());

    return {
      oldBalance: this._formatCurrency(BigNum.from(oldBalance), 8),
      newBalance: this._formatCurrency(BigNum.from(newBalance), 8),
    };
  }

  async manualSwapUserBalance(_toTUSD) {
    await this.swapAI.manualSwapUserBalance(_toTUSD, { gasLimit: MAX_GAS_LIMIT * 10 });

    const [
      success,
      toTUSD,
      // tusdRatio,
      btcSentiment,
      btcPriceCurrent,
      btcPricePrediction,
      isNegativeFuture,
      isPositiveFuture,
    ] = await this._waitEvent(this.swapAI.filters.ManualSwap());

    return {
      success, toTUSD,
      /*tusdRatio,*/ btcSentiment,
      btcPriceCurrent, btcPricePrediction,
      isNegativeFuture, isPositiveFuture,
    };
  }
}

export default SwapAIContract;

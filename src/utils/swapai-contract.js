import { ethers } from 'ethers';
import {
  MAX_GAS_LIMIT,
  TUSD_KOVAN_ADDRESS,
  WBTC_KOVAN_ADDRESS,
  CONTRACT_ADDRESS,
  ERC20_TOKEN_ABI,
  SWAPAI_ABI,
} from './constants';

import { waitForEvent, sleep } from './utils';

const BigNum = ethers.BigNumber;

class SwapAIContract {
  constructor(provider) {
    this.provider = provider;

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

    this.swapAI = new ethers.Contract(
      CONTRACT_ADDRESS,
      SWAPAI_ABI,
      provider.getSigner(0),
    );
  }

  async _waitEvent(filter) {
    return await waitForEvent(this.swapAI, filter);
  }

  async _wbtcFactor() {
    // TODO: Fetch decimals dynamically somehow
    const wbtcDecimals = 8; //await this.wbtcToken.decimals();
    const wbtcFactor = BigNum.from(10).pow(BigNum.from(wbtcDecimals));
    return wbtcFactor;
  }

  async _tusdFactor() {
    // TODO: Fetch decimals dynamically somehow
    const tusdDecimals = 18; //await this.tusdToken.decimals();
    const tusdFactor = BigNum.from(10).pow(BigNum.from(tusdDecimals));
    return tusdFactor;
  }

  _formatCurrency(rawValue, decimals) {
    const formattedValue = ethers.utils.formatUnits(rawValue, decimals);
    const prettyValue = ethers.utils.commify(formattedValue);
    return prettyValue;
  }

  ///////////////////////////
  // User register / login //
  ///////////////////////////

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

  /////////////////////
  // User attributes //
  /////////////////////

  async fetchUserBalance() {
    await this.swapAI.fetchUserBalance({ gasLimit: MAX_GAS_LIMIT });
    const [tusdBalance, wbtcBalance] = await this._waitEvent(this.swapAI.filters.UserBalance());

    return {
      'WBTC': this._formatCurrency(BigNum.from(wbtcBalance), 8),
      'TUSD': this._formatCurrency(BigNum.from(tusdBalance), 18),
    };
  }

  async fetchOptInStatus() {
    await this.swapAI.fetchOptInStatus({ gasLimit: MAX_GAS_LIMIT });
    const [optInStatus] = await this._waitEvent(this.swapAI.filters.OptInStatus());

    return optInStatus;
  }

  /////////////////////
  // User management //
  /////////////////////

  async setOptInStatus(wantedOptInStatus) {
    await this.swapAI.setOptInStatus(wantedOptInStatus, { gasLimit: MAX_GAS_LIMIT });
    const [newOptInStatus] = await this._waitEvent(this.swapAI.filters.OptInStatus());

    return newOptInStatus;
  }

  ////////////////////////
  // Balance depositing //
  ////////////////////////

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

  /////////////////////////////
  // Manual balance swapping //
  /////////////////////////////

  async manualSwapUserToWBTC() {
    await this.swapAI.manualSwapUserToWBTC({ gasLimit: MAX_GAS_LIMIT * 10 });

    const [
      oldWbtcBalance, newWbtcBalance,
      oldTusdBalance, newTusdBalance,
    ] = await this._waitEvent(this.swapAI.filters.ManualSwap());

    return {
      WBTC: {
        old: this._formatCurrency(BigNum.from(oldWbtcBalance), 8),
        new: this._formatCurrency(BigNum.from(newWbtcBalance), 8),
      },
      TUSD: {
        old: this._formatCurrency(BigNum.from(oldTusdBalance), 18),
        new: this._formatCurrency(BigNum.from(newTusdBalance), 18),
      },
    }
  }

  async manualSwapUserToTUSD() {
    await this.swapAI.manualSwapUserToTUSD({ gasLimit: MAX_GAS_LIMIT * 10 });

    const [
      oldWbtcBalance, newWbtcBalance,
      oldTusdBalance, newTusdBalance,
    ] = await this._waitEvent(this.swapAI.filters.ManualSwap());

    return {
      WBTC: {
        old: this._formatCurrency(BigNum.from(oldWbtcBalance), 8),
        new: this._formatCurrency(BigNum.from(newWbtcBalance), 8),
      },
      TUSD: {
        old: this._formatCurrency(BigNum.from(oldTusdBalance), 18),
        new: this._formatCurrency(BigNum.from(newTusdBalance), 18),
      },
    }
  }

  ////////////////////////////
  // Prediction forecasting //
  ////////////////////////////

  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async fetchPredictionForecast() {
    await this.swapAI.fetchPredictionForecast({ gasLimit: MAX_GAS_LIMIT * 10 });

    await sleep(5000);

    // const [
    //   btcPriceCurrent,
    //   btcPricePrediction,
    //   tusdAssets,
    //   tusdReserves,
    //   btcSentiment,
    //   isNegativeFuture,
    //   isPositiveFuture,
    // ] = await this._waitEvent(this.swapAI.filters.PredictionResults());

    console.log('got something!!!!');

    return {
      btcPriceCurrent: this.getRandomInt(56000 * 10 ** 8, 58000 * 10 ** 8),
      btcPricePrediction: this.getRandomInt(53000 * 10 ** 8, 62000 * 10 ** 8),
      tusdAssets: this.getRandomInt(10**17 + 0 * 10**16, 10**17 + 2 * 10**16),
      tusdReserves: this.getRandomInt(10**17 + 0 * 10**16, 10**17 + 2 * 10**16),
      btcSentiment: this.getRandomInt(-10000, 10000),
      isNegativeFuture: false,
      isPositiveFuture: false,
    };
  }
}

export default SwapAIContract;

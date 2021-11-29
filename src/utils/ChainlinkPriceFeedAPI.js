import axios from 'axios';

class ChainlinkPriceFeedAPI {
  constructor(contractAddress, decimals) {
    this.address = contractAddress;
    this.decimals = decimals;

    this.api = axios.create({
      baseURL: 'https://market.link/v1/metrics/api/v1/',
      headers: {
        accept: 'application/json',
        // 'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  }

  get query() {
    return `avg(feeds_latest_answer{feed_address=~"(?i)${this.address}", network_id=~"1|"}) by (feed_address) / ${10 ** this.decimals}`;
  }

  async fetchHistoricPrices(range) {
    const end = Math.floor(Date.now() / 1000);
    const start = end - range;
    return this._fetchHistoricPrices(start, end);
  }

  async fetchHistoricPriceRange(start, end) {
    return this._fetchHistoricPrices(start, end);
  }

  async _fetchHistoricPrices(start, end) {
    const res = await this.api.get('/query_range', {
      params: {
        query: this.query,
        start,
        end,
        step: Math.floor((end - start) / 60)
      }
    });

    const dataResponse = res.data;
    const rawData = dataResponse.data.result[0].values;
    const processedData = rawData.map(([timestamp, price]) => ([timestamp * 1000, price]));

    return processedData;
  }
}

export default ChainlinkPriceFeedAPI;

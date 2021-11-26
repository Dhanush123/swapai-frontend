import React from 'react';

import { AdvancedChart } from 'react-tradingview-embed';

function PriceChart() {
  const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <AdvancedChart
      widgetProps={{
        width: '100%',
        height: '100%',
        // symbol: 'COINBASE:BTCUSD',
        symbol: 'BINANCE:BTCTUSD',
        range: '5D',
        timezone: clientTimezone,
        theme: 'light',
        style: '3',
        locale: 'en',
        toolbar_bg: '#f1f3f6',
        enable_publishing: false,
        hide_top_toolbar: true,
        hide_side_toolbar: true,
        withdateranges: true,
        allow_symbol_change: true,
        save_image: false
      }}
    />
  );
}

export default React.memo(PriceChart);

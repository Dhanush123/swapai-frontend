import React from 'react';

import Chart from 'react-apexcharts';

function PriceFeedChart(props) {
  const dataSeries = [{
    name: 'BTC Price',
    data: props.data
  }];

  const mainChartOpts = {
    chart: {
      foreColor: '#000000a6',
      animations: { enabled: false },
      toolbar: {
        show: false,
        autoSelected: 'pan'
      }
    },
    colors: [
      '#343ac8', '#4645d6', '#5750e3', '#665cf1',
      '#7568ff', '#8474ff', '#9280ff', '#a18cff',
      '#af99ff', '#bea5ff', '#ccb2ff', '#dbbfff',
      '#e9ccff', '#f8daff'
    ],
    grid: { borderColor: '#e9e9e9' },
    stroke: { width: 3, curve: 'smooth' },
    tooltip: {
      shared: false,
      x: {
        show: true,
        format: 'dd MMM yyyy hh:mm TT'
      },
      y: {
        title: {}
      }
    },
    title: {
      text: 'BTC / USD',
      align: 'left',
      style: {
        fontSize: '28px',
      },
    },
    dataLabels: {
      enabled: false
    },
    yaxis: {
      labels: {
        formatter: value => '$' + value.toFixed(2)
      },
    },
    xaxis: {
      type: 'datetime',
      labels: { datetimeUTC: false },
      axisBorder: { color: '#e9e9e9' },
      axisTicks: { color: '#e9e9e9' }
    },
    legend: { show: false }
  }

  return (
    <div id="chart">
      <Chart options={mainChartOpts} series={dataSeries} type="area" height={props.height} />
    </div>
  );
}

export default React.memo(PriceFeedChart);

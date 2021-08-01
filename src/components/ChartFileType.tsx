import React from 'react';
import { Bar } from '@ant-design/charts';

const ChartFileType: React.FC = () => {
  const data = [
    {
      type: 'others(0.5%)',
      year: '',
      value: 5,
    },
    {
      type: 'pdf(5%)',
      year: '',
      value: 100,
    },
    {
      type: 'Video(15%)',
      year: '',
      value: 300,
    },
    {
      type: 'Documents(25%)',
      year: '',
      value: 500,
    },

    {
      type: 'Photo(55%)',
      year: '',
      value: 1128,
    },
  ];
  const config = {
    data,
    defaultInteractions: [],
    xAxis: false,
    yAxis: false,
    legend: {
      layout: 'horizontal',
      position: 'bottom',
    },
    tooltip: false,
    xField: 'value',
    height: 60,
    autoFit: false,
    yField: 'year',
    seriesField: 'type',
    isPercent: true,
    isStack: true,
    showContent: false,
    /** 自定义颜色 */
    // color: ['#2582a1', '#f88c24', '#c52125', '#87f4d0'],
    //barStyle: { radius: [2, 2, 0, 0] },
    label: {
      position: 'middle',
      content: (item) => {
        return '';
        return (item.value * 100).toFixed(0) + '%';
      },
      style: {
        fill: '#fff',
      },
    },
  };
  return (
    <Bar
      {...config}
      onReady={(plot) => {
        plot.off('legend-item-name', (...args) => {
          console.log(...args);
        });

        plot.off('legend-item-name:click', (ev) => {
          const target = ev.target;
          const delegateObject = target.get('delegateObject');
          const item = delegateObject.item; // 图例选项
          console.log(89, target, item);
        });
      }}
    />
  );
};

export default ChartFileType;

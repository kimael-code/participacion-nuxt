import { BarChart, PieChart } from 'echarts/charts';
import {
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import VChart, { THEME_KEY } from 'vue-echarts';

export default defineNuxtPlugin((nuxtApp) => {
  use([
    CanvasRenderer,
    PieChart,
    BarChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    TitleComponent,
    DatasetComponent,
  ]);

  nuxtApp.vueApp.component('VChart', VChart);

  return {
    provide: {
      echarts: {
        THEME_KEY,
      },
    },
  };
});

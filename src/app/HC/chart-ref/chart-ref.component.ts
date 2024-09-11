import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as Highcharts from 'highcharts';
import { Options } from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import Accessibility from 'highcharts/modules/accessibility';
import Boost from 'highcharts/modules/boost';
import Exporting from 'highcharts/modules/exporting';
import DarkUnica from 'highcharts/themes/dark-unica';

Boost(Highcharts);
Accessibility(Highcharts);
Exporting(Highcharts);
DarkUnica(Highcharts);

interface StickyChart extends Highcharts.Chart {
  sticky?: Highcharts.SVGRenderer;
}

@Component({
  selector: 'app-chart-ref',
  standalone: true,
  imports: [FormsModule, HighchartsChartModule],
  templateUrl: './chart-ref.component.html',
  styleUrl: './chart-ref.component.css',
})
export class ChartRefComponent {
  Highcharts: typeof Highcharts = Highcharts;

  @ViewChild('chart') componentRef: any;
  chartRef!: StickyChart;
  updateFlag: any;
  currentTypeChart = '';

  chartOptions: Options = {
    title: {
      text: 'Chart by ref',
    },
    exporting: {
      enabled: true,
      buttons: {
        contextButton: {
          menuItems: [
            'downloadPNG',
            'downloadJPEG',
            'downloadPDF',
            'downloadSVG',
          ],
        },
      },
    },
    chart: {
      zooming: {
        type: 'x',
      },
      events: {
        load() {
          console.log('chart', Highcharts.charts);
        },
      },
    },
    subtitle: {
      text:
        document.ontouchstart === undefined
          ? 'Click and drag in the plot area to zoom in'
          : 'Pinch the chart to zoom in',
      align: 'left',
    },
    series: [
      {
        id: Date.now().toString(),
        type: 'line',
        data: [1, 2, 3, 4],
      },
    ],
    tooltip: {
      pointFormatter: function () {
        return (
          'The value for <b>' +
          this.x.toFixed(3) +
          '</b> is <b>' +
          this.y?.toFixed(3) +
          '</b>, in series <b>[' +
          this.series.name +
          ']</b>'
        );
      },
    },
    plotOptions: {
      series: {
        point: {
          events: {
            click: function () {
              // Retourne le point sélectionné lors du clic
              console.log(
                'You click on point (' +
                  this.x +
                  ',' +
                  this.y +
                  ') with the series ID ' +
                  this.series.options.id
              );
              // Retourne toutes les valeurs ayant le même x
              const xCategory = this.category;
              const values = this.series.chart.series
                .filter(serie => {
                  return serie.data.find(val => val.x === this.x);
                })
                .map((serie: any) => {
                  const index = serie.data.findIndex(
                    (d: any) => d.x === this.x
                  );
                  return {
                    name: serie.name,
                    state: serie.state,
                    value: serie.data[index].y,
                  };
                });
              console.log(
                "Valeurs de tous les graphs ayant un point à l'abscisse " +
                  xCategory
              );
              console.table(values, ['name', 'state', 'value']);
              // gestion sticky
              console.log(
                this.plotX,
                this.plotY,
                this.series.options.className
              );
              if (
                this.plotX &&
                this.plotY &&
                (!this.series.options.className ||
                  this.series.options.className.indexOf('popup-on-click') !==
                    -1)
              ) {
                const chart: Highcharts.Chart & { sticky?: any } =
                  this.series.chart;
                const date = Highcharts.dateFormat(
                  '%d/%m/%Y',
                  new Date().getTime()
                );
                const text = `<b>${date}</b><br/>${this.y} ${this.series.name}`;

                const anchorX = this.plotX + this.series.xAxis.pos;
                const anchorY = this.plotY + this.series.yAxis.pos;
                const align =
                  anchorX < chart.chartWidth - 200 ? 'left' : 'right';
                const x = align === 'left' ? anchorX + 10 : anchorX - 10;
                const y = anchorY - 30;
                if (!chart.sticky) {
                  chart.sticky = chart.renderer
                    .label(text, x, y, 'callout', anchorX, anchorY)
                    .attr({
                      align,
                      fill: 'rgba(0, 0, 0, 0.75)',
                      padding: 10,
                      zIndex: 7, // Above series, below tooltip
                    })
                    .css({
                      color: 'white',
                    })
                    .on('click', function () {
                      chart.sticky = chart.sticky.destroy();
                    })
                    .add();
                } else {
                  chart.sticky
                    .attr({ align, text })
                    .animate({ anchorX, anchorY, x, y }, { duration: 250 });
                }
              }
            },
          },
        },
      },
    },
  };

  chartCallback: Highcharts.ChartCallbackFunction = chart => {
    this.chartRef = chart;
  };

  updateChart(): void {
    this.currentTypeChart =
      this.currentTypeChart === 'line' ? 'scatter' : 'line';
    for (const serie of this.chartRef.series) {
      serie.update({
        type: this.currentTypeChart as any,
      });
    }
  }

  addSeries(): void {
    this.chartRef.addSeries({
      id: Date.now().toString(),
      type: this.currentTypeChart as any,
      data: [
        ...Array.from({ length: (Math.random() + 0.1) * 10 * 2 }, () =>
          Math.floor(Math.random() * 10)
        ),
      ],
    });
  }

  removeSeries() {
    this.chartRef.get(this.chartRef.series[0].options.id ?? '')?.remove();
  }

  getNumberOfPoints() {
    let total = 0;
    for (const serie of this.chartRef.series) {
      total += serie.data.length;
    }
    return total;
  }
}

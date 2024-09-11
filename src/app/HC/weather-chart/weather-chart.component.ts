import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal, AfterViewInit } from '@angular/core';
import * as Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import Draggable from 'highcharts/modules/draggable-points';
import Accessibility from 'highcharts/modules/accessibility';
import Boost from 'highcharts/modules/boost';
import Exporting from 'highcharts/modules/exporting';
import DarkUnica from 'highcharts/themes/dark-unica';

Boost(Highcharts);
Accessibility(Highcharts);
Exporting(Highcharts);
DarkUnica(Highcharts);
// On ajoute le module draggable
Draggable(Highcharts);

@Component({
  selector: 'app-weather-chart',
  standalone: true,
  imports: [FormsModule, HighchartsChartModule],
  templateUrl: './weather-chart.component.html',
  styleUrl: './weather-chart.component.css',
})
export class WeatherChartComponent implements AfterViewInit {
  http = inject(HttpClient);

  // partie pour la gestion de la zone de Travail
  zoneTravailOption: Highcharts.AxisPlotBandsOptions = {
    id: 'zoneTravail',
    from: 25,
    to: 30,
    color: 'dark',
  };
  zoneTravailActive = 'index';
  pointDragStart: number | null = null;

  positionPoint = signal('h');
  seriesType = signal('spline');

  Highcharts: typeof Highcharts = Highcharts;
  chartRef!: Highcharts.Chart;
  chartOptions: Highcharts.Options = {
    title: {
      text: 'Evolution température de Rennes par heure',
    },
    chart: {
      zooming: {
        type: 'x',
      },
      events: {
        load: () => {
          this.reloadChart();
        },
        click: event => {
          const x = event.chartX;
          const y = event.chartY;
          // On récupère tous les points sélectionnés
          const points = this.chartRef.getSelectedPoints();

          // si le nombre de points selectionné est supérieur à 0, on fait un traitement
          if (points && points.length > 0) {
            // yVariant permet de calculer la variation de déplacement sur l'axe y
            const yVariant =
              this.chartRef.yAxis[0].toValue(y) - (points[0].y ?? 0);
            //on boucle tous les point ayant le même index que le point sélectionné
            //pour les déplacer au même niveau, en fonction de positionPoint:
            //-h = horizontal
            //-v = vertical
            for (let index = 0; index < this.chartRef.series.length; index++) {
              const element = this.chartRef.series[index];
              const point = element.data[points[0].index];
              if (this.positionPoint() === 'h') {
                point.update({
                  x: this.chartRef.xAxis[0].toValue(x),
                  y: point.y,
                });
              } else {
                const yCalc = (point.y ?? 0) + yVariant;
                point.update({
                  x: point.x,
                  y: yCalc,
                });
              }
            }
          }
        },
      },
    },
    plotOptions: {
      series: {
        stickyTracking: false,
        allowPointSelect: true,
        compare: 'value',
        animationLimit: 0,
      },
    },
    tooltip: {
      split: false, //cela évite d'afficher tous les tooltips de chaque série
    },
    navigator: {
      enabled: false,
    },
    rangeSelector: {
      enabled: false,
    },
    scrollbar: {
      enabled: true,
    },
    boost: {
      enabled: true,
    },
  };

  ngAfterViewInit(): void {
    // gestion du clic droit sur le container du graphe
    Highcharts.addEvent(this.chartRef.container, 'contextmenu', event => {
      event?.preventDefault();
    });
  }

  chartCallback: Highcharts.ChartCallbackFunction = chart => {
    this.chartRef = chart;
  };

  /**
   * Méthode permettant de mettre à jour le graphe
   */
  reloadChart() {
    this.chartRef.showLoading();
    let index = 1;
    this.http
      .get(
        'https://api.open-meteo.com/v1/forecast?latitude=48.112&longitude=-1.6743&current=temperature_2m&hourly=temperature_2m,apparent_temperature,temperature_20m,temperature_50m,temperature_100m,temperature_150m,temperature_200m&timezone=Europe%2FBerlin&&models=meteofrance_seamless'
      )
      .subscribe((data: any) => {
        this.addSeries(
          'temres',
          'Température ressenti',
          this.seriesType(),
          'yellow',
          data.hourly.apparent_temperature
        );
        this.addSeries(
          'tem2m',
          'Température (2m)',
          this.seriesType(),
          '#F3F3FC',
          data.hourly.temperature_2m
        );
        this.addSeries(
          'tem20m',
          'Température (20m)',
          this.seriesType(),
          '#BABDED',
          data.hourly.temperature_20m
        );
        this.addSeries(
          'tem50m',
          'Température (50m)',
          this.seriesType(),
          '#858BE0',
          data.hourly.temperature_50m
        );
        this.addSeries(
          'tem100m',
          'Température (100m)',
          this.seriesType(),
          '#4B54D1',
          data.hourly.temperature_100m
        );
        this.addSeries(
          'tem150m',
          'Température (150m)',
          this.seriesType(),
          '#2F38B7',
          data.hourly.temperature_150m
        );
        this.addSeries(
          'tem2000m',
          'Température (200m)',
          this.seriesType(),
          '#222986',
          data.hourly.temperature_200m
        );

        // vu qu'on reçoit le temps en string, alors on le convertit
        const timeFormatted = data.hourly.time.map((t: string) => {
          const tDate = new Date(t);
          return Highcharts.dateFormat('%H:%M %d/%m/%Y', tDate.getTime());
        });

        this.chartRef.xAxis[0].setCategories(timeFormatted);

        const currentTime = new Date(data.current.time);

        // on boucle afin de récupérer l'index qui correspond à l'heure la plus
        // proche à celle actuel
        for (const currentData of data.hourly.time) {
          index++;
          const currentHourlyTime = new Date(currentData);
          if (
            currentTime.getDate() === currentHourlyTime.getDate() &&
            currentTime.getMonth() === currentHourlyTime.getMonth() &&
            currentTime.getFullYear() === currentHourlyTime.getFullYear() &&
            currentTime.getHours() === currentHourlyTime.getHours()
          ) {
            break;
          }
        }

        this.chartRef.xAxis[0].addPlotBand({
          id: 'currentTime',
          from: index,
          to: index + 1,
          color: 'black',
        });
      });

    this.chartRef.xAxis[0].addPlotBand(this.zoneTravailOption);
    this.chartRef.hideLoading();
  }

  /**
   * Méthode permettant de créer des séries à l'aide de divers paramètres
   * @param id id donnée à la série créé
   * @param name nom donné à la série créé
   * @param type type de graphe
   * @param color couleur donné au point
   * @param data
   */
  addSeries(id: string, name: string, type: any, color: string, data: any[]) {
    this.chartRef.get(id)?.remove();
    this.chartRef.addSeries({
      id: id,
      type: type,
      name: name,
      color: color,
      data: data,
      draggable: true,
      dragDrop: {
        draggableX: true,
        liveRedraw: true,
        dragPrecisionX: 0,
      },
      point: {
        events: {
          click: event => {
            console.log('click', event);
          },
          dragStart: (event: any) => {
            event.preventDefault();
            const indexDrag = this.chartRef.xAxis[0].toValue(event.chartX);
            this.pointDragStart = indexDrag;
          },
          drop: (event: any) => {
            this.pointDragStart = null;
          },
          drag: (event: any) => {
            if (this.zoneTravailActive === 'zone' && this.pointDragStart) {
              const time = setTimeout(() => {
                const xVariation =
                  event.newPoint?.x - (this.pointDragStart ?? 0);
                for (let i = 0; i < this.chartRef.series.length; i++) {
                  const element = this.chartRef.series[i];
                  const newData = element.data.map((point, index) => {
                    if (
                      this.zoneTravailOption.from &&
                      this.zoneTravailOption.to &&
                      point.x + xVariation > this.zoneTravailOption.from &&
                      point.x + xVariation < this.zoneTravailOption.to &&
                      point.x + xVariation > element.data[index - 1].x &&
                      point.x + xVariation < element.data[index + 1].x
                    ) {
                      return [point.index + xVariation, point.y];
                    } else {
                      return [point.index, point.y];
                    }
                  });
                  element.setData(newData, true, false);
                }
                clearTimeout(time);
              }, 500);
            }

            if (this.zoneTravailActive === 'index') {
              // on loop à travers les séries pour modifier tous les points du même index
              // afin de mettre à jour leur position
              for (
                let index = 0;
                index < this.chartRef.series.length;
                index++
              ) {
                const element = this.chartRef.series[index];
                const point = element.data[event.target.index];
                point.update({
                  x: event.target.x,
                  y: point.y,
                });
              }
            }

            if (this.zoneTravailActive === 'select' && this.pointDragStart) {
              const xVariation = event.newPoint?.x - this.pointDragStart;
              for (
                let index = 0;
                index < this.chartRef.getSelectedPoints().length;
                index++
              ) {
                const element = this.chartRef.getSelectedPoints()[index];
                element.update({
                  x: element.index + xVariation,
                });
              }
            }
          },
        },
      },
      tooltip: {
        pointFormatter: function () {
          return (
            '<p style="font-family:Verdana">' +
            this.series.name +
            ' : <b>' +
            this.y +
            '°C</b></p>'
          );
        },
      },
    });
  }

  /**
   * Méthode permettant de changer l'orientation de l'axe pour modifier un ensemble de points
   */
  handleChangePoint() {
    this.positionPoint.update(value => (value === 'h' ? 'v' : 'h'));
  }

  handleChangeSeriesType() {
    this.seriesType.update(value => (value === 'line' ? 'spline' : 'line'));
    for (let index = 0; index < this.chartRef.series.length; index++) {
      const element = this.chartRef.series[index];
      element.update({
        type: this.seriesType() as any,
      });
    }
  }
}

import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  inject,
  NgZone,
  signal,
  OnInit,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import { BaseComponent } from '../../base/base.component';

@Component({
  selector: 'app-chart-signal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HighchartsChartModule,
  ],
  templateUrl: './chart-signal.component.html',
  styleUrl: './chart-signal.component.css',
})
export class ChartSignalComponent extends BaseComponent implements OnInit {
  ngZone = inject(NgZone);
  //A token that represents a dependency that should be injected
  data = signal<number[]>([1, 2, 3, 4]);
  //Create a Signal that can be set or updated directly.
  highcharts: typeof Highcharts = Highcharts;
  chartRef!: Highcharts.Chart;
  chartOptions!: Highcharts.Options;
  //definite assignment assertion operator (!) to tell the compiler that it will not be undefined for null when we run the code:
  updateChart = computed(() => this.initializeChart());
  //Create a computed Signal which derives a reactive value from an expression.

  serieData = 0;

  ngOnInit() {
    this.updateChart();
  }

  initializeChart() {
    return (this.chartOptions = {
      title: { text: 'Chart with Signals' },
      series: [
        {
          type: 'line',
          data: this.data(),
        },
      ],
    });
  }

  updateSeries() {
    //#runOutsideAngular allows you to escape Angular's zone and do work that doesn't trigger Angular change-detection
    this.ngZone.runOutsideAngular(() => {
      this.data.update(prev => [...prev, this.serieData]);
      this.serieData = 0;
      //Update the value of the signal based on its current value, and notify any dependents.
      this.updateChart();
      // initializeChart() will be called it , because (data) signal has been updated on every event  and computed will excecute it dependent on (data) signal
    });
  }
}

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HighchartsChartModule } from 'highcharts-angular';
import { WeatherChartComponent } from './HC/weather-chart/weather-chart.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HighchartsChartModule, WeatherChartComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'highcharts-test';
}

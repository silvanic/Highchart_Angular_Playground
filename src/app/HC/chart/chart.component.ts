import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import * as Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import Accessibility from 'highcharts/modules/accessibility';
import { BaseComponent } from '../../base/base.component';

Accessibility(Highcharts);

@Component({
  standalone: true,
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HighchartsChartModule,
  ],
})
export class ChartComponent extends BaseComponent implements OnInit {
  fb: FormBuilder = inject(FormBuilder);
  // réfèrence à l'objet Highchart pour faciliter l'appel à l'API
  Highcharts: typeof Highcharts = Highcharts;

  chartOptions: Highcharts.Options | any = {
    title: {
      text: 'Dynamic Series Chart',
    },
    series: [],
  };

  // formulaire Série
  formSeries = this.fb.group({
    seriesName: ['', [Validators.required]],
    seriesData: ['', [Validators.required]],
    seriesType: ['line'],
  });

  //formulaire Ajout élément dans une série
  element = 0;

  ngOnInit(): void {
    this.formSeries.controls['seriesData'].valueChanges.subscribe(value => {
      if (value) {
        if (value[value.length - 1] === ',') {
          this.formSeries.controls['seriesData'].setValue(value + '0');
        }
      }
    });
  }

  /**
   * Méthode permettant de créer une série
   */
  addSeries() {
    // on vérifie qu'il y ait au moins un nom avant de pouvoir créer une Serie
    if (this.formSeries.valid) {
      const value = this.formSeries.value;
      const newSeries: Highcharts.SeriesOptionsType = {
        type: value.seriesType as any,
        name: value.seriesName || '',
        data: value.seriesData?.split(',').map(Number),
      };
      this.chartOptions.series?.push(newSeries);
      // Update the series array
      this.updateChart();
      this.resetForm();
    }
  }

  /**
   * Méthode permettant de réinitialiser le formulaire après la création d'une Serie
   */
  resetForm() {
    this.formSeries.reset({
      seriesData: '',
      seriesName: '',
      seriesType: 'line',
    });
  }

  /**
   * Retourne la propriété data de n'importe quel élément (pb de typage en fonction des différents types de graphes)
   * @param item
   * @returns
   */
  getData(item: any) {
    return item.data;
  }

  /**
   * Méthode utilisée pour supprimer un élément d'une serie spécfiqieu à l'aide de différents index
   * @param index
   * @param j
   */
  deleteElement(index: number, j: number) {
    if (index > -1) {
      const serie: any = this.chartOptions.series?.splice(index, 1)[0];
      serie.data.splice(j, 1);
      this.chartOptions.series?.push(serie);
      this.updateChart();
    }
  }

  /**
   * Méthode utilisé pour ajouter un élément à une Serie spécifique
   * @param index
   */
  addElement(index: number) {
    const serie: any = this.chartOptions.series.splice(index, 1)[0];
    serie.data.push(Number(this.element));
    this.chartOptions.series?.push(serie);
    this.updateChart();
    this.element = 0;
  }

  /**
   * Méthode permettant de regénérer le chart globalement
   */
  updateChart() {
    Highcharts.chart('chart', this.chartOptions);
  }

  onSeriesDataKeyUp(event: KeyboardEvent) {
    if (!event.key.match(/^[0-9.,]+$/g)) {
      const value = this.formSeries.controls['seriesData'].value || '';
      const newValue = value.replace(event.key, '');
      this.formSeries.controls['seriesData'].setValue(newValue);
    }
  }
}

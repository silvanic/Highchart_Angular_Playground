export class BaseComponent {
  isNumber(element: any): boolean {
    return element != null && !isNaN(element);
  }
}

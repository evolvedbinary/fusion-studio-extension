export class ObjectClass {
  constructor(private multiplier = 1) {}
  multiply(value: number): number {
    return value * this.multiplier;
  }
}

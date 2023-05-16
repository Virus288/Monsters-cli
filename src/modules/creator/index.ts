import Abstraction from './abstraction';

export default class Creator {
  private readonly _abstraction: Abstraction;

  constructor(dir: string) {
    this._abstraction = new Abstraction(dir);
  }

  private get abstraction(): Abstraction {
    return this._abstraction;
  }

  generateModule(name: string): void {
    this.abstraction.modify(name);
  }
}

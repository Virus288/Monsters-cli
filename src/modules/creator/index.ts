import Abstraction from './abstraction';
import Module from './module';

export default class Creator {
  private readonly _abstraction: Abstraction;
  private readonly _module: Module;

  constructor(dir: string) {
    this._abstraction = new Abstraction(dir);
    this._module = new Module(dir);
  }

  private get abstraction(): Abstraction {
    return this._abstraction;
  }

  private get module(): Module {
    return this._module;
  }

  generateModule(name: string): void {
    this.abstraction.modify(name);
    this.module.generate(name);
  }
}

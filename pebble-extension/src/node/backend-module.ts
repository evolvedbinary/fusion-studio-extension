import { ContainerModule } from "inversify";
import { PebbleFilesClass } from "./files";
import { PebbleFiles } from "../common/files";
console.log('**** Files backend');
export default new ContainerModule(bind => {
  console.log('**** binding Files....');
  bind(PebbleFilesClass).toSelf().inSingletonScope();
  bind(PebbleFiles).toService(PebbleFilesClass);
  console.log('**** binding test....');
  bind('TESTS').toConstantValue('123' as any);
});
import { ContainerModule } from "inversify";
import { PebbleFilesClass } from "./files";
import { PebbleFiles, pebbleFilesePath } from "../common/files";
import { ConnectionHandler, JsonRpcConnectionHandler } from "@theia/core/lib/common";
console.log('**** Files backend');
export default new ContainerModule(bind => {
  console.log('**** binding Files....');
  bind(PebbleFilesClass).toSelf().inSingletonScope();
  bind(PebbleFiles).toService(PebbleFilesClass);
  bind(ConnectionHandler).toDynamicValue(ctx =>
    new JsonRpcConnectionHandler(pebbleFilesePath, () =>
      ctx.container.get(PebbleFiles)
    )
  ).inSingletonScope();
  console.log('**** binding test....');
  
});
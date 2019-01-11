import { ContainerModule } from "inversify";
import { PebbleFilesClass } from "./files";
import { PebbleFiles, pebbleFilesePath } from "../classes/files";
import { ConnectionHandler, JsonRpcConnectionHandler } from "@theia/core/lib/common";
export default new ContainerModule(bind => {
  bind(PebbleFilesClass).toSelf().inSingletonScope();
  bind(PebbleFiles).toService(PebbleFilesClass);
  bind(ConnectionHandler).toDynamicValue(ctx =>
    new JsonRpcConnectionHandler(pebbleFilesePath, () =>
      ctx.container.get(PebbleFiles)
    )
  ).inSingletonScope();
  
});
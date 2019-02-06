import { ContainerModule } from "inversify";
import { FSFilesClass } from "./files";
import { FSFiles, FSFilesePath } from "../classes/files";
import { ConnectionHandler, JsonRpcConnectionHandler } from "@theia/core/lib/common";
export default new ContainerModule(bind => {
  bind(FSFilesClass).toSelf().inSingletonScope();
  bind(FSFiles).toService(FSFilesClass);
  bind(ConnectionHandler).toDynamicValue(ctx =>
    new JsonRpcConnectionHandler(FSFilesePath, () =>
      ctx.container.get(FSFiles)
    )
  ).inSingletonScope();
  
});
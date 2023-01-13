import { databus, IResourceOpsCollect } from '@apitable/core';

export interface IDataStorageProvider {
  /**
   * @desc The method that applies command to generate an op, which is passed in as a callback function when the CommandManager is initialized.
   * This method is responsible for only two things.
   * 1. Apply the op generated by command to the local.
   * 2. Send op to intermediate layer via socket.
   * @param resourceOpsCollects
   */
  operationExecuted(resourceOpsCollects: IResourceOpsCollect[]): void;
}

export class DataStorageProvider implements databus.IDataStorageProvider {
  private readonly operationExecuted: IDataStorageProvider['operationExecuted'];

  constructor(options: IDataStorageProvider) {
    this.operationExecuted = options.operationExecuted;
  }

  loadDatasheetPack(dstId: string, options: databus.ILoadDatasheetPackOptions): Promise<IBaseDatasheetPack | null> | IBaseDatasheetPack | null {}

  saveOps(ops: IResourceOpsCollect[], options: databus.ISaveOpsOptions): Promise<any> | any {
    this.operationExecuted(ops);
  }
}

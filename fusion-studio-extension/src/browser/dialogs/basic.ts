import { FSAlertDialog, FSAlertDialogProps } from "./alert-dialog";

export namespace FSDialog {
  export function alert(message: string): Promise<any>;
  export function alert(title: string, message: string): Promise<any>;
  export function alert(title: string, message: string, secondaryMessage: string): Promise<any>;
  export function alert(options: FSAlertDialogProps): Promise<any>;
  export function alert(arg1: string | FSAlertDialogProps, arg2?: string, arg3?: string): Promise<any> {
    return new FSAlertDialog(typeof arg1 === 'string' ? {
      title: arg2 ? arg1 : 'FusionStudio',
      message: arg2 ? arg2 : arg1,
      secondaryMessage: arg3,
    } : arg1).open();
  }
}
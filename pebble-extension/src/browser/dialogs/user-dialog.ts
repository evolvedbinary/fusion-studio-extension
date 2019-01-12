import { injectable, inject } from "inversify";
import { DialogProps, AbstractDialog, DialogMode, DialogError, Message } from "@theia/core/lib/browser";
import { createError, PebbleError } from "../../classes/error";
import { PebbleUser, PebbleUserData } from "../../classes/user";
import { PebbleConnection } from "../../classes/connection";
import { IDialogField, createField } from "../../classes/dialog-field";

@injectable()
export class PebbleUserDialogProps extends DialogProps {
  readonly connection?: PebbleConnection;
  readonly acceptButton?: string;
  readonly cancelButton?: string;
  readonly initialValue?: PebbleUser;
}

export interface PebbleUserDialogResult extends PebbleUserData {};

export class PebbleUserDialog extends AbstractDialog<PebbleUserDialogResult> {

  protected readonly containerDiv: HTMLDivElement = document.createElement('div');
  protected readonly username: IDialogField = createField('username', '');
  protected readonly password: IDialogField = createField('password', '');
  protected readonly passwordConfirm: IDialogField = createField('confirm password', '');
  protected readonly passwordOld: IDialogField = createField('old password', '');
  protected readonly group: IDialogField;

  constructor(
    @inject(PebbleUserDialogProps) protected readonly props: PebbleUserDialogProps,
  ) {
    super(props);
    if (props.connection) {
      this.group = createField('group', '', props.connection.groups.map(group => ({ label: group, value: group })));
      this.containerDiv.appendChild(this.username.container);
      // this.containerDiv.appendChild(this.passwordOld.container);
      this.containerDiv.appendChild(this.password.container);
      this.containerDiv.appendChild(this.passwordConfirm.container);
      this.containerDiv.appendChild(this.group.container);
      
      this.containerDiv.className = 'dialog-container user-dialog-container vertical-form';
      this.contentNode.appendChild(this.containerDiv);

      this.appendAcceptButton(props.acceptButton || 'Add');
      this.appendCloseButton(props.cancelButton || 'Cancel');
    } else {
      throw createError(PebbleError.unknown);
    }
  }

  get value(): PebbleUserDialogResult {
    return {
      enabled: true,
      expired: false,
      groups: [],
      metadata: {},
      password: this.password.input.value,
      primaryGroup: this.group.input.value,
      userName: this.username.input.value,
    };
  }

  protected isValid(value: PebbleUserDialogResult, mode: DialogMode): DialogError {
    return true;
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.addUpdateListener(this.username.input, 'input');
    this.addUpdateListener(this.group.input, 'input');
    this.addUpdateListener(this.password.input, 'input');
    this.addUpdateListener(this.passwordOld.input, 'input');
    this.addUpdateListener(this.passwordConfirm.input, 'input');
  }

  protected onActivateRequest(msg: Message): void {
    this.username.input.focus();
  }

}

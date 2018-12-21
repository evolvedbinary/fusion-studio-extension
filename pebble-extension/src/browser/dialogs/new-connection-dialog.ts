import { injectable, inject } from "inversify";
import { DialogProps, AbstractDialog, DialogMode, DialogError, Message } from "@theia/core/lib/browser";
import { PebbleConnection } from "../../classes/connection";
import { IDialogField } from "../../classes/dialog-field";

@injectable()
export class PebbleConnectionDialogProps extends DialogProps {
  name?: string;
  server?: string;
  username?: string;
  password?: string;
}

function createField(label: string, className: string, type ='text'): IDialogField {
  const result: IDialogField = {
    container: document.createElement('div'),
    input: document.createElement('input'),
    label: document.createElement('span'),
  };
  result.input.type = type;
  result.container.className = className;
  result.label.innerHTML = label;
  result.container.appendChild(result.label);
  result.container.appendChild(result.input);
  return result;
}

export interface NewConnectionDialogResult {
  connection: PebbleConnection;
  autoConnect?: boolean;
}

export class NewConnectionDialog extends AbstractDialog<NewConnectionDialogResult> {

  protected readonly usernameField: IDialogField;
  protected readonly passwordField: IDialogField;
  protected readonly serverField: IDialogField;
  protected readonly nameField: IDialogField;
  protected readonly containerDiv: HTMLDivElement = document.createElement('div');

  constructor(
    @inject(PebbleConnectionDialogProps) protected readonly props: PebbleConnectionDialogProps
  ) {
    super(props);

    this.nameField = createField('Name:', 'name-field');
    this.serverField = createField('Server:', 'server-field');
    this.usernameField = createField('Username:', 'username-field');
    this.passwordField = createField('Password:', 'password-field', 'password');
    this.nameField.input.value = props.name || '';
    this.serverField.input.value = props.server || '';
    this.usernameField.input.value = props.username || '';
    this.passwordField.input.value = props.password || '';
    this.containerDiv.appendChild(this.nameField.container);
    this.containerDiv.appendChild(this.serverField.container);
    this.containerDiv.appendChild(this.usernameField.container);
    this.containerDiv.appendChild(this.passwordField.container);
    
    this.containerDiv.className = 'new-connection-dialog-container';
    this.contentNode.appendChild(this.containerDiv);

    this.appendAcceptButton('Connect');
    this.appendCloseButton('Cancel');
  }

  get value(): NewConnectionDialogResult {
    return {
        connection: {
          name: this.nameField.input.value || '',
          server: this.serverField.input.value || '',
          username: this.usernameField.input.value || '',
          password: this.passwordField.input.value || '',
        },
        autoConnect: false,
      };
  }

  protected isValid(value: NewConnectionDialogResult, mode: DialogMode): DialogError {
    return !!(
      value.connection.name &&
      value.connection.server
    );
    // return super.isValid(value, mode);
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.addUpdateListener(this.nameField.input, 'input');
    this.addUpdateListener(this.serverField.input, 'input');
    this.addUpdateListener(this.usernameField.input, 'input');
    this.addUpdateListener(this.passwordField.input, 'input');
  }

  protected onActivateRequest(msg: Message): void {
    this.nameField.input.focus();
  }

}

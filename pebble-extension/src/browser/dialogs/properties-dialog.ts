import { injectable, inject } from "inversify";
import { DialogProps, AbstractDialog, DialogMode, DialogError, Message } from "@theia/core/lib/browser";
import { IKeysElement, createKeys, addKeys } from "../../classes/keys";
import { PebbleItem } from "../../classes/item";

@injectable()
export class PebblePropertiesDialogProps extends DialogProps {
  readonly acceptButton?: string;
  readonly cancelButton?: string;
  readonly item?: PebbleItem;
  // readonly name?: string;
  // readonly server?: string;
  // readonly username?: string;
  // readonly password?: string;
}

export interface PebblePropertiesDialogResult {
  // connection: PebbleProperties;
  // autoConnect?: boolean;
}

export class PebblePropertiesDialog extends AbstractDialog<PebblePropertiesDialogResult> {

  protected readonly keys: IKeysElement = createKeys({});
  // protected readonly passwordField: IDialogField;
  // protected readonly serverField: IDialogField;
  // protected readonly nameField: IDialogField;
  protected readonly containerDiv: HTMLDivElement = document.createElement('div');

  constructor(
    @inject(PebblePropertiesDialogProps) protected readonly props: PebblePropertiesDialogProps
  ) {
    super(props);
    if (props.item) {
      addKeys({
        'Name': props.item.name,
        'Created': props.item.created,
      }, this.keys);
      if (PebbleItem.isDocument(props.item)) {
        addKeys({
          'Modified': props.item.lastModified,
          'Media Type': props.item.mediaType,
          'Binary': props.item.binaryDoc ? 'Yes' : 'No',
          'size': props.item.size,
        }, this.keys);
      }
    }

    // this.nameField = createField('Name:', 'name-field');
    // this.serverField = createField('Server:', 'server-field');
    // this.usernameField = createField('Username:', 'username-field');
    // this.passwordField = createField('Password:', 'password-field', 'password');
    // this.nameField.input.value = props.name || '';
    // this.serverField.input.value = props.server || '';
    // this.usernameField.input.value = props.username || '';
    // this.passwordField.input.value = props.password || '';
    // this.containerDiv.appendChild(this.nameField.container);
    // this.containerDiv.appendChild(this.serverField.container);
    // this.containerDiv.appendChild(this.usernameField.container);
    this.containerDiv.appendChild(this.keys.container);
    
    this.containerDiv.className = 'dialog-container';
    this.contentNode.appendChild(this.containerDiv);

    this.appendAcceptButton(props.acceptButton || 'Save');
    this.appendCloseButton(props.cancelButton || 'Close');
  }

  get value(): PebblePropertiesDialogResult {
    return {
        // connection: {
        //   name: this.nameField.input.value || '',
        //   server: this.serverField.input.value || '',
        //   username: this.usernameField.input.value || '',
        //   password: this.passwordField.input.value || '',
        // },
        // autoConnect: false,
      };
  }

  protected isValid(value: PebblePropertiesDialogResult, mode: DialogMode): DialogError {
    // return !!(
    //   value.connection.name &&
    //   value.connection.server
    // );
    return super.isValid(value, mode);
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    // this.addUpdateListener(this.nameField.input, 'input');
    // this.addUpdateListener(this.serverField.input, 'input');
    // this.addUpdateListener(this.usernameField.input, 'input');
    // this.addUpdateListener(this.passwordField.input, 'input');
  }

  protected onActivateRequest(msg: Message): void {
    // this.nameField.input.focus();
  }

}

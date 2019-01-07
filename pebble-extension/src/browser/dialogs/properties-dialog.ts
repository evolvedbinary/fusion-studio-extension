import { injectable, inject } from "inversify";
import { DialogProps, AbstractDialog, DialogMode, DialogError, Message } from "@theia/core/lib/browser";
import { IKeysElement, createKeys, addKeys, addKey } from "../../classes/keys";
import { PebbleItem } from "../../classes/item";
import { PebblePermissionsEditor } from "./permissions-editor";

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
  protected readonly permissions: PebblePermissionsEditor = new PebblePermissionsEditor();

  constructor(
    @inject(PebblePropertiesDialogProps) protected readonly props: PebblePropertiesDialogProps,
  ) {
    super(props);
    if (props.item) {
      addKeys({
        'Name': props.item.name,
        'Created': { type: 'date', value: props.item.created },
      }, this.keys);
      if (PebbleItem.isDocument(props.item)) {
        addKeys({
          'Modified': { type: 'date', value: props.item.lastModified },
          'Media Type': props.item.mediaType,
          'Binary': props.item.binaryDoc ? 'Yes' : 'No',
        }, this.keys);
        if (props.item.binaryDoc) {
          addKey('size', { type: 'size', value: props.item.size }, this.keys);
        }
      }
      addKeys({
        '-owner/group': '-',
        'Owner': props.item.owner,
        'Group': props.item.group,
        '-separator': '-',
      }, this.keys);
      this.permissions.permissions = props.item.permissions;
      console.log(this.permissions);
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
    this.containerDiv.appendChild(this.permissions.container);
    
    this.containerDiv.className = 'dialog-container properties-dialog-container';
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

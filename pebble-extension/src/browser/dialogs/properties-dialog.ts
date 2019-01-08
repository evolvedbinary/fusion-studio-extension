import { injectable, inject } from "inversify";
import { DialogProps, AbstractDialog, DialogMode, DialogError, Message } from "@theia/core/lib/browser";
import { IKeysElement, createKeys, addKeys, addKey } from "../../classes/keys";
import { PebbleItem, PebblePermissions, samePermissions } from "../../classes/item";
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
  permissions?: PebblePermissions;
  binary: boolean;
  name: string;
}

export class PebblePropertiesDialog extends AbstractDialog<PebblePropertiesDialogResult> {

  protected readonly keys: IKeysElement = createKeys({});
  protected readonly name: HTMLInputElement = document.createElement('input');
  // protected readonly serverField: IDialogField;
  // protected readonly nameField: IDialogField;
  protected readonly containerDiv: HTMLDivElement = document.createElement('div');
  protected readonly convertBtn: HTMLButtonElement = document.createElement('button');
  protected readonly convertTxt: HTMLSpanElement = document.createElement('span');
  protected readonly convertIcn: HTMLSpanElement = document.createElement('span');
  protected readonly permissionsEditor: PebblePermissionsEditor = new PebblePermissionsEditor();

  constructor(
    @inject(PebblePropertiesDialogProps) protected readonly props: PebblePropertiesDialogProps,
  ) {
    super(props);
    if (props.item) {
      const slash = props.item.name.lastIndexOf('/');
      this.name.type = 'text';
      this.name.value = props.item.name.substr(slash + 1);
      this.name.addEventListener('focus', e => this.name.select());
      addKeys({
        'Name': {
          type: 'string',
          value: '',
          el: this.name,
        },
        'Collection': props.item.name.substr(0, slash),
        'Created': { type: 'date', value: props.item.created },
      }, this.keys);
      if (PebbleItem.isDocument(props.item)) {
        this.convertIcn.className = 'fa-fw fa fa-arrows-h';
        this.convertBtn.append(this.convertIcn);
        this.convertTxt.innerHTML = 'Convert to ' + (props.item.binaryDoc ? 'non-' : '') + 'binary';
        this.convertBtn.append(this.convertTxt);
        addKeys({
          'Modified': { type: 'date', value: props.item.lastModified },
          'Media Type': props.item.mediaType,
          'Binary': {
            type: 'string',
            value: props.item.binaryDoc ? 'Yes' : 'No',
            el: this.convertBtn,
          },
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
      this.permissionsEditor.permissions = props.item.permissions;
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
    this.containerDiv.appendChild(this.permissionsEditor.table);
    
    this.containerDiv.className = 'dialog-container properties-dialog-container';
    this.contentNode.appendChild(this.containerDiv);

    this.appendAcceptButton(props.acceptButton || 'Save');
    this.appendCloseButton(props.cancelButton || 'Close');
  }

  get value(): PebblePropertiesDialogResult {
    return {
      permissions: this.permissionsEditor.permissions,
      binary: PebbleItem.isDocument(this.props.item) && this.props.item.binaryDoc,
      name: this.name.value
    };
  }

  protected isValid(value: PebblePropertiesDialogResult, mode: DialogMode): DialogError {
    return PebbleItem.is(this.props.item) && (!samePermissions(this.props.item.permissions, value.permissions) || value.name != this.props.item.name.substr(this.props.item.name.lastIndexOf('/') + 1)) ||
      PebbleItem.isDocument(this.props.item) && (this.props.item.binaryDoc !== this.props.item.binaryDoc);
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.addUpdateListener(this.name, 'input');
    this.permissionsEditor.addUpdateListeners(this.addUpdateListener.bind(this));
    // this.addUpdateListener(this.serverField.input, 'input');
    // this.addUpdateListener(this.usernameField.input, 'input');
    // this.addUpdateListener(this.passwordField.input, 'input');
  }

  protected onActivateRequest(msg: Message): void {
    // this.nameField.input.focus();
  }

}

import { injectable, inject } from "inversify";
import { DialogProps, AbstractDialog, DialogMode, DialogError, Message } from "@theia/core/lib/browser";
import { IKeysElement, createKeys, addKeys, addKey } from "../../classes/keys";
import { PebbleItem, PebblePermissions, samePermissions, PebbleCollection, PebbleDocument } from "../../classes/item";
import { PebblePermissionsEditor } from "./permissions-editor";
import { PebbleNode, PebbleDocumentNode } from "../../classes/node";
import { createError, PebbleError } from "../../common/error";
import { PebbleApi } from "../../common/api";

const SPINNER = 'fa-fw fa fa-spin fa-spinner';
const ARROWS_XML = 'fa-fw fa fa-file-code-o';
const ARROWS_BIN = 'fa-fw fa fa-file-o';
const CANT_CONVERT = 'fa-fw fa fa-exclamation';

@injectable()
export class PebblePropertiesDialogProps extends DialogProps {
  readonly acceptButton?: string;
  readonly cancelButton?: string;
  readonly node?: PebbleNode;
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
  protected readonly convertBtn = {
    button: document.createElement('button'),
    text: document.createElement('span'),
    icon: document.createElement('span'),
  };
  protected readonly permissionsEditor: PebblePermissionsEditor = new PebblePermissionsEditor();

  constructor(
    @inject(PebblePropertiesDialogProps) protected readonly props: PebblePropertiesDialogProps,
  ) {
    super(props);
    if (props.node) {
      const slash = props.node.name.lastIndexOf('/');
      this.name.type = 'text';
      this.name.value = props.node.name.substr(slash + 1);
      this.name.addEventListener('focus', e => this.name.select());
      const item = PebbleNode.isCollection(props.node) ? props.node.collection as PebbleCollection : (props.node as PebbleDocumentNode).document as PebbleDocument;
      addKeys({
        'Name': {
          type: 'string',
          value: '',
          el: this.name,
        },
        'Collection': item.name.substr(0, slash),
        'Created': { type: 'date', value: item.created },
      }, this.keys);
      if (PebbleItem.isDocument(item)) {
        this.convertBtn.icon.className = item.binaryDoc ? ARROWS_XML : ARROWS_BIN;
        this.convertBtn.button.append(this.convertBtn.icon);
        this.convertBtn.text.innerHTML = 'Convert to ' + (item.binaryDoc ? 'non-' : '') + 'binary';
        this.convertBtn.button.append(this.convertBtn.text);
        this.convertBtn.button.addEventListener('click', async () => {
          this.convertBtn.icon.className = SPINNER;
          this.convertBtn.button.disabled = true;
          try {
            if (await this.convert()) {
              // converted
              this.convertBtn.button.disabled = false;
            } else {
              // not converted
              this.convertBtn.text.innerHTML = 'This document can\'t be converted';
              this.convertBtn.icon.className = CANT_CONVERT;
              return;
            }
          } catch (e) {
            // error
            this.convertBtn.button.disabled = false;
          }
          this.convertBtn.icon.className = item.binaryDoc ? ARROWS_XML : ARROWS_BIN;
        })
        addKeys({
          'Modified': { type: 'date', value: item.lastModified },
          'Media Type': item.mediaType,
          'Binary': {
            type: 'string',
            value: item.binaryDoc ? 'Yes' : 'No',
            el: this.convertBtn.button,
          },
        }, this.keys);
        if (item.binaryDoc) {
          addKey('size', { type: 'size', value: item.size }, this.keys);
        }
      }
      addKeys({
        '-owner/group': '-',
        'Owner': item.owner,
        'Group': item.group,
        '-separator': '-',
      }, this.keys);
      this.permissionsEditor.permissions = item.permissions;
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

  async convert(): Promise<boolean> {
    if (PebbleNode.isDocument(this.props.node)) {
      return PebbleApi.convert(this.props.node.connection, this.props.node.document);
    } else {
      throw createError(PebbleError.unknown);
    }
    // return new Promise(resolve => setTimeout(() => resolve(true), 1000));
  }

  get value(): PebblePropertiesDialogResult {
    return {
      permissions: this.permissionsEditor.permissions,
      binary: PebbleItem.isDocument(this.props.node) && this.props.node.binaryDoc,
      name: this.name.value
    };
  }

  protected isValid(value: PebblePropertiesDialogResult, mode: DialogMode): DialogError {
    return PebbleItem.is(this.props.node) && (!samePermissions(this.props.node.permissions, value.permissions) || value.name != this.props.node.name.substr(this.props.node.name.lastIndexOf('/') + 1)) ||
      PebbleItem.isDocument(this.props.node) && (this.props.node.binaryDoc !== this.props.node.binaryDoc);
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

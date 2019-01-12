import { injectable, inject } from "inversify";
import { DialogProps, AbstractDialog, DialogMode, DialogError, Message } from "@theia/core/lib/browser";
import { IKeysElement, createKeys, addKeys, addKey } from "../../classes/keys";
import { PebbleItem, PebblePermissions, samePermissions, PebbleCollection, PebbleDocument } from "../../classes/item";
import { PebblePermissionsEditor } from "./permissions-editor";
import { PebbleNode, PebbleDocumentNode } from "../../classes/node";
import { createError, PebbleError } from "../../classes/error";
import { PebbleApi } from "../../common/api";

const SPINNER = 'fa-fw fa fa-spin fa-spinner';
const CONVERT_XML = 'fa-fw fa fa-file-code-o';
const CONVERT_BIN = 'fa-fw fa fa-file-o';
const CANT_CONVERT = 'fa-fw fa fa-exclamation';

@injectable()
export class PebblePropertiesDialogProps extends DialogProps {
  readonly acceptButton?: string;
  readonly cancelButton?: string;
  readonly node?: PebbleNode;
  validate?: (filename: string) => boolean;
}

export interface PebblePropertiesDialogResult {
  permissions?: PebblePermissions;
  binary: boolean;
  name: string;
  owner: string;
  group: string;
}

export class PebblePropertiesDialog extends AbstractDialog<PebblePropertiesDialogResult> {

  protected readonly keys: IKeysElement = createKeys({});
  protected readonly nameField: HTMLInputElement = document.createElement('input');
  protected name: string = '';
  protected item?: PebbleCollection | PebbleDocument;
  protected readonly containerDiv: HTMLDivElement = document.createElement('div');
  protected readonly ownerSelect: HTMLSelectElement = document.createElement('select');
  protected readonly groupSelect: HTMLSelectElement = document.createElement('select');
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
      this.name = props.node.name.substr(slash + 1);
      this.nameField.type = 'text';
      this.nameField.value = this.name;
      this.nameField.addEventListener('focus', e => this.nameField.select());
      const item = PebbleNode.isCollection(props.node) ? props.node.collection as PebbleCollection : (props.node as PebbleDocumentNode).document as PebbleDocument;
      this.item = item;
      addKeys({
        'Name': {
          type: 'string',
          value: '',
          el: this.nameField,
        },
        'Collection': item.name.substr(0, slash),
        'Created': { type: 'date', value: item.created },
      }, this.keys);
      if (PebbleItem.isDocument(item)) {
        this.convertBtn.icon.className = item.binaryDoc ? CONVERT_XML : CONVERT_BIN;
        this.convertBtn.button.append(this.convertBtn.icon);
        this.convertBtn.text.innerHTML = 'Convert to ' + (item.binaryDoc ? 'non-' : '') + 'binary';
        this.convertBtn.button.append(this.convertBtn.text);
        this.convertBtn.button.addEventListener('click', async () => {
          this.convertBtn.icon.className = SPINNER;
          this.convertBtn.button.disabled = true;
          try {
            if (await this.convert()) {
              // TODO: converted
              this.convertBtn.button.disabled = false;
            } else {
              // TODO: not converted
              this.convertBtn.text.innerHTML = 'This document can\'t be converted';
              this.convertBtn.icon.className = CANT_CONVERT;
              return;
            }
          } catch (e) {
            // TODO: error
            this.convertBtn.button.disabled = false;
          }
          this.convertBtn.icon.className = item.binaryDoc ? CONVERT_XML : CONVERT_BIN;
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
      props.node.connectionNode.connection.users.forEach(user => {
        const option = document.createElement('option');
        option.innerHTML = user;
        option.setAttribute('value', user);
        this.ownerSelect.append(option);
      });
      this.ownerSelect.value = item.owner;
      props.node.connectionNode.connection.groups.forEach(group => {
        const option = document.createElement('option');
        option.innerHTML = group;
        option.setAttribute('value', group);
        this.groupSelect.append(option);
      });
      this.groupSelect.value = item.group;
      addKeys({
        '-owner/group': '-',
        'Owner': {
          type: 'string',
          value: '',
          el: this.ownerSelect,
        },
        'Group': {
          type: 'string',
          value: '',
          el: this.groupSelect,
        },
        '-separator': '-',
      }, this.keys);
      this.permissionsEditor.permissions = item.permissions;
    }
    this.containerDiv.appendChild(this.keys.container);
    this.containerDiv.appendChild(this.permissionsEditor.table);
    
    this.containerDiv.className = 'dialog-container properties-dialog-container';
    this.contentNode.appendChild(this.containerDiv);

    this.appendAcceptButton(props.acceptButton || 'Save');
    this.appendCloseButton(props.cancelButton || 'Close');
  }

  async convert(): Promise<boolean> {
    if (PebbleNode.isDocument(this.props.node)) {
      return PebbleApi.convert(this.props.node.connectionNode.connection, this.props.node.document);
    } else {
      throw createError(PebbleError.unknown);
    }
  }

  get value(): PebblePropertiesDialogResult {
    return {
      permissions: this.permissionsEditor.permissions,
      binary: PebbleItem.isDocument(this.props.node) && this.props.node.binaryDoc,
      owner: this.ownerSelect.value,
      group: this.groupSelect.value,
      name: this.nameField.value
    };
  }

  protected isValid(value: PebblePropertiesDialogResult, mode: DialogMode): DialogError {
    const sameName = value.name === this.name;
    const sameOwner = value.owner === (this.item ? this.item.owner : '');
    const sameGroup = value.group === (this.item ? this.item.group : '');
    const item = PebbleNode.isCollection(this.props.node) ? this.props.node.collection as PebbleCollection : (this.props.node as PebbleDocumentNode).document as PebbleDocument;
    const same = samePermissions(item.permissions, value.permissions) && sameName && sameGroup && sameOwner ;
    let validName = true;
    if (!sameName && this.props.validate) {
      validName = this.props.validate(value.name);
    }
    return !same && validName;
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.addUpdateListener(this.nameField, 'input');
    this.addUpdateListener(this.ownerSelect, 'input');
    this.addUpdateListener(this.groupSelect, 'input');
    this.permissionsEditor.addUpdateListeners(this.addUpdateListener.bind(this));
  }

  protected onActivateRequest(msg: Message): void {
    this.nameField.focus();
  }

}
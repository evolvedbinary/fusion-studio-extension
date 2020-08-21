import { injectable, inject } from "inversify";
import { DialogProps, AbstractDialog, DialogMode, DialogError, Message } from "@theia/core/lib/browser";
import { IKeysElement, createKeys, addKeys, addKey } from "../../classes/keys";
import { FSItem, FSPermissions, samePermissions, FSCollection, FSDocument } from "../../classes/item";
import { FSPermissionsEditor } from "./permissions-editor";
import { FSNode, FSDocumentNode } from "../../classes/node";
import { createError, FSError } from "../../classes/error";
import { FSApi } from "../../common/api";
import { autocomplete, autocompleteChanges } from '../../classes/autocomplete';

const SPINNER = 'fa-fw fa fa-spin fa-spinner';
const CONVERT_XML = 'fa-fw fa fa-file-code-o';
const CONVERT_BIN = 'fa-fw fa fa-file-o';
const CANT_CONVERT = 'fa-fw fa fa-exclamation';

@injectable()
export class FSPropertiesDialogProps extends DialogProps {
  readonly acceptButton?: string;
  readonly cancelButton?: string;
  readonly node?: FSNode;
  validate?: (filename: string) => boolean;
}

export interface FSPropertiesDialogResult {
  permissions?: FSPermissions;
  binary: boolean;
  name: string;
  owner: string;
  group: string;
}

export class FSPropertiesDialog extends AbstractDialog<FSPropertiesDialogResult> {

  protected readonly keys: IKeysElement = createKeys({});
  protected readonly nameField: HTMLInputElement = document.createElement('input');
  protected name: string = '';
  protected item?: FSCollection | FSDocument;
  protected readonly containerDiv: HTMLDivElement = document.createElement('div');
  protected readonly ownerSelect: HTMLInputElement = document.createElement('input');
  protected readonly groupSelect: HTMLInputElement = document.createElement('input');
  protected readonly convertBtn = {
    button: document.createElement('button'),
    text: document.createElement('span'),
    icon: document.createElement('span'),
  };
  protected readonly permissionsEditor: FSPermissionsEditor = new FSPermissionsEditor();

  constructor(
    @inject(FSPropertiesDialogProps) protected readonly props: FSPropertiesDialogProps,
  ) {
    super(props);
    if (props.node) {
      const item = FSNode.isCollection(props.node) ? props.node.collection as FSCollection : (props.node as FSDocumentNode).document as FSDocument;
      const slash = item.name.lastIndexOf('/');
      this.name = this.getName(props.node.id);
      this.nameField.value = this.name;
      this.nameField.type = 'text';
      this.nameField.className = 'theia-input';
      this.nameField.addEventListener('focus', e => this.nameField.select());
      this.item = item;
      const collectionKey: any = props.node.uri === '/db' ? {} : { 'Collection': item.name.substr(0, slash) };
      addKeys({
        'Name': {
          type: 'string',
          value: '',
          el: this.nameField,
        },
        ...collectionKey,
        'Created': { type: 'date', value: item.created },
      }, this.keys);
      if (FSItem.isDocument(item)) {
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
        this.convertBtn.button.className = 'theia-button';
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
          addKey('Size', { type: 'size', value: item.size }, this.keys);
        }
      }
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
      autocomplete(this.ownerSelect, props.node.connectionNode.connection.users);
      this.ownerSelect.value = item.owner;
      this.ownerSelect.type = 'text';
      this.ownerSelect.className = 'theia-input';
      autocomplete(this.groupSelect, props.node.connectionNode.connection.groups);
      this.groupSelect.value = item.group;
      this.groupSelect.type = 'text';
      this.groupSelect.className = 'theia-input';
    }
    this.containerDiv.appendChild(this.keys.container);
    this.containerDiv.appendChild(this.permissionsEditor.table);
    
    this.containerDiv.className = 'dialog-container properties-dialog-container';
    this.contentNode.appendChild(this.containerDiv);

    this.appendAcceptButton(props.acceptButton || 'Save');
    this.appendCloseButton(props.cancelButton || 'Close');
  }

  public getName(id: string): string {
    return id.split('/').pop() || id;
  }

  async convert(): Promise<boolean> {
    if (FSNode.isDocument(this.props.node)) {
      return FSApi.convert(this.props.node.connectionNode.connection, this.props.node.document);
    } else {
      throw createError(FSError.unknown);
    }
  }

  get value(): FSPropertiesDialogResult {
    return {
      permissions: this.permissionsEditor.permissions,
      binary: FSItem.isDocument(this.props.node) && this.props.node.binaryDoc,
      owner: this.ownerSelect.value,
      group: this.groupSelect.value,
      name: this.nameField.value
    };
  }

  protected isValid(value: FSPropertiesDialogResult, mode: DialogMode): DialogError {
    if (this.props.node && this.props.node.connectionNode.connection.groups.indexOf(value.group) < 0) {
      return false;
    }
    if (this.props.node && this.props.node.connectionNode.connection.users.indexOf(value.owner) < 0) {
      return false;
    }
    const sameName = value.name === this.name;
    const sameOwner = value.owner === (this.item ? this.item.owner : '');
    const sameGroup = value.group === (this.item ? this.item.group : '');
    const item = FSNode.isCollection(this.props.node) ? this.props.node.collection as FSCollection : (this.props.node as FSDocumentNode).document as FSDocument;
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
    autocompleteChanges(this.ownerSelect, this.addUpdateListener.bind(this));
    this.addUpdateListener(this.groupSelect, 'input');
    autocompleteChanges(this.groupSelect, this.addUpdateListener.bind(this));
    this.permissionsEditor.addUpdateListeners(this.addUpdateListener.bind(this));
  }

  protected onActivateRequest(msg: Message): void {
    this.nameField.focus();
  }

}

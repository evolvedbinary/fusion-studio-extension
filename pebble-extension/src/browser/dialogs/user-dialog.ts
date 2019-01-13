import { injectable, inject } from "inversify";
import { DialogProps, AbstractDialog, DialogMode, DialogError, Message } from "@theia/core/lib/browser";
import { createError, PebbleError } from "../../classes/error";
import { PebbleUser, PebbleUserData, PebbleAttributes, sameUser } from "../../classes/user";
import { PebbleConnection } from "../../classes/connection";
import { IDialogField, createField } from "../../classes/dialog-field";
import { PebbleTabs } from "../../classes/tabs";
import { createKeys, IKeysElement, addKey } from "../../classes/keys";
import { Checkbox } from "../../classes/checkbox";

@injectable()
export class PebbleUserDialogProps extends DialogProps {
  readonly connection?: PebbleConnection;
  readonly acceptButton?: string;
  readonly cancelButton?: string;
  readonly user?: PebbleUser;
}

export type PebbleUserDialogResult = PebbleUserData;

export class PebbleUserDialog extends AbstractDialog<PebbleUserDialogResult> {

  protected metadataCounter: number = 0;
  protected readonly statusKeys: IKeysElement = createKeys({});
  protected readonly groupsKeys: IKeysElement = createKeys({});
  protected readonly metadataKeys: IKeysElement = createKeys({});
  protected readonly groups: { [k: string]: Checkbox } = {};
  protected readonly isEnabled: Checkbox;
  protected readonly isExpired: Checkbox;
  protected readonly containerDiv: HTMLDivElement = document.createElement('div');
  protected readonly username: IDialogField = createField('Username', '');
  protected readonly password: IDialogField = createField('Password', '', 'password');
  protected readonly passwordConfirm: IDialogField = createField('Confirm password', '', 'password');
  protected readonly passwordOld: IDialogField = createField('Old password', '', 'password');
  protected readonly group: IDialogField;
  protected readonly tabs: PebbleTabs = new PebbleTabs(['Credentials', 'Groups', 'Metadata']);

  constructor(
    @inject(PebbleUserDialogProps) protected readonly props: PebbleUserDialogProps,
  ) {
    super(props);
    if (props.connection) {
      this.group = createField('Primary group', '', props.connection.groups.map(group => ({ label: group, value: group })));
      this.group.input.addEventListener('change', e => Object.keys(this.groups).forEach(group => {
        if (group === this.group.input.value) {
          this.groups[group].disabled = true;
          this.groups[group].checked = true;
        } else {
          this.groups[group].disabled = false;
        }
      }));
      this.tabs.tabs.forEach(tab => tab.classList.add('vertical-form'));
      this.isEnabled = new Checkbox('Enabled', true);
      this.isExpired = new Checkbox('Expired');
      
      this.tabs.tabs[0].appendChild(this.username.container);
      // this.tabs.tabs[0].appendChild(this.passwordOld.container);
      this.tabs.tabs[0].appendChild(this.password.container);
      this.tabs.tabs[0].appendChild(this.passwordConfirm.container);
      this.tabs.tabs[0].appendChild(this.isEnabled.container);
      this.tabs.tabs[0].appendChild(this.isExpired.container);

      this.groupsKeys.container.classList.add('no-label');
      props.connection.groups.forEach(group => {
        this.groups[group] = new Checkbox(group, props.user ? props.user.groups.indexOf(group) > -1 : group === this.group.input.value);
        addKey(group, {
          type: 'string',
          value: '',
          el: this.groups[group].container,
        }, this.groupsKeys)
      });
      const label = document.createElement('div');
      label.style.fontWeight = 'bold';
      label.innerText = 'Groups';
      this.tabs.tabs[1].appendChild(this.group.container);
      this.tabs.tabs[1].appendChild(label);
      this.tabs.tabs[1].appendChild(this.groupsKeys.container);
      
      const addMetadataButton = document.createElement('button');
      addMetadataButton.innerHTML = 'Add attribute';
      addMetadataButton.addEventListener('click', e => {
        this.sortMetadata();
        this.addMetadata();
      });
      this.tabs.tabs[2].appendChild(this.metadataKeys.container);
      this.tabs.tabs[2].appendChild(addMetadataButton);
      
      if (props.user) {
        this.group.input.value = props.user.primaryGroup;
        this.username.input.value = props.user.userName;
        this.isEnabled.checked = props.user.enabled;
        this.isExpired.checked = props.user.expired;
        this.writeMetadata(props.user.metadata);
      }
      this.group.input.dispatchEvent(new Event('change'));
      this.addMetadata();

      this.containerDiv.appendChild(this.tabs.container);
      this.containerDiv.className = 'dialog-container user-dialog-container';
      this.contentNode.appendChild(this.containerDiv);

      this.appendAcceptButton(props.acceptButton || 'Add');
      this.appendCloseButton(props.cancelButton || 'Cancel');
    } else {
      throw createError(PebbleError.unknown);
    }
  }

  readMetadata(): PebbleAttributes {
    const result: PebbleAttributes = {};
    for (let i in this.metadataKeys.data) {
      const item = this.metadataKeys.data[i];
      if (item.inputs) {
        if (item.inputs.key.value) {
          result[item.inputs.key.value] = item.inputs.value.value;
        }
      }
    }
    return result;
  }
  writeMetadata(metadata: PebbleAttributes) {
    for (let i in metadata) {
      this.addMetadata(i, metadata[i]);
    }
  }
  clearMetadata() {
    for (let i in this.metadataKeys.data) {
      const item = this.metadataKeys.data[i];
      if (item.inputs) {
        item.label.removeChild(item.inputs.key);
        item.value.removeChild(item.inputs.value);
      }
      item.row.removeChild(item.label);
      item.row.removeChild(item.value);
      this.metadataKeys.container.removeChild(item.row);
      delete(this.metadataKeys.data[i]);
    }
  }
  sortMetadata() {
    const metadata = this.readMetadata();
    this.clearMetadata();
    this.writeMetadata(metadata);
  }
  addMetadata(key: string = '', value: string = '') {
    addKey(key, value, this.metadataKeys, (this.metadataCounter++).toString());
  }

  get value(): PebbleUserDialogResult {
    // passwordOld: this.passwordOld.input.value,
    const password = this.password.input.value === this.passwordConfirm.input.value ? this.password.input.value : '';
    return {
      enabled: this.isEnabled.checked,
      expired: this.isExpired.checked,
      groups: Object.keys(this.groups).filter(group => this.groups[group].checked),
      metadata: this.readMetadata(),
      password,
      primaryGroup: this.group.input.value,
      userName: this.username.input.value,
    };
  }

  protected isValid(value: PebbleUserDialogResult, mode: DialogMode): DialogError {
    const valid = !!value.userName && !!value.password;
    if (this.props.user) {
      return valid && !sameUser(value, this.props.user);
    } else {
      return valid;
    }
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.addUpdateListener(this.username.input, 'input');
    this.addUpdateListener(this.group.input, 'input');
    this.addUpdateListener(this.password.input, 'input');
    this.addUpdateListener(this.passwordOld.input, 'input');
    this.addUpdateListener(this.passwordConfirm.input, 'input');
    this.addUpdateListener(this.isEnabled.container, 'click')
    this.addUpdateListener(this.isExpired.container, 'click')
    Object.keys(this.groups).forEach(group => this.addUpdateListener(this.groups[group].container, 'click'));
    Object.keys(this.metadataKeys.data).forEach(key => {
      const inputs = this.metadataKeys.data[key].inputs;
      if (inputs) {
        this.addUpdateListener(inputs.key, 'input');
        this.addUpdateListener(inputs.value, 'input');
      }
    });
  }

  protected onActivateRequest(msg: Message): void {
    this.username.input.focus();
  }

}

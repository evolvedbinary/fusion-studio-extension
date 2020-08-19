import { injectable, inject } from "inversify";
import { DialogProps, AbstractDialog, DialogMode, DialogError, Message } from "@theia/core/lib/browser";
import { createError, FSError } from "../../classes/error";
import { FSUser, FSUserData, FSUserAttributes, sameUser, FS_USER_ATTRIBUTE_LABELS } from "../../classes/user";
import { FSServerConnection } from "../../classes/connection";
import { IDialogField, createField } from "../../classes/dialog-field";
import { FSTabs } from "../../classes/tabs";
import { createKeys, IKeysElement, addKey, addKeys, IKeys } from "../../classes/keys";
import { Checkbox } from "../../classes/checkbox";
import { autocomplete, autocompleteChanges } from '../../classes/autocomplete';

@injectable()
export class FSUserDialogProps extends DialogProps {
  readonly connection?: FSServerConnection;
  readonly acceptButton?: string;
  readonly cancelButton?: string;
  readonly user?: FSUser;
}

export type FSUserDialogResult = FSUserData;

export class FSUserDialog extends AbstractDialog<FSUserDialogResult> {

  protected metadataCounter: number = 0;
  protected readonly statusKeys: IKeysElement = createKeys({});
  protected readonly groupsKeys: IKeysElement = createKeys({});
  protected readonly metadataKeys: IKeysElement = createKeys({});
  protected readonly attributes: { [k: string]: HTMLInputElement } = {};
  protected readonly groups: { [k: string]: Checkbox } = {};
  protected readonly isEnabled: Checkbox;
  protected readonly isExpired: Checkbox;
  protected readonly noPassword: Checkbox = new Checkbox('Empty');
  protected readonly containerDiv: HTMLDivElement = document.createElement('div');
  protected readonly username: IDialogField = createField('Username', '');
  protected readonly password: IDialogField = createField('Password', '', 'password');
  protected readonly passwordConfirm: IDialogField = createField('Confirm password', '', 'password');
  protected readonly group: IDialogField;
  protected readonly tabs: FSTabs = new FSTabs(['Credentials', 'Groups', 'Metadata']);

  constructor(
    @inject(FSUserDialogProps) protected readonly props: FSUserDialogProps,
  ) {
    super(props);
    if (props.connection) {
      this.group = createField('Primary group', '');
      autocomplete(this.group.input as HTMLInputElement, props.connection.groups);
      this.group.input.addEventListener('change', e => Object.keys(this.groups).forEach(group => {
        if (group === this.group.input.value) {
          this.groups[group].disabled = true;
          this.groups[group].checked = true;
        } else {
          this.groups[group].disabled = false;
        }
      }));
      this.tabs.tabs.forEach(tab => tab.classList.add('vertical-form'));
      this.isEnabled = new Checkbox('Enabled', props.user ? props.user.enabled : true);
      this.isExpired = new Checkbox('Expired', props.user ? props.user.expired : false);
      
      this.noPassword.container.classList.add('inline');
      this.password.label.appendChild(this.noPassword.container);
      
      this.tabs.tabs[0].appendChild(this.username.container);
      this.tabs.tabs[0].appendChild(this.password.container);
      this.tabs.tabs[0].appendChild(this.passwordConfirm.container);
      this.tabs.tabs[0].appendChild(this.isEnabled.container);
      this.tabs.tabs[0].appendChild(this.isExpired.container);

      this.groupsKeys.container.classList.add('no-label');
      props.connection.groups.forEach(group => {
        this.groups[group] = new Checkbox(group, props.user ? props.user.groups.indexOf(group) > -1 : group === this.group.input.value);
        this.groups[group].container.classList.add('default-case');
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
      
      const keys: IKeys = {};
      for (let index in FS_USER_ATTRIBUTE_LABELS) {
        const el = document.createElement('input');
        el.className = 'theia-input';
        const i = FS_USER_ATTRIBUTE_LABELS[index] || '';
        keys[i] = {
          type: 'string',
          value: '',
          el,
        };
        this.attributes[index] = el;
      };
      addKeys(keys, this.metadataKeys);
      this.tabs.tabs[2].appendChild(this.metadataKeys.container);
      
      if (props.user) {
        this.group.input.value = props.user.primaryGroup;
        this.username.input.value = props.user.userName;
        this.username.input.disabled = true;
        this.isEnabled.checked = props.user.enabled;
        this.isExpired.checked = props.user.expired;
        this.writeMetadata(props.user.metadata);
      }
      this.group.input.dispatchEvent(new Event('change'));

      this.containerDiv.appendChild(this.tabs.container);
      this.containerDiv.className = 'dialog-container user-dialog-container';
      this.contentNode.appendChild(this.containerDiv);

      this.appendAcceptButton(props.acceptButton || 'Add');
      this.appendCloseButton(props.cancelButton || 'Cancel');
    } else {
      throw createError(FSError.unknown);
    }
  }

  readMetadata(): FSUserAttributes {
    const result: FSUserAttributes = {};
    for (let i in FS_USER_ATTRIBUTE_LABELS) {
      if (this.attributes[i].value) {
        result[i] = this.attributes[i].value;
      }
    }
    return result;
  }
  writeMetadata(metadata: FSUserAttributes) {
    for (let i in FS_USER_ATTRIBUTE_LABELS) {
      this.attributes[i].value = metadata[i] || '';
    }
  }

  get value(): FSUserDialogResult {
    let password: string | null = this.password.input.value === this.passwordConfirm.input.value ? this.password.input.value : '';
    if (password === '') {
      password = null;
    }
    if (this.noPassword.checked) {
      this.password.input.value = '';
      this.passwordConfirm.input.value = '';
      this.password.input.disabled = true;
      this.passwordConfirm.input.disabled = true;
      password = '';
    } else {
      this.password.input.disabled = false;
      this.passwordConfirm.input.disabled = false;
    }
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

  protected isValid(value: FSUserDialogResult, mode: DialogMode): DialogError {
    if (this.password.input.value !== this.passwordConfirm.input.value) {
      return false;
    }
    if (this.props.connection && this.props.connection.groups.indexOf(value.primaryGroup) < 0) {
      return false;
    }
    if (this.props.user) {
      return value.password !== null || !sameUser(value, this.props.user);
    } else {
      return !!value.userName;
    }
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.addUpdateListener(this.username.input, 'input');
    this.addUpdateListener(this.group.input, 'input');
    autocompleteChanges(this.group.input, this.addUpdateListener.bind(this));
    this.addUpdateListener(this.password.input, 'input');
    this.addUpdateListener(this.passwordConfirm.input, 'input');
    this.addUpdateListener(this.isEnabled.container, 'click');
    this.addUpdateListener(this.isExpired.container, 'click');
    this.addUpdateListener(this.noPassword.container, 'click');
    Object.keys(this.groups).forEach(group => this.addUpdateListener(this.groups[group].container, 'click'));
    Object.keys(this.attributes).forEach(key => this.addUpdateListener(this.attributes[key], 'input'));
  }

  protected onActivateRequest(msg: Message): void {
    this.username.input.focus();
  }

}

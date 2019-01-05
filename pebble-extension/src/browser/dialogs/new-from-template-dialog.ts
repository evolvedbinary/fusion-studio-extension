import { injectable, inject } from "inversify";
import { DialogProps, AbstractDialog, DialogMode, DialogError, Message } from "@theia/core/lib/browser";
import { PebbleTemplate } from "../../classes/template";
import { IDialogField, IDialogFields, createField } from "../../classes/dialog-field";

@injectable()
export class PebbleNewFromTemplateDialogProps extends DialogProps {
  initialValue?: string;
  template?: PebbleTemplate;
  validate?: (filename: string) => boolean;
}

export interface NewFromTemplateDialogResult {
  params: any;
}

export class NewFromTemplateDialog extends AbstractDialog<NewFromTemplateDialogResult> {

  protected readonly nameField: IDialogField;
  protected readonly containerDiv: HTMLDivElement = document.createElement('div');
  protected readonly fields: IDialogFields = {};

  constructor(
    @inject(PebbleNewFromTemplateDialogProps) protected readonly props: PebbleNewFromTemplateDialogProps
  ) {
    super(props);

    this.nameField = createField('Name:', 'name-field');
    this.nameField.input.value = props.initialValue || '';
    this.containerDiv.appendChild(this.nameField.container);
    
    this.containerDiv.className = 'dialog-container vertical-form';
    this.contentNode.appendChild(this.containerDiv);
    
    if (props.template && props.template.fields) {
      for (const fieldName in props.template.fields) {
        const field = props.template.fields[fieldName];
        let fieldLabel: string;
        let fieldType: any;
        if (typeof field === 'string') {
          fieldLabel = field;
        } else {
          fieldLabel = field.label;
          fieldType = field.options
        }
        this.fields[fieldName] = createField(fieldLabel + ':', fieldName +'-field', fieldType);
        this.fields[fieldName].input.value = props.template.defaults ? props.template.defaults[fieldName] : '';
        this.containerDiv.appendChild(this.fields[fieldName].container);
      }
    }

    this.appendAcceptButton('Create');
    this.appendCloseButton('Cancel');
  }

  get value(): NewFromTemplateDialogResult {
    const params: any = {};
    for (const key in this.fields) {
      params[key] = this.fields[key].input.value;
    }
    params.name = this.nameField.input.value;
    return { params };
  }
  
  protected isValid(value: NewFromTemplateDialogResult, mode: DialogMode): DialogError {
    return !this.props.validate || this.props.validate(value.params.name);
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.addUpdateListener(this.nameField.input, 'input');
    for (const key in this.fields) {
      this.addUpdateListener(this.fields[key].input, 'input');
    }
  }

  protected onActivateRequest(msg: Message): void {
    this.nameField.input.focus();
  }

}

import { injectable, inject } from "inversify";
import { DialogProps, AbstractDialog, DialogMode, DialogError, Message } from "@theia/core/lib/browser";
import { FSTemplate } from "../../classes/template";
import { IDialogField, IDialogFields, createField } from "../../classes/dialog-field";

@injectable()
export class FSNewFromTemplateDialogProps extends DialogProps {
  initialValue?: string;
  template?: FSTemplate;
  validate?: (filename: string) => boolean;
}

export interface FSNewFromTemplateDialogResult {
  params: any;
}

export class FSNewFromTemplateDialog extends AbstractDialog<FSNewFromTemplateDialogResult> {

  protected readonly containerDiv: HTMLDivElement = document.createElement('div');
  protected readonly fields: IDialogFields = {};

  constructor(
    @inject(FSNewFromTemplateDialogProps) protected readonly props: FSNewFromTemplateDialogProps
  ) {
    super(props);

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

  get value(): FSNewFromTemplateDialogResult {
    const params: any = {};
    for (const key in this.fields) {
      params[key] = this.fields[key].input.value;
    }
    return { params };
  }
  
  // protected isValid(value: FSNewFromTemplateDialogResult, mode: DialogMode): DialogError {
  //   return !this.props.validate || this.props.validate(value.params.name);
  // }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    for (const key in this.fields) {
      this.addUpdateListener(this.fields[key].input, 'input');
    }
  }

  protected onActivateRequest(msg: Message): void {
    if (this.fields?.length) {
      this.fields[0].input.focus();
    }
  }

}

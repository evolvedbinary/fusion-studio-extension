import { injectable, inject } from "inversify";
import { DialogProps, AbstractDialog, DialogMode, DialogError, Message } from "@theia/core/lib/browser";
import { PebbleTemplate } from "../../classes/template";
import { IDialogField } from "../../classes/dialog-field";

@injectable()
export class PebbleNewFromTemplateDialogProps extends DialogProps {
  name?: string;
  template?: PebbleTemplate;
  validate?: (filename: string) => boolean;
}

function createField(label: string, className: string, type ='text'): IDialogField {
  const result: IDialogField = {
    container: document.createElement('div'),
    input: document.createElement('input'),
    label: document.createElement('span'),
  };
  result.input.type = type;
  result.container.className = className;
  result.label.innerHTML = label;
  result.container.appendChild(result.label);
  result.container.appendChild(result.input);
  return result;
}

export interface NewFromTemplateDialogResult {
  params: any;
}

export class NewFromTemplateDialog extends AbstractDialog<NewFromTemplateDialogResult> {

  protected readonly nameField: IDialogField;
  protected readonly containerDiv: HTMLDivElement = document.createElement('div');

  constructor(
    @inject(PebbleNewFromTemplateDialogProps) protected readonly props: PebbleNewFromTemplateDialogProps
  ) {
    super(props);

    this.nameField = createField('Name:', 'name-field');
    this.nameField.input.value = props.name || '';
    this.containerDiv.appendChild(this.nameField.container);
    
    this.containerDiv.className = 'new-from-template-dialog-container';
    this.contentNode.appendChild(this.containerDiv);

    this.appendAcceptButton('Create');
    this.appendCloseButton('Cancel');
  }

  get value(): NewFromTemplateDialogResult {
    const params: any = {};
    params.name = this.nameField.input.value + '.' + (this.props.template && this.props.template.ext(params));
    return { params };
  }
  
  protected isValid(value: NewFromTemplateDialogResult, mode: DialogMode): DialogError {
    return !this.props.validate || this.props.validate(value.params.name);
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.addUpdateListener(this.nameField.input, 'input');
  }

  protected onActivateRequest(msg: Message): void {
    this.nameField.input.focus();
  }

}

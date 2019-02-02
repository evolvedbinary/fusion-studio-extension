import { injectable, inject } from "inversify";
import { DialogProps, AbstractDialog } from "@theia/core/lib/browser";

@injectable()
export class PebbleAlertDialogProps extends DialogProps {
  readonly message: string = '';
  readonly secondaryMessage?: string;
  readonly acceptButton?: string;
}

export class PebbleAlertDialog extends AbstractDialog<any> {
  protected readonly containerDiv: HTMLDivElement = document.createElement('div');

  constructor(
    @inject(PebbleAlertDialogProps) protected readonly props: PebbleAlertDialogProps,
  ) {
    super(props);
    
    const message = document.createElement('p');
    message.className = 'pebble-alert-message';
    message.innerText = this.props.message;
    this.containerDiv.appendChild(message);
    
    if (this.props.secondaryMessage) {
      const secondaryMessage = document.createElement('p');
      secondaryMessage.className = 'pebble-alert-secondary-message';
      secondaryMessage.innerText = this.props.secondaryMessage;
      this.containerDiv.appendChild(secondaryMessage);
    }
    
    this.containerDiv.className = 'dialog-container alert-dialog-container';
    this.contentNode.appendChild(this.containerDiv);

    this.appendAcceptButton(props.acceptButton || 'Ok');
  }

  get value(): any {
    return;
  }

}

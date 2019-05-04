export class Checkbox {
  container: HTMLSpanElement = document.createElement('span');
  box: HTMLSpanElement = document.createElement('span');
  label: HTMLSpanElement = document.createElement('span');
  constructor (label: string, checked = false) {
    this.container.className = 'checkbox';
    this.box.className = 'checkbox-box';
    this.box.append(document.createElement('span'));
    this.container.append(this.box);
    this.label.className = 'checkbox-label';
    this.label.innerHTML = label;
    this.container.append(this.label);
    this.checked = checked;
    this.container.addEventListener('click', this.onClick.bind(this));
  }
  private _checked: boolean = false;
  public get checked(): boolean {
    return this._checked;
  }
  public set checked(value: boolean) {
    this._checked = value;
    if (value) {
      this.box.classList.add('checked');
    } else {
      this.box.classList.remove('checked');
    }
  }
  private _disabled: boolean = false;
  public get disabled(): boolean {
    return this._disabled;
  }
  public set disabled(value: boolean) {
    this._disabled = value;
    if (value) {
      this.container.classList.add('disabled');
    } else {
      this.container.classList.remove('disabled');
    }
  }
  private onClick(e: MouseEvent) {
    if (!this._disabled) {
      this.checked = !this.checked;
    }
  }
}
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
  private onClick(e: MouseEvent) {
    this.checked = !this.checked;
  }
}
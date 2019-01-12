export class PebbleTabs {
  protected _active: number = 0;
  protected _tabs: string[] = [];
  protected header: HTMLDivElement = document.createElement('div');
  protected body: HTMLDivElement = document.createElement('div');
  protected tabContainers: HTMLDivElement[] = [];
  public container: HTMLDivElement = document.createElement('div');
  public headers: HTMLAnchorElement[] = [];
  public tabs: HTMLDivElement[] = [];
  constructor (count: number);
  constructor (tabs: string[]);
  constructor (arg: string[] | number) {
    if (typeof arg === 'number') {
      for (let i = 1; i <= arg; i++) {
        this._tabs.push('Tab ' + i);
      }
    } else {
      this._tabs = arg;
    }
    this.container.className = 'pebble-tabs';
    this.body.className = 'pb-body';
    this.header.className = 'pb-headers';
    this._tabs.forEach((title, i) => {
      const tabContainer = document.createElement('div');
      tabContainer.className = 'pb-tab-container';
      this.tabContainers.push(tabContainer);
      this.body.append(tabContainer);
      const tab = document.createElement('div');
      tab.className = 'pb-tab';
      tabContainer.append(tab);
      this.tabs.push(tab);
      const header = document.createElement('a');
      header.addEventListener('click', this.getEvent(i));
      header.className = 'pb-header';
      header.innerText = title;
      this.header.append(header);
      this.headers.push(header);
    });
    this.container.append(this.header);
    this.container.append(this.body);
    this.activate(0);
  }
  protected getEvent(tab: number) {
    const me = this;
    return (event: MouseEvent) => {
      me.activate(tab);
    };
  }
  protected activate(active: number) {
    this._active = active;
    this.headers.forEach((header, i) => {
      if (i === active) {
        header.classList.add('active');
        this.tabContainers[i].classList.add('active');
      } else {
        header.classList.remove('active');
        this.tabContainers[i].classList.remove('active');
      }
    });
  }
  public set active(value: number) {
    if (this._active === value || value < 0 || value >= this._tabs.length) {
      this.activate(value);
    }
  }
}
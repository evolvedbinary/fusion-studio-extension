import * as Awesomplete from "awesomplete";
export function autocomplete(input: HTMLElement, list: string | string[] | Element | Array<{ label: string, value: any }> | Array<[string, string]>) {
  input.addEventListener('keydown', (e: any) => {
    if (awesomplete.opened && e.keyCode === 13) {
      e.stopPropagation();
      e.preventDefault();
    }
  });
  input.addEventListener('focus', (e: any) => {
    if (awesomplete.ul.childNodes.length === 0) {
      awesomplete.evaluate();
    }
    else if (awesomplete.ul.hasAttribute('hidden')) {
      awesomplete.open();
    }
  });
  const awesomplete = new Awesomplete(input, {
    list,
    autoFirst: true,
    minChars: 0,
  });
  input.addEventListener('awesomplete-selectcomplete', (...e: any[]) => {
    input.dispatchEvent(new Event('change'));
  });
}
export function autocompleteChanges(input: HTMLElement, add: (element: HTMLElement, type: any, useCapture?: boolean) => void) {
  add(input, 'awesomplete-selectcomplete');
}
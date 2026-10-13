/**
 * Minimal Zero-Dependency Native DOM Mock Helper for Node.js Testing
 */

export class MockNode {
  public childNodes: MockNode[] = [];
  public parentNode: MockNode | null = null;
  public textContent: string = '';

  public appendChild(child: MockNode): MockNode {
    this.childNodes.push(child);
    child.parentNode = this;
    return child;
  }

  public removeChild(child: MockNode): MockNode {
    const idx = this.childNodes.indexOf(child);
    if (idx !== -1) {
      this.childNodes.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  }
}

export class MockElement extends MockNode {
  public tagName: string;
  public style: Record<string, string> = {};
  public attributes: Map<string, string> = new Map();
  public eventListeners: Map<string, Array<(e: any) => void>> = new Map();
  public shadowRoot: MockShadowRoot | null = null;

  constructor(tagName: string = 'DIV') {
    super();
    this.tagName = tagName.toUpperCase();
  }

  public setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  public getAttribute(name: string): string | null {
    return this.attributes.has(name) ? this.attributes.get(name)! : null;
  }

  public addEventListener(event: string, handler: (e: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(handler);
  }

  public removeEventListener(event: string, handler: (e: any) => void): void {
    const list = this.eventListeners.get(event);
    if (list) {
      const idx = list.indexOf(handler);
      if (idx !== -1) list.splice(idx, 1);
    }
  }

  public dispatchEvent(event: any): boolean {
    try {
      Object.defineProperty(event, 'target', { value: this, configurable: true, writable: true });
    } catch {
      // Ignore if event.target is read-only native getter
    }
    const list = this.eventListeners.get(event.type);
    if (list) {
      for (const h of list) {
        h(event);
      }
    }
    return !event.defaultPrevented;
  }

  public attachShadow(init: { mode: 'open' | 'closed' }): MockShadowRoot {
    this.shadowRoot = new MockShadowRoot(this);
    return this.shadowRoot;
  }

  public closest(selector: string): MockElement | null {
    if (this.tagName.toLowerCase() === selector.toLowerCase()) return this;
    return this.parentNode instanceof MockElement ? this.parentNode.closest(selector) : null;
  }
}

export class MockShadowRoot extends MockElement {
  public host: MockElement;
  public innerHTMLString: string = '';
  public elementsById: Map<string, MockElement> = new Map();

  constructor(host: MockElement) {
    super('SHADOW-ROOT');
    this.host = host;
  }

  public set innerHTML(html: string) {
    this.innerHTMLString = html;
    this.elementsById.clear();
    // Simple id extraction for test query
    const idMatches = html.matchAll(/id="([^"]+)"/g);
    for (const match of idMatches) {
      const el = new MockElement();
      el.setAttribute('id', match[1]);
      this.elementsById.set(match[1], el);
    }
  }

  public get innerHTML(): string {
    return this.innerHTMLString;
  }

  public getElementById(id: string): MockElement | null {
    return this.elementsById.get(id) || null;
  }
}

export class MockKeyboardEvent {
  public type: string;
  public key: string;
  public defaultPrevented: boolean = false;
  public target: any = null;

  constructor(type: string, init: { key: string }) {
    this.type = type;
    this.key = init.key;
  }

  public preventDefault(): void {
    this.defaultPrevented = true;
  }
}

export function setupMockDom() {
  const windowListeners = new Map<string, Array<(e: any) => void>>();
  const registry = new Map<string, any>();

  (globalThis as any).HTMLElement = MockElement;
  (globalThis as any).ShadowRoot = MockShadowRoot;
  (globalThis as any).KeyboardEvent = MockKeyboardEvent;
  if (typeof (globalThis as any).CustomEvent === 'undefined') {
    (globalThis as any).CustomEvent = class CustomEvent {
      public type: string;
      public detail: any;
      public target: any = null;
      public defaultPrevented: boolean = false;
      constructor(type: string, init?: { detail?: any }) {
        this.type = type;
        this.detail = init?.detail;
      }
      public preventDefault(): void {
        this.defaultPrevented = true;
      }
    };
  }
  (globalThis as any).customElements = {
    define(name: string, constructor: any) {
      registry.set(name, constructor);
    },
    get(name: string) {
      return registry.get(name);
    },
  };
  (globalThis as any).window = {
    addEventListener(event: string, handler: any) {
      if (!windowListeners.has(event)) windowListeners.set(event, []);
      windowListeners.get(event)!.push(handler);
    },
    removeEventListener(event: string, handler: any) {
      const list = windowListeners.get(event);
      if (list) {
        const idx = list.indexOf(handler);
        if (idx !== -1) list.splice(idx, 1);
      }
    },
    dispatchEvent(event: any) {
      const list = windowListeners.get(event.type);
      if (list) {
        for (const h of list) h(event);
      }
      return !event.defaultPrevented;
    },
    _listeners: windowListeners,
  };
}

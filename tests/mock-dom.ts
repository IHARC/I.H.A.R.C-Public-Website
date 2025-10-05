/*
 * Minimal DOM implementation for Vitest in Node environment.
 * Supports the subset of APIs used across unit tests and accessibility utilities.
 */

type EventListener = (event: TestEvent) => void;

export class TestEvent {
  defaultPrevented = false;
  target: TestElement | TestDocument | null = null;

  constructor(public readonly type: string) {}

  preventDefault() {
    this.defaultPrevented = true;
  }
}

export class TestKeyboardEvent extends TestEvent {
  key: string;
  shiftKey: boolean;

  constructor(type: string, init: { key?: string; shiftKey?: boolean } = {}) {
    super(type);
    this.key = init.key ?? '';
    this.shiftKey = init.shiftKey ?? false;
  }
}

export interface QueryOptions {
  requireHref?: boolean;
  requireTabIndex?: boolean;
  disallowDisabled?: boolean;
  disallowTabIndexMinusOne?: boolean;
  tagName?: string | null;
  requiredAttributes?: Array<{ name: string; value?: string | null }>;
}

export class TestElement {
  public readonly children: TestElement[] = [];
  public parentElement: TestElement | null = null;
  public textContent: string | null = null;
  public className = '';
  public id = '';
  public tabIndex: number | null = null;
  public disabled = false;
  private readonly attributes = new Map<string, string>();

  constructor(public readonly tagName: string, private readonly ownerDocument: TestDocument) {}

  appendChild(child: TestElement): TestElement {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  removeChild(child: TestElement): TestElement {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      child.parentElement = null;
    }
    return child;
  }

  focus(): void {
    this.ownerDocument.activeElement = this;
  }

  contains(node: TestElement | null): boolean {
    if (!node) return false;
    if (node === this) return true;
    return this.children.some((child) => child.contains(node));
  }

  setAttribute(name: string, value: string): void {
    const normalized = name.toLowerCase();
    this.attributes.set(normalized, value);

    if (normalized === 'id') {
      this.id = value;
    }
    if (normalized === 'tabindex') {
      this.tabIndex = Number(value);
    }
    if (normalized === 'disabled') {
      this.disabled = true;
    }
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name.toLowerCase()) ?? null;
  }

  removeAttribute(name: string): void {
    const normalized = name.toLowerCase();
    this.attributes.delete(normalized);
    if (normalized === 'disabled') {
      this.disabled = false;
    }
    if (normalized === 'tabindex') {
      this.tabIndex = null;
    }
    if (normalized === 'id') {
      this.id = '';
    }
  }

  querySelectorAll(selector: string): TestElement[] {
    const selectors = selector.split(',').map((item) => item.trim()).filter(Boolean);
    const results: TestElement[] = [];

    const visit = (element: TestElement) => {
      if (selectors.some((item) => matchesSelector(element, parseSelector(item)))) {
        results.push(element);
      }
      element.children.forEach(visit);
    };

    this.children.forEach(visit);
    return results;
  }

  querySelector(selector: string): TestElement | null {
    return this.querySelectorAll(selector)[0] ?? null;
  }

  get innerHTML(): string {
    return this.children.map((child) => `<${child.tagName.toLowerCase()}>`).join('');
  }

  set innerHTML(_: string) {
    // Clearing innerHTML should remove all children.
    this.children.splice(0, this.children.length);
  }
}

export class TestDocument {
  readonly body = new TestElement('BODY', this);
  readonly head = new TestElement('HEAD', this);
  activeElement: TestElement | null = null;
  private readonly listeners = new Map<string, Set<EventListener>>();

  createElement(tagName: string): TestElement {
    return new TestElement(tagName.toUpperCase(), this);
  }

  addEventListener(type: string, listener: EventListener): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this.listeners.get(type)?.delete(listener);
  }

  dispatchEvent(event: TestEvent): boolean {
    event.target = this;
    const listeners = this.listeners.get(event.type);
    if (!listeners) {
      return true;
    }
    listeners.forEach((listener) => listener(event));
    return !event.defaultPrevented;
  }

  querySelector(selector: string): TestElement | null {
    return this.body.querySelector(selector) ?? this.head.querySelector(selector);
  }

  querySelectorAll(selector: string): TestElement[] {
    return [...this.body.querySelectorAll(selector), ...this.head.querySelectorAll(selector)];
  }
}

function parseSelector(selector: string): QueryOptions {
  const options: QueryOptions = {};
  let remaining = selector;

  if (selector.includes(':not([disabled])')) {
    options.disallowDisabled = true;
    remaining = remaining.replace(':not([disabled])', '');
  }

  if (selector.includes(':not([tabindex="-1"])')) {
    options.disallowTabIndexMinusOne = true;
    remaining = remaining.replace(':not([tabindex="-1"])', '');
  }

  const attributeRegex = /\[([^\]]+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = attributeRegex.exec(remaining)) !== null) {
    const [fullMatch, content] = match;
    remaining = remaining.replace(fullMatch, '');
    const [rawName, rawValue] = content.split('=').map((part) => part?.trim());
    const attributeName = rawName?.replace(/^"|"$/g, '')?.replace(/^'|'$/g, '') ?? '';
    const attributeValue = rawValue
      ? rawValue.replace(/^"|"$/g, '').replace(/^'|'$/g, '')
      : null;

    if (attributeName === 'href') {
      options.requireHref = true;
      continue;
    }

    if (attributeName === 'tabindex' && attributeValue === null) {
      options.requireTabIndex = true;
      continue;
    }

    if (!options.requiredAttributes) {
      options.requiredAttributes = [];
    }
    options.requiredAttributes.push({ name: attributeName, value: attributeValue });
  }

  const tagMatch = remaining.match(/^[a-zA-Z]+/);
  options.tagName = tagMatch ? tagMatch[0].toUpperCase() : null;
  return options;
}

function matchesSelector(element: TestElement, options: QueryOptions): boolean {
  if (options.tagName && element.tagName !== options.tagName) {
    return false;
  }

  if (options.requireHref && !element.getAttribute('href')) {
    return false;
  }

  if (options.requireTabIndex && element.tabIndex === null) {
    return false;
  }

  if (options.disallowDisabled && element.disabled) {
    return false;
  }

  if (options.disallowTabIndexMinusOne && element.tabIndex === -1) {
    return false;
  }

  if (options.requiredAttributes) {
    for (const requirement of options.requiredAttributes) {
      const attrValue = element.getAttribute(requirement.name);
      if (attrValue === null) {
        return false;
      }
      if (requirement.value != null && attrValue !== requirement.value) {
        return false;
      }
    }
  }

  return true;
}

export function createTestEnvironment() {
  const document = new TestDocument();
  const window = {
    matchMedia: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  };

  return { document, window };
}

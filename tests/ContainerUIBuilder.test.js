import { JSDOM } from 'jsdom';
import { jest } from '@jest/globals';
import { ContainerUIBuilder } from '../src/ContainerUIBuilder.js';

describe('ContainerUIBuilder', () => {
  beforeEach(() => {
    const dom = new JSDOM('<!doctype html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
  });

  afterEach(() => {
    delete global.window;
    delete global.document;
  });

  test('hauria de mantenir el nom accessible i l’estat expandit del botó', () => {
    const builder = new ContainerUIBuilder({ log: jest.fn() }, '1.0.0');
    const content = document.createElement('div');
    content.textContent = 'Contingut';

    const container = builder.createContainer(content, 'powertoy-test', 'Valors acceptats: >=4.5 → Assolit, <4.5 o NA → No assolit, EP → En procés, P o PDT → Pendent, . o X → Blanc');
    const toggle = container.querySelector('#powertoy-test-toggle-btn');
    const wrapper = container.querySelector('.powertoy-content-wrapper');

    expect(toggle.getAttribute('aria-label')).toBe('Minimitza PowerToys');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.title).toBe('Minimitza PowerToys');

    toggle.click();

    expect(wrapper.style.display).toBe('none');
    expect(wrapper.querySelector('.powertoy-instructions')).not.toBeNull();
    expect(toggle.getAttribute('aria-label')).toBe('Expandeix PowerToys');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.title).toBe('Expandeix PowerToys');

    toggle.click();

    expect(wrapper.style.display).toBe('');
    expect(toggle.getAttribute('aria-label')).toBe('Minimitza PowerToys');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  test('hauria de mostrar les instruccions dins del contingut i abans de la versió', () => {
    const builder = new ContainerUIBuilder({ log: jest.fn() }, '1.0.0');
    const content = document.createElement('div');

    const container = builder.createContainer(content, 'powertoy-test', 'Valors acceptats: >=4.5 → Assolit, <4.5 o NA → No assolit, EP → En procés, P o PDT → Pendent, . o X → Blanc');
    const wrapper = container.querySelector('.powertoy-content-wrapper');
    const instructions = container.querySelector('.powertoy-instructions');
    const version = container.querySelector('.powertoy-version');

    expect(instructions).not.toBeNull();
    expect(instructions.textContent).toContain('Valors acceptats:');
    expect(instructions.textContent).toContain('<4.5 o NA');
    expect(instructions.textContent).toContain('P o PDT');
    expect(instructions.textContent).toContain('. o X');
    expect(wrapper.contains(instructions)).toBe(true);
    expect(version.previousElementSibling).toBe(wrapper);
  });

  test('hauria de crear l’enllaç de versió sense innerHTML i amb rel segur', () => {
    const builder = new ContainerUIBuilder({ log: jest.fn() }, '1.0.0');
    const content = document.createElement('div');

    const container = builder.createContainer(content, 'powertoy-test');
    const link = container.querySelector('.powertoy-version a');

    expect(link.textContent).toBe('Esfer@ Power Toys');
    expect(link.target).toBe('_blank');
    expect(link.rel).toBe('noopener noreferrer');
  });
});

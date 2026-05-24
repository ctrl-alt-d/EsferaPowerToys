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

    const container = builder.createContainer(content, 'powertoy-test');
    const toggle = container.querySelector('#powertoy-test-toggle-btn');
    const wrapper = container.querySelector('.powertoy-content-wrapper');

    expect(toggle.getAttribute('aria-label')).toBe('Minimitza PowerToys');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.title).toBe('Minimitza PowerToys');

    toggle.click();

    expect(wrapper.style.display).toBe('none');
    expect(toggle.getAttribute('aria-label')).toBe('Expandeix PowerToys');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.title).toBe('Expandeix PowerToys');

    toggle.click();

    expect(wrapper.style.display).toBe('');
    expect(toggle.getAttribute('aria-label')).toBe('Minimitza PowerToys');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });
});

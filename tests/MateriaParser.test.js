import { JSDOM } from 'jsdom';
import { MateriaParser } from '../src/MateriaParser.js';
import { PowerToysLogger } from '../src/PowerToysLogger.js';

describe('MateriaParser', () => {
  let parser;

  beforeEach(() => {
    const logger = new PowerToysLogger(false); // debug OFF per tests
    parser = new MateriaParser(logger);
  });

  test('hauria de parsejar correctament una matèria amb 2 RAs', () => {
    const html = `
      <table>
        <tr><td>2024_MAT01</td><td>Matemàtiques</td></tr>
        <tr><td>2024_MAT01_01RA</td><td>RA1</td></tr>
        <tr><td>2024_MAT01_02RA</td><td>RA2</td></tr>
      </table>
    `;
    const dom = new JSDOM(html);
    const files = Array.from(dom.window.document.querySelectorAll('tr'));

    const result = parser.parse(files);

    expect(result).toHaveLength(1);
    expect(result[0].codi).toBe('2024_MAT01');
    expect(result[0].nom).toBe('Matemàtiques');
    expect(result[0].RAs).toEqual(['2024_MAT01_01RA', '2024_MAT01_02RA']);
  });


  test('hauria de parsejar correctament matèries opcionals', () => {
    const html = `
      <table>
        <tr><td>OPT1</td><td>Pensament computacional</td></tr>
        <tr><td>OPT1_IC10_01RA</td><td>Pensament computacional - (OPT1_IC10_01RA)</td></tr>
      </table>
    `;
    const dom = new JSDOM(html);
    const files = Array.from(dom.window.document.querySelectorAll('tr'));

    const result = parser.parse(files);

    expect(result).toHaveLength(1);
    expect(result[0].codi).toBe('OPT1');
    expect(result[0].nom).toBe('Pensament computacional');
    expect(result[0].RAs).toEqual(['OPT1_IC10_01RA']);
  });


  test('hauria de retornar array buit si no hi ha files vàlides', () => {
    const html = `<table><tr><td>ALTRE</td><td>Assignatura</td></tr></table>`;
    const dom = new JSDOM(html);
    const files = Array.from(dom.window.document.querySelectorAll('tr'));

    const result = parser.parse(files);

    expect(result).toEqual([]);
  });
});

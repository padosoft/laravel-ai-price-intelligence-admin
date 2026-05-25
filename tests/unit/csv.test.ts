import { toCsv } from '@/lib/csv';

describe('toCsv', () => {
  it('emits a header row plus data rows', () => {
    expect(toCsv(['a', 'b'], [[1, 2], [3, 4]])).toBe('a,b\n1,2\n3,4');
  });

  it('quotes fields containing commas, quotes, or newlines (LF/CR/CRLF)', () => {
    expect(toCsv(['x'], [['a,b']])).toBe('x\n"a,b"');
    expect(toCsv(['x'], [['he said "hi"']])).toBe('x\n"he said ""hi"""');
    expect(toCsv(['x'], [['line1\r\nline2']])).toBe('x\n"line1\r\nline2"');
    expect(toCsv(['x'], [['line1\rline2']])).toBe('x\n"line1\rline2"');
  });

  it('neutralizes CSV formula injection (incl. leading whitespace)', () => {
    // Leading =,+,-,@ get a single-quote prefix...
    expect(toCsv(['x'], [['=HYPERLINK("http://evil")']])).toBe('x\n"\'=HYPERLINK(""http://evil"")"');
    expect(toCsv(['x'], [['+1']])).toBe("x\n'+1");
    expect(toCsv(['x'], [['@cmd']])).toBe("x\n'@cmd");
    // ...even when preceded by whitespace (spreadsheets trim it before evaluating).
    expect(toCsv(['x'], [['   =1+1']])).toBe("x\n'   =1+1");
  });

  it('leaves safe values untouched', () => {
    expect(toCsv(['x'], [['Acme X1 Pro']])).toBe('x\nAcme X1 Pro');
    expect(toCsv(['x'], [['https://amazon.it/dp/B0XYZ']])).toBe('x\nhttps://amazon.it/dp/B0XYZ');
    expect(toCsv(['x'], [[null]])).toBe('x\n');
  });
});

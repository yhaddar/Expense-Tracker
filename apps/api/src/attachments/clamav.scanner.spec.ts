import { describe, expect, it } from 'vitest';
import { parseClamAvResult } from './clamav.scanner';

describe('ClamAV result parsing', () => {
  it('accepts a clean clamd response', () => {
    expect(parseClamAvResult(`stream: OK${String.fromCharCode(0)}`)).toBe(
      'clean',
    );
  });

  it('marks detections as infected', () => {
    expect(
      parseClamAvResult(
        `stream: Eicar-Test-Signature FOUND${String.fromCharCode(0)}`,
      ),
    ).toBe('infected');
  });

  it('fails closed on an unknown response', () => {
    expect(() =>
      parseClamAvResult(`stream: ERROR${String.fromCharCode(0)}`),
    ).toThrow('unknown scan result');
  });
});

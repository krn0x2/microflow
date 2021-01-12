import { transform, setOnPath } from '../../src/utils/index';

describe('transform function', () => {
  test('object input and root', () => {
    const output = transform(
      {
        a: '$',
        b: '$.key1',
        c: '$.jabber',
        d: 'constant',
        e: {
          f: 'constant',
          g: '$.key1',
          h: '$'
        }
      },
      {
        key1: 'val1',
        key2: 'val2'
      }
    );
    expect(output).toEqual({
      a: { key1: 'val1', key2: 'val2' },
      b: 'val1',
      c: undefined,
      d: 'constant',
      e: { f: 'constant', g: 'val1', h: { key1: 'val1', key2: 'val2' } }
    });
  });

  test('object input and root, access array indices', () => {
    const output = transform(
      {
        a: '$',
        b: '$.key1[1]',
        c: '$.jabber',
        d: 'constant',
        e: {
          f: 'constant',
          g: '$.key1',
          h: '$'
        }
      },
      {
        key1: ['val1', 'val2'],
        key2: 'val3'
      }
    );
    expect(output).toEqual({
      a: { key1: ['val1', 'val2'], key2: 'val3' },
      b: 'val2',
      c: undefined,
      d: 'constant',
      e: {
        f: 'constant',
        g: ['val1', 'val2'],
        h: {
          key1: ['val1', 'val2'],
          key2: 'val3'
        }
      }
    });
  });

  test('null input, object root', () => {
    const output = transform(null, {
      key1: 'val1',
      key2: 'val2'
    });
    expect(output).toBeNull();
  });

  test('string input, object root', () => {
    const output = transform('$.key1', {
      key1: 'val1',
      key2: 'val2'
    });
    expect(output).toEqual('val1');
  });

  test('object input, empty root', () => {
    const output = transform(
      {
        a: '$',
        b: '$.key1',
        c: '$.jabber',
        d: 'constant',
        e: {
          f: 'constant',
          g: '$.key1',
          h: '$'
        }
      },
      {}
    );
    expect(output).toEqual({
      a: {},
      b: undefined,
      c: undefined,
      d: 'constant',
      e: {
        f: 'constant',
        g: undefined,
        h: {}
      }
    });
  });

  test('object input, object root, non-default identifier', () => {
    const output = transform(
      {
        a: '$',
        b: '$.key1',
        c: '$.jabber',
        a1: '$$',
        b2: '$$.key1',
        c2: '$$.jabber',
        d: 'constant',
        e: {
          f: 'constant',
          g: '$.key1',
          h: '$',
          g1: '$$.key1',
          h1: '$$'
        }
      },
      {
        key1: 'val1',
        key2: 'val2'
      },
      '$$'
    );
    expect(output).toEqual({
      a: '$',
      b: '$.key1',
      c: '$.jabber',
      a1: {
        key1: 'val1',
        key2: 'val2'
      },
      b2: 'val1',
      c2: undefined,
      d: 'constant',
      e: {
        f: 'constant',
        g: '$.key1',
        h: '$',
        g1: 'val1',
        h1: {
          key1: 'val1',
          key2: 'val2'
        }
      }
    });
  });

  test('object(with array key) input and root', () => {
    const output = transform(
      {
        url: 'http://localhost:1000/api/experimental/dags/{{dagId}}/dag_runs',
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        },
        data: {
          conf: {
            key: ['arrayVal']
          }
        },
        method: 'post'
      },
      {
        dagId: 'dag1',
        data: '$'
      }
    );
    expect(output).toEqual({
      url: 'http://localhost:1000/api/experimental/dags/dag1/dag_runs',
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      },
      data: {
        conf: {
          key: ['arrayVal']
        }
      },
      method: 'post'
    });
  });
});

describe('setOnPath function', () => {
  test('default path', () => {
    const output = setOnPath({ a: 1, b: 2 }, '$', { c: 3, d: 4 });
    expect(output).toEqual({ c: 3, d: 4 });
  });

  test('empty object, default path', () => {
    const output = setOnPath({ a: 1, b: 2 }, '$', {});
    expect(output).toEqual({});
  });

  test('empty object', () => {
    const output = setOnPath({ a: 1, b: 2 }, '$.c', {});
    expect(output).toEqual({ a: 1, b: 2, c: {} });
  });

  test('empty root, default path', () => {
    const output = setOnPath({}, '$', { c: 3, d: 4 });
    expect(output).toEqual({ c: 3, d: 4 });
  });

  test('empty root', () => {
    const output = setOnPath({}, '$.a', { c: 3, d: 4 });
    expect(output).toEqual({ a: { c: 3, d: 4 } });
  });

  test('should overwrite key', () => {
    const output = setOnPath({ a: 1, b: 2 }, '$.b', { c: 3, d: 4 });
    expect(output).toEqual({ a: 1, b: { c: 3, d: 4 } });
  });

  test('should write nested key', () => {
    const output = setOnPath({ a: 1, b: 2 }, '$.c.d', { c: 3, d: 4 });
    expect(output).toEqual({ a: 1, b: 2, c: { d: { c: 3, d: 4 } } });
  });

  test('should overwrite nested key', () => {
    const output = setOnPath({ a: 1, b: 2, c: { d: 3 } }, '$.c.d', {
      c: 3,
      d: 4
    });
    expect(output).toEqual({ a: 1, b: 2, c: { d: { c: 3, d: 4 } } });
  });
});

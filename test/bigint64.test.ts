import assert from "assert";
import { encode, decode, IntMode, ExtensionCodec, DecodeError } from "../src";
import { getInt64, getUint64 } from "../src/utils/int";

describe("useBigInt64: true", () => {
  before(function () {
    if (typeof BigInt === "undefined") {
      this.skip();
    }
  });

  it("encodes and decodes 0n", () => {
    const value = BigInt(0);
    const encoded = encode(value, { forceBigIntToInt64: true });
    assert.deepStrictEqual(decode(encoded, { useBigInt64: true }), value);
  });

  it("encodes and decodes MAX_SAFE_INTEGER+1", () => {
    const value = BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1);
    const encoded = encode(value, { forceBigIntToInt64: true });
    assert.deepStrictEqual(decode(encoded, { useBigInt64: true }), value);
  });

  it("encodes and decodes MIN_SAFE_INTEGER-1", () => {
    const value = BigInt(Number.MIN_SAFE_INTEGER) - BigInt(1);
    const encoded = encode(value, { forceBigIntToInt64: true });
    assert.deepStrictEqual(decode(encoded, { useBigInt64: true }), value);
  });

  it("encodes and decodes values with numbers and bigints - MIXED", () => {
    const value = {
      ints: [0, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER],
      nums: [Number.NaN, Math.PI, Math.E, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY],
      bigints: [BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1), BigInt(Number.MIN_SAFE_INTEGER) - BigInt(1)],
    };
    const encoded = encode(value, { forceBigIntToInt64: true });
    const decoded = decode(encoded, { intMode: IntMode.MIXED });
    assert.deepStrictEqual(decoded, value);
  });

  it("encodes and decodes values with numbers and bigints - AS_ENCODED", () => {
    const value = {
      ints: [0, Math.pow(2, 32) - 1, -1 * Math.pow(2, 31)],
      nums: [Number.NaN, Math.PI, Math.E, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY],
      bigints: [BigInt(0), BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1), BigInt(Number.MIN_SAFE_INTEGER) - BigInt(1)],
    };
    const encoded = encode(value, { forceBigIntToInt64: true });
    const decoded = decode(encoded, { intMode: IntMode.AS_ENCODED });
    assert.deepStrictEqual(decoded, value);
  });
});

interface TestCase {
  input: bigint;
  expected: Map<IntMode, number | bigint | "error">;
}

// declared as a function to delay referencing the BigInt constructor
function BIGINTSPECS(): Record<string, TestCase> {
  return {
    ZERO: {
      input: BigInt(0),
      expected: new Map<IntMode, number | bigint>([
        [IntMode.UNSAFE_NUMBER, 0],
        [IntMode.SAFE_NUMBER, 0],
        [IntMode.MIXED, 0],
        [IntMode.BIGINT, BigInt(0)],
      ]),
    },
    ONE: {
      input: BigInt(1),
      expected: new Map<IntMode, number | bigint>([
        [IntMode.UNSAFE_NUMBER, 1],
        [IntMode.SAFE_NUMBER, 1],
        [IntMode.MIXED, 1],
        [IntMode.BIGINT, BigInt(1)],
      ]),
    },
    MINUS_ONE: {
      input: BigInt(-1),
      expected: new Map<IntMode, number | bigint>([
        [IntMode.UNSAFE_NUMBER, -1],
        [IntMode.SAFE_NUMBER, -1],
        [IntMode.MIXED, -1],
        [IntMode.BIGINT, BigInt(-1)],
      ]),
    },
    X_FF: {
      input: BigInt(0xff),
      expected: new Map<IntMode, number | bigint>([
        [IntMode.UNSAFE_NUMBER, 0xff],
        [IntMode.SAFE_NUMBER, 0xff],
        [IntMode.MIXED, 0xff],
        [IntMode.BIGINT, BigInt(0xff)],
      ]),
    },
    MINUS_X_FF: {
      input: BigInt(-0xff),
      expected: new Map<IntMode, number | bigint>([
        [IntMode.UNSAFE_NUMBER, -0xff],
        [IntMode.SAFE_NUMBER, -0xff],
        [IntMode.MIXED, -0xff],
        [IntMode.BIGINT, BigInt(-0xff)],
      ]),
    },
    INT32_MAX: {
      input: BigInt(0x7fffffff),
      expected: new Map<IntMode, number | bigint>([
        [IntMode.UNSAFE_NUMBER, 0x7fffffff],
        [IntMode.SAFE_NUMBER, 0x7fffffff],
        [IntMode.MIXED, 0x7fffffff],
        [IntMode.BIGINT, BigInt(0x7fffffff)],
      ]),
    },
    INT32_MIN: {
      input: BigInt(-0x7fffffff - 1),
      expected: new Map<IntMode, number | bigint>([
        [IntMode.UNSAFE_NUMBER, -0x7fffffff - 1],
        [IntMode.SAFE_NUMBER, -0x7fffffff - 1],
        [IntMode.MIXED, -0x7fffffff - 1],
        [IntMode.BIGINT, BigInt(-0x7fffffff - 1)],
      ]),
    },
    MAX_SAFE_INTEGER: {
      input: BigInt(Number.MAX_SAFE_INTEGER),
      expected: new Map<IntMode, number | bigint>([
        [IntMode.UNSAFE_NUMBER, Number.MAX_SAFE_INTEGER],
        [IntMode.SAFE_NUMBER, Number.MAX_SAFE_INTEGER],
        [IntMode.MIXED, Number.MAX_SAFE_INTEGER],
        [IntMode.BIGINT, BigInt(Number.MAX_SAFE_INTEGER)],
      ]),
    },
    MAX_SAFE_INTEGER_PLUS_ONE: {
      input: BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1),
      expected: new Map<IntMode, number | bigint | "error">([
        // exclude IntMode.UNSAFE_NUMBER, behavior will not be exact
        [IntMode.SAFE_NUMBER, "error"],
        [IntMode.MIXED, BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1)],
        [IntMode.BIGINT, BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1)],
      ]),
    },
    MIN_SAFE_INTEGER: {
      input: BigInt(Number.MIN_SAFE_INTEGER),
      expected: new Map<IntMode, number | bigint>([
        [IntMode.UNSAFE_NUMBER, Number.MIN_SAFE_INTEGER],
        [IntMode.SAFE_NUMBER, Number.MIN_SAFE_INTEGER],
        [IntMode.MIXED, Number.MIN_SAFE_INTEGER],
        [IntMode.BIGINT, BigInt(Number.MIN_SAFE_INTEGER)],
      ]),
    },
    MIN_SAFE_INTEGER_MINUS_ONE: {
      input: BigInt(Number.MIN_SAFE_INTEGER) - BigInt(1),
      expected: new Map<IntMode, number | bigint | "error">([
        // exclude IntMode.UNSAFE_NUMBER, behavior will not be exact
        [IntMode.SAFE_NUMBER, "error"],
        [IntMode.MIXED, BigInt(Number.MIN_SAFE_INTEGER) - BigInt(1)],
        [IntMode.BIGINT, BigInt(Number.MIN_SAFE_INTEGER) - BigInt(1)],
      ]),
    },
    INT64_MAX: {
      input: BigInt("0x7fffffffffffffff"),
      expected: new Map<IntMode, number | bigint | "error">([
        // exclude IntMode.UNSAFE_NUMBER, behavior will not be exact
        [IntMode.SAFE_NUMBER, "error"],
        [IntMode.MIXED, BigInt("0x7fffffffffffffff")],
        [IntMode.BIGINT, BigInt("0x7fffffffffffffff")],
      ]),
    },
    INT64_MIN: {
      input: BigInt(-1) * BigInt("0x8000000000000000"),
      expected: new Map<IntMode, number | bigint | "error">([
        // exclude IntMode.UNSAFE_NUMBER, behavior will not be exact
        [IntMode.SAFE_NUMBER, "error"],
        [IntMode.MIXED, BigInt(-1) * BigInt("0x8000000000000000")],
        [IntMode.BIGINT, BigInt(-1) * BigInt("0x8000000000000000")],
      ]),
    },
  };
}

// declared as a function to delay referencing the BigInt constructor
function BIGUINTSPECS(): Record<string, TestCase> {
  return {
    ZERO: {
      input: BigInt(0),
      expected: new Map<IntMode, number | bigint>([
        [IntMode.UNSAFE_NUMBER, 0],
        [IntMode.SAFE_NUMBER, 0],
        [IntMode.MIXED, 0],
        [IntMode.BIGINT, BigInt(0)],
      ]),
    },
    ONE: {
      input: BigInt(1),
      expected: new Map<IntMode, number | bigint>([
        [IntMode.UNSAFE_NUMBER, 1],
        [IntMode.SAFE_NUMBER, 1],
        [IntMode.MIXED, 1],
        [IntMode.BIGINT, BigInt(1)],
      ]),
    },
    X_FF: {
      input: BigInt(0xff),
      expected: new Map<IntMode, number | bigint>([
        [IntMode.UNSAFE_NUMBER, 0xff],
        [IntMode.SAFE_NUMBER, 0xff],
        [IntMode.MIXED, 0xff],
        [IntMode.BIGINT, BigInt(0xff)],
      ]),
    },
    UINT32_MAX: {
      input: BigInt(0xffffffff),
      expected: new Map<IntMode, number | bigint>([
        [IntMode.UNSAFE_NUMBER, 0xffffffff],
        [IntMode.SAFE_NUMBER, 0xffffffff],
        [IntMode.MIXED, 0xffffffff],
        [IntMode.BIGINT, BigInt(0xffffffff)],
      ]),
    },
    MAX_SAFE_INTEGER: {
      input: BigInt(Number.MAX_SAFE_INTEGER),
      expected: new Map<IntMode, number | bigint>([
        [IntMode.UNSAFE_NUMBER, Number.MAX_SAFE_INTEGER],
        [IntMode.SAFE_NUMBER, Number.MAX_SAFE_INTEGER],
        [IntMode.MIXED, Number.MAX_SAFE_INTEGER],
        [IntMode.BIGINT, BigInt(Number.MAX_SAFE_INTEGER)],
      ]),
    },
    MAX_SAFE_INTEGER_PLUS_ONE: {
      input: BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1),
      expected: new Map<IntMode, number | bigint | "error">([
        // exclude IntMode.UNSAFE_NUMBER, behavior will not be exact
        [IntMode.SAFE_NUMBER, "error"],
        [IntMode.MIXED, BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1)],
        [IntMode.BIGINT, BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1)],
      ]),
    },
    UINT64_MAX: {
      input: BigInt("0xffffffffffffffff"),
      expected: new Map<IntMode, number | bigint | "error">([
        // exclude IntMode.UNSAFE_NUMBER, behavior will not be exact
        [IntMode.SAFE_NUMBER, "error"],
        [IntMode.MIXED, BigInt("0xffffffffffffffff")],
        [IntMode.BIGINT, BigInt("0xffffffffffffffff")],
      ]),
    },
  };
}

function abs(value: bigint): bigint {
  if (value < 0) {
    return BigInt(-1) * value;
  }
  return value;
}

const extensionCodec = new ExtensionCodec();
extensionCodec.register({
  type: 0,
  encode: (input: unknown) => {
    if (typeof input === "bigint") {
      if (input <= Number.MAX_SAFE_INTEGER && input >= Number.MIN_SAFE_INTEGER) {
        return encode(parseInt(input.toString(), 10));
      } else {
        return encode(input.toString());
      }
    } else {
      return null;
    }
  },
  decode: (data: Uint8Array) => {
    const val = decode(data);
    if (!(typeof val === "string" || typeof val === "number")) {
      throw new DecodeError(`unexpected BigInt source: ${val} (${typeof val})`);
    }
    return BigInt(val);
  },
});
context("extension", () => {
  it("encodes and decodes 0n", () => {
    const value = BigInt(0);
    const encoded = encode(value, { extensionCodec });
    assert.deepStrictEqual(decode(encoded, { extensionCodec }), value);
  });

  it("encodes and decodes MAX_SAFE_INTEGER+1", () => {
    const value = BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1);
    const encoded = encode(value, { extensionCodec });
    assert.deepStrictEqual(decode(encoded, { extensionCodec }), value);
  });

  it("encodes and decodes MIN_SAFE_INTEGER-1", () => {
    const value = BigInt(Number.MIN_SAFE_INTEGER) - BigInt(1);
    const encoded = encode(value, { extensionCodec });
    assert.deepStrictEqual(decode(encoded, { extensionCodec }), value);
  });
});

context("native", () => {
  context("int 64", () => {
    const specs = BIGINTSPECS();

    for (const name of Object.keys(specs)) {
      const testCase = specs[name]!;

      it(`sets and gets ${testCase.input} (${testCase.input < 0 ? "-" : ""}0x${abs(testCase.input).toString(
        16,
      )})`, () => {
        const b = new Uint8Array(8);
        const view = new DataView(b.buffer);
        view.setBigInt64(0, testCase.input);
        for (const [mode, expected] of testCase.expected) {
          if (expected === "error") {
            assert.throws(
              () => getInt64(view, 0, mode),
              new RegExp(
                `Mode is IntMode\\.SAFE_NUMBER and value is not a safe integer: ${testCase.input < 0 ? "-" : ""}0x${abs(
                  testCase.input,
                ).toString(16)}$`,
              ),
            );
            continue;
          }
          assert.deepStrictEqual(getInt64(view, 0, mode), expected);
        }
      });
    }
  });

  context("uint 64", () => {
    const specs = BIGUINTSPECS();

    for (const name of Object.keys(specs)) {
      const testCase = specs[name]!;

      it(`sets and gets ${testCase.input} (0x${testCase.input.toString(16)})`, () => {
        const b = new Uint8Array(8);
        const view = new DataView(b.buffer);
        view.setBigUint64(0, testCase.input);
        for (const [mode, expected] of testCase.expected) {
          if (expected === "error") {
            assert.throws(
              () => getUint64(view, 0, mode),
              new RegExp(
                `Mode is IntMode\\.SAFE_NUMBER and value is not a safe integer: 0x${testCase.input.toString(16)}$`,
              ),
            );
            continue;
          }
          assert.deepStrictEqual(getUint64(view, 0, mode), expected);
        }
      });
    }
  });
});

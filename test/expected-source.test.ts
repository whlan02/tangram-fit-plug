import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { expectedSource } from "../src/expected-source";

describe("expectedSource", () => {
  it("iOS 为 healthkit，Android 为 health-connect", () => {
    assert.equal(expectedSource("ios"), "healthkit");
    assert.equal(expectedSource("android"), "health-connect");
  });
});

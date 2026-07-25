// QA Lab tests cover canonical runtime-pair result projection.
import { describe, expect, it } from "vitest";
import { qaSuiteRuntimeParityTesting } from "./suite-runtime-parity-runner.js";

function makeCell(
  runtime: "openclaw" | "codex",
  status: "pass" | "fail" | "skip",
  runtimeErrorClass?: string,
) {
  return {
    runtime,
    status,
    transcriptBytes: "",
    toolCalls: [],
    finalText: "",
    usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    wallClockMs: 1,
    bootStateLines: [],
    ...(runtimeErrorClass ? { runtimeErrorClass } : {}),
  };
}

describe("QA suite runtime parity runner", () => {
  it("combines result-cell status with execution errors without losing skip details", () => {
    expect(
      qaSuiteRuntimeParityTesting.runtimeParityScenarioStepStatus({
        status: "pass",
        runtimeErrorClass: "scenario-failure",
      }),
    ).toBe("fail");
    expect(
      qaSuiteRuntimeParityTesting.runtimeParityScenarioStepStatus({
        status: "skip",
        runtimeErrorClass: "scenario-failure",
      }),
    ).toBe("fail");
    expect(qaSuiteRuntimeParityTesting.runtimeParityScenarioStepStatus({ status: "skip" })).toBe(
      "skip",
    );
    expect(
      qaSuiteRuntimeParityTesting.runtimeParityScenarioStepStatus({
        status: "skip",
        transportErrorClass: "gateway-disconnected",
      }),
    ).toBe("fail");
    expect(
      qaSuiteRuntimeParityTesting.formatRuntimeParityScenarioCellDetails({
        ...makeCell("codex", "skip"),
        details:
          "implementation unavailable\nRUNTIME_PARITY_SESSION_KEY=agent:qa:runtime-tool:read:happy",
      }),
    ).toContain("RUNTIME_PARITY_SESSION_KEY=agent:qa:runtime-tool:read:happy");

    expect(
      qaSuiteRuntimeParityTesting.runtimeParityScenarioResultStatus({
        scenarioId: "runtime-tool-read",
        cells: {
          openclaw: makeCell("openclaw", "skip"),
          codex: makeCell("codex", "pass", "scenario-failure"),
        },
        drift: "none",
      }),
    ).toBe("fail");
    expect(
      qaSuiteRuntimeParityTesting.runtimeParityScenarioResultStatus({
        scenarioId: "runtime-tool-read",
        cells: {
          openclaw: makeCell("openclaw", "skip"),
          codex: makeCell("codex", "skip"),
        },
        drift: "failure-mode",
      }),
    ).toBe("skip");
  });
});

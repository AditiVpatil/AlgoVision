import axios from "axios";

const JUDGE0_PUBLIC_API_URL = "https://ce.judge0.com";
const EXECUTION_TIMEOUT_MS = 5000;

export const executeCode = async ({ language_id, code, stdin = "" }) => {

  const parsedLanguageId = Number(language_id);

  console.log(
    `[JUDGE0] Request started — language_id: ${parsedLanguageId}, code: ${code.length} chars`
  );

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, EXECUTION_TIMEOUT_MS);

  try {

    console.log("[JUDGE0] Sending request to Judge0 CE...");

    const submitRes = await axios.post(
      `${JUDGE0_PUBLIC_API_URL}/submissions?base64_encoded=true&wait=true`,
      {
        language_id: parsedLanguageId,
        source_code: Buffer.from(code).toString("base64"),
        stdin: Buffer.from(stdin).toString("base64"),
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    console.log("[JUDGE0] Request completed.");

    const result = submitRes.data;

    const stdout = result.stdout
      ? Buffer.from(result.stdout, "base64").toString("utf-8")
      : "";

    const stderr = result.stderr
      ? Buffer.from(result.stderr, "base64").toString("utf-8")
      : "";

    const compileOutput = result.compile_output
      ? Buffer.from(result.compile_output, "base64").toString("utf-8")
      : "";

    const exitCode =
      result.exit_code ?? (result.status?.id === 3 ? 0 : 1);

    const statusId = result.status?.id || 0;

    let errorType = null;
    let statusMessage = "Success";

    if (statusId === 6) {
      errorType = "compile_error";
      statusMessage = "Compilation Failed";

    } else if (
      statusId === 5 ||
      statusId === 13 ||
      statusId === 14
    ) {

      errorType = "timeout";
      statusMessage = "Execution Timeout";

    } else if (statusId >= 7 && statusId <= 12) {

      errorType = "runtime_error";
      statusMessage = "Runtime Error";

    } else if (statusId > 3 && statusId !== 4) {

      errorType = "unknown_error";
      statusMessage =
        result.status?.description || "Unknown Error";
    }

    console.log(
      `[JUDGE0] Finished — exit code: ${exitCode}, status: ${statusMessage}`
    );

    return {
      success: true,
      language: parsedLanguageId,
      strategy: "Public Judge0 CE",
      output: {
        stdout,
        stderr,
        compileOutput,
        exitCode,
        hasError: !!errorType,
        errorType,
        statusMessage,
      },
    };

  } catch (err) {

    clearTimeout(timeoutId);

    console.error("[JUDGE0] Error:", err.message);

    if (
      axios.isCancel(err) ||
      err.name === "AbortError" ||
      err.code === "ECONNABORTED" ||
      err.code === "ERR_CANCELED" ||
      err.message.includes("timeout") ||
      err.message.includes("canceled")
    ) {

      const timeoutError = new Error("Execution timed out");

      timeoutError.status = 504;

      throw timeoutError;
    }

    if (err.response) {

      const status = err.response.status;

      const apiError = new Error(
        `Judge0 API Unavailable (Error ${status})`
      );

      apiError.status = 502;

      throw apiError;
    }

    if (err.request) {

      const networkError = new Error(
        "Could not reach Judge0 API"
      );

      networkError.status = 503;

      throw networkError;
    }

    const internalError = new Error(
      err.message || "Unexpected server error"
    );

    internalError.status = 500;

    throw internalError;
  }
};

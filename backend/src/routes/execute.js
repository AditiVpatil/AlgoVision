import express from "express";

import { executeCode } from "../services/judge0.js";

const router = express.Router();

router.post("/", async (req, res) => {

  const { language_id, code, stdin } = req.body;

  // Validation
  if (!language_id || !code) {

    console.warn(
      "[EXECUTE] Missing language_id or code."
    );

    return res.status(400).json({
      success: false,
      error:
        "Both `language_id` and `code` fields are required.",
    });
  }

  try {

    console.log("[EXECUTE] Starting execution...", { language_id, codePreview: code.substring(0, 50) });

    const result = await executeCode({
      language_id,
      code,
      stdin,
    });

    return res.json(result);

  } catch (err) {

    console.error("[EXECUTE] Error:", err.message);

    return res.status(err.status || 500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;
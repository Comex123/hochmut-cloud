import { handleInteraction, readInteractionPayload } from "../../_lib/discord.js";
import { jsonError } from "../../_lib/http.js";

export const onRequestPost = async ({ request, env }) => {
  try {
    const interaction = await readInteractionPayload(request, env);
    return handleInteraction(interaction, env, new URL(request.url).origin);
  } catch (error) {
    if (error.message === "invalid_signature" || error.message === "missing_signature") {
      return jsonError("Ungueltige Discord-Signatur.", 401);
    }

    return jsonError("Discord-Interaktion konnte nicht verarbeitet werden.", 500);
  }
};

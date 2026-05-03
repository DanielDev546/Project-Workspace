// This is your global AI state using Svelte 5 Runes
export const aiState = $state({
  reply: "",
  isWorking: false,
});

export async function askAI(userPrompt) {
  aiState.isWorking = true;

  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: userPrompt }),
  });

  const data = await res.json();
  aiState.reply = data.reply;
  aiState.isWorking = false;
}

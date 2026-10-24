const API = process.env.E2E_API ?? "http://localhost:7001/api";

export interface Account {
  username: string;
  email: string;
  password: string;
  token: string;
  id: string;
}

async function json<T>(resp: Response): Promise<T> {
  if (!resp.ok) throw new Error(`${resp.url} → ${resp.status} ${await resp.text()}`);
  return resp.json() as Promise<T>;
}

/** Register an account through the API (faster than the form when a test is not about sign-up). */
export async function register(prefix: string): Promise<Account> {
  const username = `${prefix}_${Date.now().toString(36)}${Math.floor(Math.random() * 99)}`;
  const password = "correct-horse-1";
  const body = await json<{ access_token: string; user: { id: string } }>(
    await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username,
        email: `${username}@example.com`,
        password,
        display_name: username,
      }),
    }),
  );
  return {
    username,
    email: `${username}@example.com`,
    password,
    token: body.access_token,
    id: body.user.id,
  };
}

const auth = (a: Account) => ({
  authorization: `Bearer ${a.token}`,
  "content-type": "application/json",
});

export async function createChannel(owner: Account, name: string) {
  const slug = `${name}-${Date.now().toString(36)}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const channel = await json<{ id: string; slug: string }>(
    await fetch(`${API}/communities`, {
      method: "POST",
      headers: auth(owner),
      body: JSON.stringify({ name, slug }),
    }),
  );
  const creds = await json<{ stream_url: string }>(
    await fetch(`${API}/communities/${channel.id}/stream-key`, { headers: auth(owner) }),
  );
  return { id: channel.id, slug: channel.slug, streamUrl: creds.stream_url };
}

export async function follow(user: Account, channelId: string) {
  await fetch(`${API}/communities/${channelId}/follow`, { method: "POST", headers: auth(user) });
}

export async function sendMessageHistory(channelId: string): Promise<{ content: string }[]> {
  return json(await fetch(`${API}/communities/${channelId}/messages`));
}

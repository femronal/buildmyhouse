const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ ? 'http://localhost:3001/api' : 'https://api.buildmyhouse.app/api');

async function parseError(response: Response, fallback: string) {
  try {
    const error = await response.json();
    return error?.message || fallback;
  } catch {
    return fallback;
  }
}

export type AccessPreview = {
  role: 'homeowner' | 'general_contractor';
  contactEmail: string;
  contactName?: string | null;
  project: {
    id: string;
    name: string;
    address: string;
    status: string;
    projectType?: string | null;
    budget: number;
    progress: number;
  };
  requiresVerification: boolean;
};

export type AccessVerifyResult = {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    verified: boolean;
    managedParticipant?: boolean;
    profileSetupCompleted?: boolean;
  };
  projectId: string;
  redirectPath: string;
};

export async function fetchAccessPreview(token: string): Promise<AccessPreview> {
  const response = await fetch(
    `${API_BASE_URL}/project-access/link/${encodeURIComponent(token)}/preview`,
  );
  if (!response.ok) {
    throw new Error(await parseError(response, 'This project link is invalid or has expired.'));
  }
  return response.json();
}

export async function requestAccessCode(token: string, email: string) {
  const response = await fetch(
    `${API_BASE_URL}/project-access/link/${encodeURIComponent(token)}/request-code`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    },
  );
  if (!response.ok) {
    throw new Error(await parseError(response, 'Could not send verification code.'));
  }
  return response.json();
}

export async function verifyAccessCode(
  token: string,
  params: { email: string; code: string; acceptTerms: boolean },
): Promise<AccessVerifyResult> {
  const response = await fetch(
    `${API_BASE_URL}/project-access/link/${encodeURIComponent(token)}/verify`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: params.email.trim().toLowerCase(),
        code: params.code.trim(),
        acceptTerms: params.acceptTerms,
      }),
    },
  );
  if (!response.ok) {
    throw new Error(await parseError(response, 'Verification failed.'));
  }
  return response.json();
}

export async function claimManagedAccount(
  token: string,
  params: { email: string; password: string; fullName: string; phone?: string },
): Promise<AccessVerifyResult> {
  const response = await fetch(
    `${API_BASE_URL}/project-access/link/${encodeURIComponent(token)}/claim`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: params.email.trim().toLowerCase(),
        password: params.password,
        fullName: params.fullName.trim(),
        phone: params.phone,
      }),
    },
  );
  if (!response.ok) {
    throw new Error(await parseError(response, 'Could not save account.'));
  }
  return response.json();
}

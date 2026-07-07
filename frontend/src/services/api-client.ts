export const parseError = async (response: Response) => {
  const errorBody = (await response.json().catch(() => null)) as { message?: string } | null;
  throw new Error(errorBody?.message ?? "Request failed");
};

export const buildAuthHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`
});

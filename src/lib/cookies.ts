export const parseSetCookies = (cookies: string[]): string => {
  const values = cookies.map((c) => c.split(";")[0]);

  if (values.length === 0) throw new Error("No session cookies received");

  return values.join("; ");
};

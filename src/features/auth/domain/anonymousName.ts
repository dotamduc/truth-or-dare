const ANONYMOUS_PREFIX = "ẨnDanh_";

export function anonymousDisplayNameFromUserId(userId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    throw new Error("Invalid anonymous user id.");
  }

  const suffix = userId.replaceAll("-", "").slice(0, 8).toLowerCase();

  return `${ANONYMOUS_PREFIX}${suffix}`;
}

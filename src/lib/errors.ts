/**
 * Thrown when the feed URL returns a 404 Not Found.
 */
export class FeedNotFoundError extends Error {
  code = "FEED_NOT_FOUND" as const;
  constructor(message = "The feed could not be found at this URL.") {
    super(message);
    this.name = "FeedNotFoundError";
  }
}

/**
 * Thrown when the feed server returns a 5xx error or is otherwise unavailable.
 */
export class FeedUnavailableError extends Error {
  code = "FEED_UNAVAILABLE" as const;
  constructor(
    message = "The feed server is currently unavailable. Please try again later.",
  ) {
    super(message);
    this.name = "FeedUnavailableError";
  }
}

/**
 * Thrown when the content is not a valid RSS or Atom feed.
 */
export class FeedInvalidFormatError extends Error {
  code = "FEED_INVALID_FORMAT" as const;
  constructor(
    message = "The content at this URL is not a valid RSS or Atom feed.",
  ) {
    super(message);
    this.name = "FeedInvalidFormatError";
  }
}

/**
 * Thrown when a low-level network error occurs (DNS, connection reset, timeout).
 */
export class FeedNetworkError extends Error {
  code = "FEED_NETWORK_ERROR" as const;
  constructor(
    message = "A network error occurred while trying to reach the feed.",
  ) {
    super(message);
    this.name = "FeedNetworkError";
  }
}

/**
 * Thrown when a subscription could not be found.
 */
export class SubscriptionNotFoundError extends Error {
  code = "SUBSCRIPTION_NOT_FOUND" as const;
  constructor(message = "The subscription could not be found.") {
    super(message);
    this.name = "SubscriptionNotFoundError";
  }
}

/**
 * Thrown when a feed record could not be found in the database.
 */
export class FeedRecordNotFoundError extends Error {
  code = "FEED_RECORD_NOT_FOUND" as const;
  constructor(message = "The feed record could not be found in the database.") {
    super(message);
    this.name = "FeedRecordNotFoundError";
  }
}

/**
 * Thrown when curated feeds are missing from the database during onboarding.
 * This indicates that the seeding script has not been run or is out of sync.
 */
export class CuratedFeedsMissingError extends Error {
  code = "CURATED_FEEDS_MISSING" as const;
  constructor(
    message = "Required curated feeds are missing from the database. Please run bun db:seed.",
  ) {
    super(message);
    this.name = "CuratedFeedsMissingError";
  }
}

/**
 * Thrown when a user tries to create a category with a name that already exists for them.
 */
export class DuplicateCategoryError extends Error {
  code = "DUPLICATE_CATEGORY" as const;
  constructor(message = "A category with this name already exists.") {
    super(message);
    this.name = "DuplicateCategoryError";
  }
}

/**
 * Thrown when a category record could not be found in the database.
 */
export class CategoryNotFoundError extends Error {
  code = "CATEGORY_NOT_FOUND" as const;
  constructor(message = "The category could not be found.") {
    super(message);
    this.name = "CategoryNotFoundError";
  }
}

/**
 * Thrown when an invalid scope is provided to markAllRead.
 */
export class InvalidMarkAllReadScopeError extends Error {
  code = "INVALID_MARK_ALL_READ_SCOPE" as const;
  constructor(scope: string) {
    super(`Invalid scope: ${scope}`);
    this.name = "InvalidMarkAllReadScopeError";
  }
}

/**
 * Thrown when an ID is required but missing for a specific scope in markAllRead.
 */
export class MarkAllReadIdRequiredError extends Error {
  code = "MARK_ALL_READ_ID_REQUIRED" as const;
  constructor(scope: "category" | "feed") {
    const formattedScope = scope.charAt(0).toUpperCase() + scope.slice(1);
    super(`${formattedScope} ID is required for ${scope} scope`);
    this.name = "MarkAllReadIdRequiredError";
  }
}

/**
 * Thrown when an internal invariant is violated during guest onboarding.
 * This indicates a programming error, not a data or user error.
 */
export class OnboardingInvariantError extends Error {
  code = "ONBOARDING_INVARIANT" as const;
  constructor(message: string) {
    super(message);
    this.name = "OnboardingInvariantError";
  }
}

/**
 * Thrown when a credential provider exists but no current password was supplied.
 */
export class PasswordRequiredError extends Error {
  code = "PASSWORD_REQUIRED" as const;
  constructor(
    message = "Current password is required to change your password.",
  ) {
    super(message);
    this.name = "PasswordRequiredError";
  }
}

/**
 * Thrown when the user tries to update to an email that is already in use.
 */
export class EmailAlreadyInUseError extends Error {
  code = "EMAIL_ALREADY_IN_USE" as const;
  constructor(message = "This email is already in use by another account.") {
    super(message);
    this.name = "EmailAlreadyInUseError";
  }
}

/**
 * Thrown when the user has no credential provider account.
 */
export class CredentialAccountRequiredError extends Error {
  code = "METHOD_NOT_ALLOWED" as const;
  constructor(message = "You must set a password before changing your email.") {
    super(message);
    this.name = "CredentialAccountRequiredError";
  }
}

/**
 * Thrown when auth.api.verifyPassword or equivalent check rejects.
 */
export class InvalidPasswordError extends Error {
  code = "INVALID_PASSWORD" as const;
  constructor(message = "The password you entered is incorrect.") {
    super(message);
    this.name = "InvalidPasswordError";
  }
}

/**
 * Thrown when the global sync schedule could not be found.
 */
export class SyncScheduleNotFoundError extends Error {
  code = "SYNC_SCHEDULE_NOT_FOUND" as const;
  constructor(message = "The global sync schedule could not be found.") {
    super(message);
    this.name = "SyncScheduleNotFoundError";
  }
}

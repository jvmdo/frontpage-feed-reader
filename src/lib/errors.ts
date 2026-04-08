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

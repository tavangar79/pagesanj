// Shapes returned by /admin/api/* (PRD §8). ObjectIds and dates arrive as strings.
export const SHOP_STATUSES = ['serious_warning', 'warning', 'mixed', 'recommended', 'no_known_issues'] as const;
export type ShopStatus = (typeof SHOP_STATUSES)[number];
export const OUTCOMES = ['delivered_ok', 'delivered_not_as_described', 'not_delivered', 'return_refused', 'other_problem'] as const;
export type Outcome = (typeof OUTCOMES)[number];
export const DIRECTIONS = ['positive', 'negative', 'mixed'] as const;
export type Direction = (typeof DIRECTIONS)[number];
export const REVIEW_STATUSES = ['pending', 'published', 'rejected'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];
export const WISHLIST_STATUSES = ['open', 'promoted', 'dismissed'] as const;
export type WishlistStatus = (typeof WISHLIST_STATUSES)[number];
export const REVIEWER_PERMISSIONS = ['link_only', 'screenshot', 'embed'] as const;
export type ReviewerPermission = (typeof REVIEWER_PERMISSIONS)[number];
export const JOB_TYPES = ['daily_check', 'backfill', 'post_owner_lookup', 'profile_fetch', 'token_refresh'] as const;
export type JobType = (typeof JOB_TYPES)[number];

export type Paged<T> = { items: T[]; total: number; page: number; limit: number };

export type AdminIdentity = { id?: string; _id?: string; username: string; role: 'owner' | 'moderator' };

export type Contact = { email?: string | null; website?: string | null; phone?: string | null };
export type StoredImage = { imageId: string; sha256: string; mime: string };

export type Shop = {
  _id: string;
  slug: string;
  displayName: string;
  handle: string;
  previousHandles: string[];
  status: ShopStatus;
  tags: string[];
  categoryIds: string[];
  bio?: string;
  profileImage: StoredImage;
  contact?: Contact;
  profileFetchedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  _id: string;
  name: string;
  nameEn?: string;
  slug: string;
  shopCount: number;
};

export type ReviewerSource = {
  _id: string;
  handle: string;
  name: string;
  follow: boolean;
  backfillLimit: number;
  backfillDone: boolean;
  lastSeenShortcode?: string;
  lastSeenPostAt?: string;
  permission: ReviewerPermission;
};

export type Review = {
  _id: string;
  shopId?: Pick<Shop, '_id' | 'displayName' | 'handle' | 'slug'> | null;
  wishlistId?: { _id: string; handle: string; requestCount: number; status: WishlistStatus } | null;
  reviewerSourceId?: Pick<ReviewerSource, '_id' | 'handle' | 'name' | 'permission'> | null;
  postShortcode: string;
  postUrl: string;
  occurredAt: string;
  caption: string;
  media?: { displayUrl?: string; videoUrl?: string };
  paidPartnership: boolean;
  status: ReviewStatus;
  outcome?: Outcome;
  direction?: Direction;
  summary?: string;
  rejectReason?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type WishlistEntry = {
  _id: string;
  handle: string;
  requestCount: number;
  sources: ('dm' | 'reviewer_post')[];
  firstRequestedAt: string;
  lastRequestedAt: string;
  status: WishlistStatus;
  promotedShopId?: string;
  pendingReviews: number;
};

export type JobRun = {
  _id: string;
  type: JobType;
  startedAt: string;
  finishedAt?: string;
  apifyRunId?: string;
  costUsd?: number;
  counts?: Record<string, number>;
  error?: string;
};

export type Usage = {
  monthlyUsageUsd: number | null;
  maxMonthlyUsageUsd: number | null;
  budgetStopUsd: number;
  recordedThisMonthUsd: number;
  apifyReachable: boolean;
};

/** Result of the profile fetch job (PRD §5.6). */
export type ProfileDraft = {
  handle: string;
  displayName?: string;
  image: (StoredImage & { url: string }) | null;
  imageError?: string;
  contact: { email: string | null; website: string | null; phone: string | null };
  fetchedAt: string;
};

export type ProfileJob =
  | { state: 'completed'; result: ProfileDraft }
  | { state: 'failed'; error: string }
  | { state: 'waiting' | 'active' | 'delayed' | 'prioritized' | 'waiting-children' | 'unknown' };

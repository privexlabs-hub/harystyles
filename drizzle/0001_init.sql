CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "passkeys" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text,
	"public_key" text NOT NULL,
	"user_id" uuid NOT NULL,
	"credential_id" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"aaguid" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "passkeys_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"granted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_user_id_role_pk" PRIMARY KEY("user_id","role"),
	CONSTRAINT "user_roles_role_check" CHECK ("user_roles"."role" in ('writer', 'curator', 'moderator', 'finance', 'admin'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" "citext" NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"display_name" text DEFAULT '' NOT NULL,
	"image" text,
	"status" text DEFAULT 'active' NOT NULL,
	"age_attested_at" timestamp with time zone,
	"onboarded_at" timestamp with time zone,
	"deletion_requested_at" timestamp with time zone,
	"purged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_status_check" CHECK ("users"."status" in ('active', 'deletion_requested', 'deleted', 'banned')),
	CONSTRAINT "users_display_name_len" CHECK (char_length("users"."display_name") <= 60)
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"user_id" uuid NOT NULL,
	"channel" text NOT NULL,
	"kind" text NOT NULL,
	"enabled" boolean NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_settings_user_id_channel_kind_pk" PRIMARY KEY("user_id","channel","kind"),
	CONSTRAINT "notif_settings_channel_check" CHECK ("notification_settings"."channel" in ('push', 'email', 'in_app')),
	CONSTRAINT "notif_settings_kind_check" CHECK ("notification_settings"."kind" in ('lamp_lit', 'new_letter_from_patronized_writer', 'private_reply', 'inbox_letter', 'billing_problem', 'security'))
);
--> statement-breakpoint
CREATE TABLE "reader_schedule" (
	"reader_id" uuid PRIMARY KEY NOT NULL,
	"next_lamp_at" timestamp with time zone NOT NULL,
	"next_evening_date" date NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"theme" text DEFAULT 'system' NOT NULL,
	"theme_auto_by_time" boolean DEFAULT false NOT NULL,
	"type_pair" text DEFAULT 'serif_sans' NOT NULL,
	"reading_size" text DEFAULT 'm' NOT NULL,
	"dyslexia_font" boolean DEFAULT false NOT NULL,
	"preferred_moods" text[] DEFAULT '{tender}'::text[] NOT NULL,
	"lamp_mode" text DEFAULT 'sunset' NOT NULL,
	"lamp_fixed_time" time,
	"timezone" text NOT NULL,
	"geo_cell" text,
	"quiet_start" time DEFAULT '23:00' NOT NULL,
	"quiet_end" time DEFAULT '08:00' NOT NULL,
	"anonymous_patron_default" boolean DEFAULT false NOT NULL,
	"field_updated_at" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prefs_theme_check" CHECK ("user_preferences"."theme" in ('system', 'ink', 'dusk', 'paper')),
	CONSTRAINT "prefs_type_pair_check" CHECK ("user_preferences"."type_pair" in ('serif_sans', 'serif_mono', 'all_serif')),
	CONSTRAINT "prefs_reading_size_check" CHECK ("user_preferences"."reading_size" in ('s', 'm', 'l')),
	CONSTRAINT "prefs_lamp_mode_check" CHECK ("user_preferences"."lamp_mode" in ('sunset', 'fixed')),
	CONSTRAINT "prefs_moods_check" CHECK (cardinality("user_preferences"."preferred_moods") between 1 and 3 and "user_preferences"."preferred_moods" <@ array['tender','restless','melancholy','still','burning','untethered']::text[]),
	CONSTRAINT "prefs_fixed_time_range" CHECK ("user_preferences"."lamp_fixed_time" is null or "user_preferences"."lamp_fixed_time" between '15:00' and '23:30'),
	CONSTRAINT "prefs_fixed_requires_time" CHECK ("user_preferences"."lamp_mode" <> 'fixed' or "user_preferences"."lamp_fixed_time" is not null),
	CONSTRAINT "prefs_geo_cell_precision" CHECK ("user_preferences"."geo_cell" is null or char_length("user_preferences"."geo_cell") = 4)
);
--> statement-breakpoint
CREATE TABLE "slug_redirects" (
	"old_slug" "citext" PRIMARY KEY NOT NULL,
	"writer_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "writer_applications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"pen_name" text NOT NULL,
	"bio" text NOT NULL,
	"samples" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"decision_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "application_status_check" CHECK ("writer_applications"."status" in ('pending', 'approved', 'waitlisted', 'declined'))
);
--> statement-breakpoint
CREATE TABLE "writer_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"pen_name" text NOT NULL,
	"pen_name_normalized" text NOT NULL,
	"slug" "citext" NOT NULL,
	"bio_quote" text,
	"location_phrase" text,
	"avatar_media_id" uuid,
	"avatar_hue" smallint DEFAULT 45 NOT NULL,
	"status" text NOT NULL,
	"preview_percent" smallint DEFAULT 30 NOT NULL,
	"keep_letters_after_departure" boolean DEFAULT false NOT NULL,
	"stripe_account_id" text,
	"payouts_enabled" boolean DEFAULT false NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by" uuid,
	"pen_name_changed_at" timestamp with time zone,
	"suspended_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "writer_profiles_pen_name_normalized_unique" UNIQUE("pen_name_normalized"),
	CONSTRAINT "writer_profiles_slug_unique" UNIQUE("slug"),
	CONSTRAINT "writer_profiles_stripe_account_id_unique" UNIQUE("stripe_account_id"),
	CONSTRAINT "writer_status_check" CHECK ("writer_profiles"."status" in ('applied', 'waitlisted', 'declined', 'approved', 'suspended', 'banned', 'departed')),
	CONSTRAINT "writer_pen_name_len" CHECK (char_length("writer_profiles"."pen_name") between 2 and 40),
	CONSTRAINT "writer_bio_len" CHECK ("writer_profiles"."bio_quote" is null or char_length("writer_profiles"."bio_quote") <= 200),
	CONSTRAINT "writer_location_len" CHECK ("writer_profiles"."location_phrase" is null or char_length("writer_profiles"."location_phrase") <= 60),
	CONSTRAINT "writer_preview_range" CHECK ("writer_profiles"."preview_percent" between 0 and 30),
	CONSTRAINT "writer_avatar_hue_range" CHECK ("writer_profiles"."avatar_hue" between 0 and 360)
);
--> statement-breakpoint
CREATE TABLE "letter_content_notes" (
	"letter_id" uuid NOT NULL,
	"note" text NOT NULL,
	"set_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "letter_content_notes_letter_id_note_pk" PRIMARY KEY("letter_id","note"),
	CONSTRAINT "content_note_check" CHECK ("letter_content_notes"."note" in ('grief', 'self_harm', 'suicide', 'abuse', 'addiction', 'illness', 'violence', 'sexual_content')),
	CONSTRAINT "content_note_set_by_check" CHECK ("letter_content_notes"."set_by" in ('writer', 'curator'))
);
--> statement-breakpoint
CREATE TABLE "letter_media" (
	"letter_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	CONSTRAINT "letter_media_letter_id_media_id_pk" PRIMARY KEY("letter_id","media_id")
);
--> statement-breakpoint
CREATE TABLE "letter_revisions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"letter_id" uuid NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"body" jsonb NOT NULL,
	"body_text" text NOT NULL,
	"anchors" jsonb NOT NULL,
	"word_count" integer NOT NULL,
	"editor_schema_version" integer NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "letters" (
	"id" uuid PRIMARY KEY NOT NULL,
	"writer_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"primary_mood" text,
	"visibility" text DEFAULT 'public' NOT NULL,
	"deliver_to_inbox" boolean DEFAULT false NOT NULL,
	"ai_assisted" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"current_revision_id" uuid,
	"published_revision_id" uuid,
	"word_count" integer,
	"reading_minutes" smallint,
	"notebook_id" uuid,
	"notebook_position" integer,
	"scheduled_for" timestamp with time zone,
	"published_at" timestamp with time zone,
	"withdrawn_at" timestamp with time zone,
	"removed_at" timestamp with time zone,
	"removed_reason" text,
	"version" integer DEFAULT 1 NOT NULL,
	"search_vector" "tsvector",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "letters_writer_slug" UNIQUE("writer_id","slug"),
	CONSTRAINT "letters_title_len" CHECK (char_length("letters"."title") between 1 and 140),
	CONSTRAINT "letters_subtitle_len" CHECK ("letters"."subtitle" is null or char_length("letters"."subtitle") <= 200),
	CONSTRAINT "letters_mood_check" CHECK ("letters"."primary_mood" is null or "letters"."primary_mood" in ('tender', 'restless', 'melancholy', 'still', 'burning', 'untethered')),
	CONSTRAINT "letters_visibility_check" CHECK ("letters"."visibility" in ('public', 'patron')),
	CONSTRAINT "letters_status_check" CHECK ("letters"."status" in ('draft', 'scheduled', 'published', 'withdrawn', 'removed')),
	CONSTRAINT "letters_notebook_pair" CHECK (("letters"."notebook_id" is null) = ("letters"."notebook_position" is null)),
	CONSTRAINT "letters_scheduled_needs_time" CHECK ("letters"."status" <> 'scheduled' or "letters"."scheduled_for" is not null),
	CONSTRAINT "letters_inbox_needs_patron" CHECK (not "letters"."deliver_to_inbox" or "letters"."visibility" = 'patron'),
	CONSTRAINT "letters_publishable" CHECK ("letters"."status" not in ('published','scheduled') or ("letters"."primary_mood" is not null and "letters"."published_revision_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"bucket" text NOT NULL,
	"object_key" text NOT NULL,
	"mime" text NOT NULL,
	"bytes" integer,
	"width" integer,
	"height" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_object_key_unique" UNIQUE("object_key"),
	CONSTRAINT "media_bucket_check" CHECK ("media"."bucket" in ('quarantine', 'public', 'private')),
	CONSTRAINT "media_status_check" CHECK ("media"."status" in ('pending', 'ready', 'rejected')),
	CONSTRAINT "media_size_limit" CHECK ("media"."bytes" is null or "media"."bytes" <= 10485760)
);
--> statement-breakpoint
CREATE TABLE "notebooks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"writer_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"mood_tint" text,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notebooks_writer_position" UNIQUE("writer_id","position"),
	CONSTRAINT "notebooks_writer_slug" UNIQUE("writer_id","slug"),
	CONSTRAINT "notebooks_title_len" CHECK (char_length("notebooks"."title") between 1 and 80),
	CONSTRAINT "notebooks_mood_tint_check" CHECK ("notebooks"."mood_tint" is null or "notebooks"."mood_tint" in ('tender', 'restless', 'melancholy', 'still', 'burning', 'untethered'))
);
--> statement-breakpoint
CREATE TABLE "curator_reviews" (
	"letter_id" uuid PRIMARY KEY NOT NULL,
	"confirmed_mood" text NOT NULL,
	"curator_id" uuid NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "curator_reviews_mood_check" CHECK ("curator_reviews"."confirmed_mood" in ('tender', 'restless', 'melancholy', 'still', 'burning', 'untethered'))
);
--> statement-breakpoint
CREATE TABLE "evergreen_pool" (
	"letter_id" uuid PRIMARY KEY NOT NULL,
	"mood" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"added_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "evergreen_mood_check" CHECK ("evergreen_pool"."mood" in ('tender', 'restless', 'melancholy', 'still', 'burning', 'untethered'))
);
--> statement-breakpoint
CREATE TABLE "issue_changes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"issue_id" uuid NOT NULL,
	"actor_id" uuid,
	"change" jsonb NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issue_slots" (
	"issue_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"letter_id" uuid NOT NULL,
	"writer_id" uuid NOT NULL,
	CONSTRAINT "issue_slots_issue_id_position_pk" PRIMARY KEY("issue_id","position"),
	CONSTRAINT "issue_slots_letter" UNIQUE("issue_id","letter_id"),
	CONSTRAINT "issue_slots_writer" UNIQUE("issue_id","writer_id"),
	CONSTRAINT "issue_slots_position_range" CHECK ("issue_slots"."position" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "issues" (
	"id" uuid PRIMARY KEY NOT NULL,
	"evening_date" date NOT NULL,
	"mood" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"source" text DEFAULT 'curated' NOT NULL,
	"curator_id" uuid,
	"locked_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "issues_date_mood" UNIQUE("evening_date","mood"),
	CONSTRAINT "issues_mood_check" CHECK ("issues"."mood" in ('tender', 'restless', 'melancholy', 'still', 'burning', 'untethered')),
	CONSTRAINT "issues_status_check" CHECK ("issues"."status" in ('draft', 'scheduled', 'locked', 'live', 'archived')),
	CONSTRAINT "issues_source_check" CHECK ("issues"."source" in ('curated', 'evergreen'))
);
--> statement-breakpoint
CREATE TABLE "ration_slots" (
	"ration_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"generation" smallint DEFAULT 0 NOT NULL,
	"letter_id" uuid NOT NULL,
	"source" text NOT NULL,
	"state" text DEFAULT 'active' NOT NULL,
	"read_at" timestamp with time zone,
	"progress" real DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ration_slots_ration_id_position_generation_pk" PRIMARY KEY("ration_id","position","generation"),
	CONSTRAINT "ration_slots_position_range" CHECK ("ration_slots"."position" between 1 and 5),
	CONSTRAINT "ration_slots_source_check" CHECK ("ration_slots"."source" in ('issue', 'patron', 'follow', 'evergreen')),
	CONSTRAINT "ration_slots_state_check" CHECK ("ration_slots"."state" in ('active', 'superseded', 'tombstoned'))
);
--> statement-breakpoint
CREATE TABLE "rations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"reader_id" uuid NOT NULL,
	"evening_date" date NOT NULL,
	"mood" text NOT NULL,
	"original_mood" text,
	"issue_id" uuid,
	"lamp_at" timestamp with time zone NOT NULL,
	"timezone" text NOT NULL,
	"mood_switched_at" timestamp with time zone,
	"short_ration" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rations_reader_evening" UNIQUE("reader_id","evening_date"),
	CONSTRAINT "rations_mood_check" CHECK ("rations"."mood" in ('tender', 'restless', 'melancholy', 'still', 'burning', 'untethered'))
);
--> statement-breakpoint
CREATE TABLE "reads" (
	"reader_id" uuid NOT NULL,
	"letter_id" uuid NOT NULL,
	"first_opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_heartbeat_at" timestamp with time zone,
	"max_progress" real DEFAULT 0 NOT NULL,
	"dwell_seconds" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "reads_reader_id_letter_id_pk" PRIMARY KEY("reader_id","letter_id"),
	CONSTRAINT "reads_progress_range" CHECK ("reads"."max_progress" between 0 and 1)
);
--> statement-breakpoint
CREATE TABLE "blocks" (
	"blocker_id" uuid NOT NULL,
	"blocked_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blocks_blocker_id_blocked_id_pk" PRIMARY KEY("blocker_id","blocked_id"),
	CONSTRAINT "blocks_not_self" CHECK ("blocks"."blocker_id" <> "blocks"."blocked_id")
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"reader_id" uuid NOT NULL,
	"writer_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "follows_reader_id_writer_id_pk" PRIMARY KEY("reader_id","writer_id")
);
--> statement-breakpoint
CREATE TABLE "kept_lines" (
	"id" uuid PRIMARY KEY NOT NULL,
	"reader_id" uuid NOT NULL,
	"letter_id" uuid NOT NULL,
	"revision_id" uuid NOT NULL,
	"anchor_from" jsonb,
	"anchor_to" jsonb,
	"text_snapshot" text NOT NULL,
	"title_snapshot" text NOT NULL,
	"pen_name_snapshot" text NOT NULL,
	"mood_snapshot" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kept_lines_len" CHECK (char_length("kept_lines"."text_snapshot") between 1 and 500)
);
--> statement-breakpoint
CREATE TABLE "letter_stats" (
	"letter_id" uuid PRIMARY KEY NOT NULL,
	"reactions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"kept_count" integer DEFAULT 0 NOT NULL,
	"open_count" integer DEFAULT 0 NOT NULL,
	"completed_count" integer DEFAULT 0 NOT NULL,
	"refreshed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reactions" (
	"reader_id" uuid NOT NULL,
	"letter_id" uuid NOT NULL,
	"anchor_id" text NOT NULL,
	"glyph" text NOT NULL,
	"revision_id" uuid NOT NULL,
	"orphaned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reactions_reader_id_letter_id_anchor_id_pk" PRIMARY KEY("reader_id","letter_id","anchor_id"),
	CONSTRAINT "reactions_glyph_check" CHECK ("reactions"."glyph" in ('kept', 'tender', 'spark', 'staying', 'held'))
);
--> statement-breakpoint
CREATE TABLE "saves" (
	"reader_id" uuid NOT NULL,
	"letter_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saves_reader_id_letter_id_pk" PRIMARY KEY("reader_id","letter_id")
);
--> statement-breakpoint
CREATE TABLE "entitlements" (
	"id" uuid PRIMARY KEY NOT NULL,
	"reader_id" uuid NOT NULL,
	"writer_id" uuid NOT NULL,
	"source" text NOT NULL,
	"source_ref" text NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_until" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entitlements_source_ref" UNIQUE("source","source_ref"),
	CONSTRAINT "entitlements_source_check" CHECK ("entitlements"."source" in ('stripe', 'apple', 'google', 'gift', 'comp')),
	CONSTRAINT "entitlements_status_check" CHECK ("entitlements"."status" in ('active', 'grace', 'revoked')),
	CONSTRAINT "entitlements_validity" CHECK ("entitlements"."valid_until" > "entitlements"."valid_from")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY NOT NULL,
	"actor_id" uuid,
	"actor_roles" text[] DEFAULT '{}'::text[] NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"reason" text,
	"request_id" text,
	"ip_hash" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"key" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"rules" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"owner" text NOT NULL,
	"expires_on" date,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flags_kind_check" CHECK ("feature_flags"."kind" in ('release', 'ops', 'experiment'))
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"user_id" uuid NOT NULL,
	"key" text NOT NULL,
	"request_hash" text NOT NULL,
	"status_code" integer,
	"response" jsonb,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idempotency_keys_user_id_key_pk" PRIMARY KEY("user_id","key")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"channel" text NOT NULL,
	"payload" jsonb NOT NULL,
	"dedupe_key" text NOT NULL,
	"not_before" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"status" text DEFAULT 'queued' NOT NULL,
	"sent_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_dedupe_key_unique" UNIQUE("dedupe_key"),
	CONSTRAINT "notifications_kind_check" CHECK ("notifications"."kind" in ('lamp_lit', 'new_letter_from_patronized_writer', 'private_reply', 'inbox_letter', 'billing_problem', 'security', 'application_decision')),
	CONSTRAINT "notifications_channel_check" CHECK ("notifications"."channel" in ('push', 'email', 'in_app')),
	CONSTRAINT "notifications_status_check" CHECK ("notifications"."status" in ('queued', 'sent', 'dropped', 'failed'))
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"aggregate_type" text NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"type" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"payload" jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"bucket" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "rate_limits_bucket_window_start_pk" PRIMARY KEY("bucket","window_start")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkeys" ADD CONSTRAINT "passkeys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reader_schedule" ADD CONSTRAINT "reader_schedule_reader_id_users_id_fk" FOREIGN KEY ("reader_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slug_redirects" ADD CONSTRAINT "slug_redirects_writer_id_writer_profiles_user_id_fk" FOREIGN KEY ("writer_id") REFERENCES "public"."writer_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writer_applications" ADD CONSTRAINT "writer_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writer_applications" ADD CONSTRAINT "writer_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writer_profiles" ADD CONSTRAINT "writer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writer_profiles" ADD CONSTRAINT "writer_profiles_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letter_content_notes" ADD CONSTRAINT "letter_content_notes_letter_id_letters_id_fk" FOREIGN KEY ("letter_id") REFERENCES "public"."letters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letter_media" ADD CONSTRAINT "letter_media_letter_id_letters_id_fk" FOREIGN KEY ("letter_id") REFERENCES "public"."letters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letter_media" ADD CONSTRAINT "letter_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letter_revisions" ADD CONSTRAINT "letter_revisions_letter_id_letters_id_fk" FOREIGN KEY ("letter_id") REFERENCES "public"."letters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letter_revisions" ADD CONSTRAINT "letter_revisions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letters" ADD CONSTRAINT "letters_writer_id_writer_profiles_user_id_fk" FOREIGN KEY ("writer_id") REFERENCES "public"."writer_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letters" ADD CONSTRAINT "letters_notebook_id_notebooks_id_fk" FOREIGN KEY ("notebook_id") REFERENCES "public"."notebooks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notebooks" ADD CONSTRAINT "notebooks_writer_id_writer_profiles_user_id_fk" FOREIGN KEY ("writer_id") REFERENCES "public"."writer_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curator_reviews" ADD CONSTRAINT "curator_reviews_letter_id_letters_id_fk" FOREIGN KEY ("letter_id") REFERENCES "public"."letters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curator_reviews" ADD CONSTRAINT "curator_reviews_curator_id_users_id_fk" FOREIGN KEY ("curator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evergreen_pool" ADD CONSTRAINT "evergreen_pool_letter_id_letters_id_fk" FOREIGN KEY ("letter_id") REFERENCES "public"."letters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evergreen_pool" ADD CONSTRAINT "evergreen_pool_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_changes" ADD CONSTRAINT "issue_changes_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_changes" ADD CONSTRAINT "issue_changes_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_slots" ADD CONSTRAINT "issue_slots_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_slots" ADD CONSTRAINT "issue_slots_letter_id_letters_id_fk" FOREIGN KEY ("letter_id") REFERENCES "public"."letters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_slots" ADD CONSTRAINT "issue_slots_writer_id_writer_profiles_user_id_fk" FOREIGN KEY ("writer_id") REFERENCES "public"."writer_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_curator_id_users_id_fk" FOREIGN KEY ("curator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ration_slots" ADD CONSTRAINT "ration_slots_ration_id_rations_id_fk" FOREIGN KEY ("ration_id") REFERENCES "public"."rations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ration_slots" ADD CONSTRAINT "ration_slots_letter_id_letters_id_fk" FOREIGN KEY ("letter_id") REFERENCES "public"."letters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rations" ADD CONSTRAINT "rations_reader_id_users_id_fk" FOREIGN KEY ("reader_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rations" ADD CONSTRAINT "rations_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reads" ADD CONSTRAINT "reads_reader_id_users_id_fk" FOREIGN KEY ("reader_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reads" ADD CONSTRAINT "reads_letter_id_letters_id_fk" FOREIGN KEY ("letter_id") REFERENCES "public"."letters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocker_id_users_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocked_id_users_id_fk" FOREIGN KEY ("blocked_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_reader_id_users_id_fk" FOREIGN KEY ("reader_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_writer_id_writer_profiles_user_id_fk" FOREIGN KEY ("writer_id") REFERENCES "public"."writer_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kept_lines" ADD CONSTRAINT "kept_lines_reader_id_users_id_fk" FOREIGN KEY ("reader_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kept_lines" ADD CONSTRAINT "kept_lines_letter_id_letters_id_fk" FOREIGN KEY ("letter_id") REFERENCES "public"."letters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kept_lines" ADD CONSTRAINT "kept_lines_revision_id_letter_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."letter_revisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letter_stats" ADD CONSTRAINT "letter_stats_letter_id_letters_id_fk" FOREIGN KEY ("letter_id") REFERENCES "public"."letters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_reader_id_users_id_fk" FOREIGN KEY ("reader_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_letter_id_letters_id_fk" FOREIGN KEY ("letter_id") REFERENCES "public"."letters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_revision_id_letter_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."letter_revisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saves" ADD CONSTRAINT "saves_reader_id_users_id_fk" FOREIGN KEY ("reader_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saves" ADD CONSTRAINT "saves_letter_id_letters_id_fk" FOREIGN KEY ("letter_id") REFERENCES "public"."letters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_reader_id_users_id_fk" FOREIGN KEY ("reader_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_writer_id_writer_profiles_user_id_fk" FOREIGN KEY ("writer_id") REFERENCES "public"."writer_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "passkeys_user_idx" ON "passkeys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "reader_schedule_next_lamp_idx" ON "reader_schedule" USING btree ("next_lamp_at");--> statement-breakpoint
CREATE INDEX "applications_status_idx" ON "writer_applications" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "applications_user_idx" ON "writer_applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "writer_pen_name_trgm" ON "writer_profiles" USING gin ("pen_name_normalized" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "letter_revisions_letter_idx" ON "letter_revisions" USING btree ("letter_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "letters_writer_published_idx" ON "letters" USING btree ("writer_id","published_at" DESC NULLS LAST) WHERE "letters"."status" = 'published';--> statement-breakpoint
CREATE INDEX "letters_scheduled_idx" ON "letters" USING btree ("scheduled_for") WHERE "letters"."status" = 'scheduled';--> statement-breakpoint
CREATE INDEX "letters_search_idx" ON "letters" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "media_pending_idx" ON "media" USING btree ("created_at") WHERE "media"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "evergreen_mood_idx" ON "evergreen_pool" USING btree ("mood") WHERE "evergreen_pool"."active";--> statement-breakpoint
CREATE INDEX "issue_changes_issue_idx" ON "issue_changes" USING btree ("issue_id");--> statement-breakpoint
CREATE INDEX "issue_slots_letter_idx" ON "issue_slots" USING btree ("letter_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ration_slots_one_active" ON "ration_slots" USING btree ("ration_id","position") WHERE "ration_slots"."state" = 'active';--> statement-breakpoint
CREATE INDEX "ration_slots_letter_active_idx" ON "ration_slots" USING btree ("letter_id") WHERE "ration_slots"."state" = 'active';--> statement-breakpoint
CREATE INDEX "rations_reader_recent_idx" ON "rations" USING btree ("reader_id","evening_date" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "reads_completed_idx" ON "reads" USING btree ("reader_id") WHERE "reads"."completed_at" is not null;--> statement-breakpoint
CREATE INDEX "follows_writer_idx" ON "follows" USING btree ("writer_id");--> statement-breakpoint
CREATE INDEX "kept_lines_reader_idx" ON "kept_lines" USING btree ("reader_id","created_at" DESC NULLS LAST) WHERE "kept_lines"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "kept_lines_letter_idx" ON "kept_lines" USING btree ("letter_id");--> statement-breakpoint
CREATE INDEX "reactions_letter_idx" ON "reactions" USING btree ("letter_id");--> statement-breakpoint
CREATE INDEX "entitlements_lookup_idx" ON "entitlements" USING btree ("reader_id","writer_id","valid_until") WHERE "entitlements"."status" in ('active','grace');--> statement-breakpoint
CREATE INDEX "audit_target_idx" ON "audit_log" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_log" USING btree ("actor_id","at");--> statement-breakpoint
CREATE INDEX "notifications_queue_idx" ON "notifications" USING btree ("not_before") WHERE "notifications"."status" = 'queued';--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "outbox_unpublished_idx" ON "outbox_events" USING btree ("occurred_at") WHERE "outbox_events"."published_at" is null;
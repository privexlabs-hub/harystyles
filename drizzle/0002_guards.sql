-- harystyles 0002 · database-level guards that Drizzle can't express (docs/03 §3.1, §3.3, AGENTS.md)

-- Append-only tables: letter_revisions, issue_changes, audit_log (BR-LE-03, INV-12).
CREATE OR REPLACE FUNCTION hs_reject_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'table % is append-only', TG_TABLE_NAME USING ERRCODE = 'insufficient_privilege';
END $$;
--> statement-breakpoint
CREATE TRIGGER letter_revisions_append_only BEFORE UPDATE OR DELETE ON letter_revisions
  FOR EACH ROW EXECUTE FUNCTION hs_reject_mutation();
--> statement-breakpoint
CREATE TRIGGER issue_changes_append_only BEFORE UPDATE OR DELETE ON issue_changes
  FOR EACH ROW EXECUTE FUNCTION hs_reject_mutation();
--> statement-breakpoint
CREATE TRIGGER audit_log_append_only BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION hs_reject_mutation();
--> statement-breakpoint

-- BR-LE-09: notebook positions unique, checked at commit so reordering can swap positions.
ALTER TABLE letters ADD CONSTRAINT letters_notebook_position_unique
  UNIQUE (notebook_id, notebook_position) DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint

-- Revision pointers must reference a revision of the same letter.
ALTER TABLE letters ADD CONSTRAINT letters_current_revision_fk
  FOREIGN KEY (current_revision_id) REFERENCES letter_revisions(id) DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint
ALTER TABLE letters ADD CONSTRAINT letters_published_revision_fk
  FOREIGN KEY (published_revision_id) REFERENCES letter_revisions(id) DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint

-- updated_at maintained by trigger as well as by the application (docs/03 §3.1).
CREATE OR REPLACE FUNCTION hs_touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;
--> statement-breakpoint
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','user_preferences','writer_profiles','letters','notebooks','media','issues','reactions','entitlements']
  LOOP
    EXECUTE format('CREATE TRIGGER %I_touch BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION hs_touch_updated_at()', t, t);
  END LOOP;
END $$;
--> statement-breakpoint

-- BR-CU-01: an issue that is scheduled or later must hold exactly 5 slots (checked on status change).
CREATE OR REPLACE FUNCTION hs_issue_slot_count() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  IF NEW.status IN ('scheduled','locked','live') AND (TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status) THEN
    SELECT count(*) INTO n FROM issue_slots WHERE issue_id = NEW.id;
    IF n <> 5 THEN
      RAISE EXCEPTION 'issue % must have exactly 5 slots to be %, has %', NEW.id, NEW.status, n USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER issues_five_slots AFTER INSERT OR UPDATE OF status ON issues
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION hs_issue_slot_count();

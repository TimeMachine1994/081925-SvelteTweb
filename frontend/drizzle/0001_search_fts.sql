-- Full-text search index replacing Algolia. Rows are keyed by (entity_type, entity_id)
-- and kept in sync by triggers on memorials and funeral_directors.
CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
	entity_type UNINDEXED,
	entity_id UNINDEXED,
	title,
	body,
	tokenize = 'unicode61 remove_diacritics 2'
);
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS memorials_ai AFTER INSERT ON memorials BEGIN
	INSERT INTO search_index(entity_type, entity_id, title, body)
	SELECT 'memorial', new.id, coalesce(new.custom_title, new.loved_one_name),
		coalesce(new.loved_one_name, '') || ' ' || coalesce(new.full_slug, '') || ' ' || coalesce(new.funeral_home_name, '') || ' ' || coalesce(new.content, '')
	WHERE new.is_public = 1;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS memorials_ad AFTER DELETE ON memorials BEGIN
	DELETE FROM search_index WHERE entity_type = 'memorial' AND entity_id = old.id;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS memorials_au AFTER UPDATE ON memorials BEGIN
	DELETE FROM search_index WHERE entity_type = 'memorial' AND entity_id = old.id;
	INSERT INTO search_index(entity_type, entity_id, title, body)
	SELECT 'memorial', new.id, coalesce(new.custom_title, new.loved_one_name),
		coalesce(new.loved_one_name, '') || ' ' || coalesce(new.full_slug, '') || ' ' || coalesce(new.funeral_home_name, '') || ' ' || coalesce(new.content, '')
	WHERE new.is_public = 1;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS funeral_directors_ai AFTER INSERT ON funeral_directors BEGIN
	INSERT INTO search_index(entity_type, entity_id, title, body)
	VALUES ('funeral_director', new.id, new.company_name,
		coalesce(new.contact_person, '') || ' ' || coalesce(new.address_city, '') || ' ' || coalesce(new.address_state, ''));
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS funeral_directors_ad AFTER DELETE ON funeral_directors BEGIN
	DELETE FROM search_index WHERE entity_type = 'funeral_director' AND entity_id = old.id;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS funeral_directors_au AFTER UPDATE ON funeral_directors BEGIN
	DELETE FROM search_index WHERE entity_type = 'funeral_director' AND entity_id = old.id;
	INSERT INTO search_index(entity_type, entity_id, title, body)
	VALUES ('funeral_director', new.id, new.company_name,
		coalesce(new.contact_person, '') || ' ' || coalesce(new.address_city, '') || ' ' || coalesce(new.address_state, ''));
END;

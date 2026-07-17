CREATE OR REPLACE FUNCTION wortgeflecht.search_wortgeflecht(term text)
RETURNS SETOF wortgeflecht.game
LANGUAGE sql
STABLE
AS $$
    SELECT g.*
    FROM wortgeflecht.game g
    WHERE g.name ILIKE '%' || term || '%'
        OR g.description ILIKE '%' || term || '%'
        OR g.id::text = term
        OR to_char(g.published_at, 'YYYY-MM-DD') = term
        OR EXISTS (
            SELECT 1
            FROM wortgeflecht.game_word w
            WHERE w.game_id = g.game_id
            AND w.word ILIKE '%' || term || '%'
        );
$$;

GRANT EXECUTE ON FUNCTION wortgeflecht.search_wortgeflecht(text) TO web_anon;

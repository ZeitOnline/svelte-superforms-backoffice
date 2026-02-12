CREATE OR REPLACE FUNCTION spelling_bee.search_spelling_bee(term text)
RETURNS SETOF spelling_bee.game
LANGUAGE sql
STABLE
AS $$
    SELECT g.*
    FROM spelling_bee.game g
    WHERE g.name ILIKE '%' || term || '%'
        OR g.wordcloud ILIKE '%' || term || '%'
        OR EXISTS (
            SELECT 1
            FROM spelling_bee.game_solution s
            WHERE s.game_id = g.id
            AND s.points = 12
            AND s.solution ILIKE '%' || term || '%'
        );
$$;

GRANT EXECUTE ON FUNCTION spelling_bee.search_spelling_bee(text) TO web_anon;
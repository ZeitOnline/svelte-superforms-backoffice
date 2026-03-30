-- Optional local-only fixture data for pagination/manual QA.
-- Adds 90 synthetic dictionary words so wortgeflecht has >100 entries.

INSERT INTO wortgeflecht.dictionary (word)
SELECT 'probewort' || first_char || second_char
FROM (
    SELECT chr(first_code) AS first_char, chr(second_code) AS second_char
    FROM generate_series(97, 122) AS first_code
    CROSS JOIN generate_series(97, 122) AS second_code
    ORDER BY first_code, second_code
    LIMIT 90
) AS generated_words
ON CONFLICT (word) DO NOTHING;

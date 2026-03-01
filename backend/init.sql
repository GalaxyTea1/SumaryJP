CREATE TABLE vocabulary (
    id SERIAL PRIMARY KEY,
    lesson VARCHAR(10) NOT NULL,
    level VARCHAR(5) NOT NULL,
    japanese VARCHAR(50) NOT NULL,
    hiragana VARCHAR(50) NOT NULL,
    meaning VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'not-learned',
    last_reviewed TIMESTAMP,
    review_count INTEGER DEFAULT 0,
    is_difficult BOOLEAN DEFAULT false
);

-- Insert some dummy data (optional)
INSERT INTO vocabulary (lesson, level, japanese, hiragana, meaning, type) VALUES
('1', 'N5', '私', 'わたし', 'Tôi', 'Danh từ'),
('1', 'N5', '私たち', 'わたしたち', 'Chúng tôi', 'Danh từ'),
('1', 'N5', 'あなた', 'あなた', 'Anh/chị, ông/bà, bạn (ngôi thứ 2 số ít)', 'Danh từ');

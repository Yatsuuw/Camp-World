CREATE TABLE IF NOT EXISTS servers (
    id VARCHAR(19) NOT NULL,
    owner VARCHAR(19) NOT NULL,
    PRIMARY KEY (id, owner)
);

CREATE TABLE IF NOT EXISTS users (
    user VARCHAR(19) NOT NULL,
    website VARCHAR(1) NULL,
    username VARCHAR(50) NULL,
    mangacollec VARCHAR(50) NULL,
    PRIMARY KEY (user)
);

CREATE TABLE IF NOT EXISTS manga_translates (
    manga VARCHAR(100) NOT NULL,
    language VARCHAR(2) NOT NULL,
    PRIMARY KEY (manga, language)
);

CREATE TABLE IF NOT EXISTS anime_translates (
    anime VARCHAR(100) NOT NULL,
    language VARCHAR(2) NOT NULL,
    PRIMARY KEY (anime, language)
);

#DROP TABLE IF EXISTS users;
#DROP TABLE IF EXISTS servers;
#DROP TABLE IF EXISTS manga_translates;
#DROP TABLE IF EXISTS anime_translates;